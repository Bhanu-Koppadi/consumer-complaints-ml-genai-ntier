import logging
import re
from datetime import datetime, timezone
from functools import wraps
from pathlib import Path

from flask import Flask, Response, jsonify, request, send_file
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    create_refresh_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
    verify_jwt_in_request,
)
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.security import check_password_hash, generate_password_hash

from config import Config
from database.db import db, init_db
from genai.email_sender import send_response_email
from genai.explanation import generate_explanation
from genai.response_drafter import draft_response as draft_response_fn
from ml.decision_engine import make_decision
from ml.predictor import predict_complaint
from ml.severity_detector import detect_severity

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

_REPO_ROOT = Path(__file__).resolve().parents[2]
_OPENAPI_SPEC_PATH = _REPO_ROOT / "docs" / "api" / "openapi.yaml"

#: Maximum accepted complaint text length (characters). Protects ML inference from DoS.
_MAX_COMPLAINT_LENGTH = 5000

#: Email format validation pattern — requires local-part, @, domain, and TLD.
_EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

app = Flask(__name__)
app.config.from_object(Config)
Config.warn_insecure_defaults()
init_db()
CORS(app, origins=Config.ALLOWED_ORIGINS)  # Restrict CORS to configured origins
jwt = JWTManager(app)
limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    storage_uri=Config.RATELIMIT_STORAGE_URI,
    default_limits=[],
)


def _validate_complaint_text(text: object) -> tuple[str | None, int | None]:
    """Validate complaint text presence, type, and length.

    Args:
        text: The value to validate.

    Returns:
        tuple: ``(None, None)`` when valid; ``(error_message, http_status)`` when invalid.
    """
    if not isinstance(text, str) or not text.strip():
        return "complaint_text must be a non-empty string", 400
    if len(text) > _MAX_COMPLAINT_LENGTH:
        return f"complaint_text must not exceed {_MAX_COMPLAINT_LENGTH} characters", 400
    return None, None


@app.route("/", methods=["GET"])
def root():
    return jsonify(
        {
            "status": "ok",
            "message": "Consumer Complaints ML + GenAI System API",
            "health": "/health",
            "openapi": "/api/openapi.yaml",
            "swagger": "/api/docs",
        }
    )


@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "app_name": "Consumer Complaints ML + GenAI System", "version": "1.0.0"})


@app.route("/api/openapi.yaml", methods=["GET"])
def openapi_spec():
    if not _OPENAPI_SPEC_PATH.exists():
        return jsonify({"error": "OpenAPI spec not found"}), 404
    return send_file(_OPENAPI_SPEC_PATH, mimetype="application/yaml")


@app.route("/api/docs", methods=["GET"])
def swagger_ui():
    html = """<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Consumer Complaints API Docs</title>
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
    </head>
    <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
        <script>
            window.addEventListener("load", function () {
                window.ui = SwaggerUIBundle({
                    url: "/api/openapi.yaml",
                    dom_id: "#swagger-ui",
                    deepLinking: true,
                    presets: [SwaggerUIBundle.presets.apis],
                });
            });
        </script>
    </body>
</html>
"""
    return Response(html, mimetype="text/html")


@app.route("/api/info", methods=["GET"])
def api_info():
    return jsonify(
        {
            "name": "Consumer Complaints API",
            "description": "Classifies consumer complaints and generates explanations",
            "endpoints": [
                "GET  /",
                "GET  /health",
                "GET  /api/openapi.yaml",
                "GET  /api/docs",
                "GET  /api/info",
                "POST /api/auth/register",
                "POST /api/auth/login",
                "POST /api/auth/refresh",
                "POST /api/classify",
                "POST /api/complaints",
                "GET  /api/complaints",
                "GET  /api/complaints/<id>",
                "GET  /api/explanation/<id>",
                "POST /api/draft-response",
                "GET  /api/admin/complaints",
                "GET  /api/admin/statistics",
            ],
        }
    )


# ---------------------------------------------------------------------------
# Phase 11: JWT Authentication endpoints
# ---------------------------------------------------------------------------


@app.route("/api/auth/register", methods=["POST"])
@limiter.limit("10/minute")
def auth_register():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    if not username or not email or not password:
        return jsonify({"error": "username, email and password are required"}), 400
    if len(username) < 3 or len(username) > 50:
        return jsonify({"error": "username must be between 3 and 50 characters"}), 400
    if len(password) < 8:
        return jsonify({"error": "password must be at least 8 characters"}), 400
    if not _EMAIL_REGEX.match(email):
        return jsonify({"error": "Invalid email format"}), 400

    if db.find_user_by_username(username) is not None:
        return jsonify({"error": "Username already taken"}), 409

    password_hash = generate_password_hash(password)
    user = db.create_user(username, email, password_hash)
    if user is None:
        return jsonify({"error": "Registration failed"}), 500

    return (
        jsonify(
            {
                "message": "User registered successfully",
                "user": {"id": user["id"], "username": user["username"], "role": user["role"]},
            }
        ),
        201,
    )


@app.route("/api/auth/login", methods=["POST"])
@limiter.limit("10/minute")
def auth_login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"error": "username and password are required"}), 400

    user = db.find_user_by_username(username)
    if user is None or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid credentials"}), 401

    identity = str(user["id"])
    role_claim = {"role": user["role"]}
    access_token = create_access_token(identity=identity, additional_claims=role_claim)
    refresh_token = create_refresh_token(identity=identity, additional_claims=role_claim)
    expires_in = int(app.config["JWT_ACCESS_TOKEN_EXPIRES"].total_seconds())

    return jsonify(
        {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "Bearer",
            "expires_in": expires_in,
            "user": {"id": user["id"], "username": user["username"], "role": user["role"]},
        }
    )


@app.route("/api/auth/refresh", methods=["POST"])
@jwt_required(refresh=True)
def auth_refresh():
    identity = get_jwt_identity()
    role_claim = {"role": get_jwt().get("role")}
    access_token = create_access_token(identity=identity, additional_claims=role_claim)
    expires_in = int(app.config["JWT_ACCESS_TOKEN_EXPIRES"].total_seconds())
    return jsonify({"access_token": access_token, "token_type": "Bearer", "expires_in": expires_in})


@app.route("/api/classify", methods=["POST"])
@limiter.limit("5/minute")
@jwt_required(optional=True)
def classify_complaint_endpoint():
    data = request.get_json(silent=True) or {}
    if "complaint_text" not in data:
        return jsonify({"error": "No complaint_text provided"}), 400

    text = data["complaint_text"]
    err_msg, status = _validate_complaint_text(text)
    if err_msg:
        return jsonify({"error": err_msg}), status

    _identity = get_jwt_identity()
    user_id = int(_identity) if _identity is not None else None  # None for unauthenticated guests
    complaint_id = None

    try:
        # 1. Predict Category
        prediction = predict_complaint(text)
        category = prediction["category"]
        confidence = prediction["confidence"]

        # 2. Severity Detection
        severity_info = detect_severity(text)
        severity = severity_info["severity"]
        priority = severity_info["priority"]
        severity_reason = severity_info["severity_reason"]

        # 3. Decision Engine — routing action
        decision = make_decision(confidence, severity)

        # 4. Generate Explanation (fallback keeps classify successful when GenAI is unavailable)
        try:
            explanation = generate_explanation(text, category)
        except Exception as genai_error:
            logger.warning("Falling back to default explanation due to GenAI error: %s", genai_error)
            explanation = (
                f"This complaint was classified as {category} by the ML model. "
                "Detailed explanation is temporarily unavailable."
            )

        # 5. Persist complaint only after classification pipeline succeeds.
        complaint_id = db.save_complaint(user_id, text)
        if complaint_id is None:
            raise RuntimeError("Failed to save complaint")

        # 6. Persist classification and fail fast if write did not succeed.
        saved_classification = db.save_classification(
            complaint_id,
            category,
            confidence,
            severity=severity,
            priority=priority,
            recommended_action=decision.recommended_action,
            response_status=("escalated" if decision.recommended_action == "escalate" else "pending"),
        )
        if not saved_classification:
            db.delete_complaint(complaint_id)
            raise RuntimeError("Failed to save classification")

        # 7. Persist explanation if possible (non-blocking).
        if not db.save_explanation(complaint_id, explanation):
            logger.warning("Explanation persistence failed for complaint %s", complaint_id)

        auto_response_sent = False
        delivery_mode = "pending"
        response_status = "pending"

        # 8. Auto-send high-confidence replies for registered users with email addresses.
        if complaint_id is not None and decision.auto_send_eligible and user_id is not None:
            complaint_record = db.get_complaint_by_id(complaint_id)
            recipient_email = complaint_record.get("user_email") if complaint_record else None
            if recipient_email:
                draft_response = draft_response_fn(text, category, float(confidence))
                subject = f"Response to your complaint #{complaint_id}"
                delivery = send_response_email(recipient_email, subject, draft_response)
                auto_response_sent = bool(delivery["success"])
                delivery_mode = str(delivery["delivery_mode"])
                response_status = "auto_sent" if auto_response_sent else "pending"
                db.update_response_workflow(
                    complaint_id,
                    response_status=response_status,
                    draft_response_text=draft_response,
                    final_response_text=draft_response,
                    sent_to_email=recipient_email,
                    delivery_mode=delivery_mode,
                    auto_sent_at=datetime.now(timezone.utc),
                )
        elif decision.recommended_action == "escalate":
            response_status = "escalated"

        return jsonify(
            {
                "complaint_id": complaint_id,
                "category": category,
                "confidence": confidence,
                "explanation": explanation,
                # Advanced intelligence fields
                "severity": severity,
                "priority": priority,
                "severity_reason": severity_reason,
                "recommended_action": decision.recommended_action,
                "auto_send_eligible": decision.auto_send_eligible,
                "routing_reason": decision.routing_reason,
                "response_status": response_status,
                "auto_response_sent": auto_response_sent,
                "delivery_mode": delivery_mode,
            }
        )

    except Exception as e:
        logger.error("Error processing complaint: %s", e)
        return jsonify({"error": "An internal error occurred while processing the complaint"}), 500


@app.route("/api/complaints", methods=["POST"])
@limiter.limit("20/minute")
@jwt_required()
def submit_complaint():
    # Only submits without immediate classification (if needed separately)
    data = request.get_json(silent=True) or {}
    if "complaint_text" not in data:
        return jsonify({"error": "No complaint_text provided"}), 400

    text = data["complaint_text"]
    err_msg, status = _validate_complaint_text(text)
    if err_msg:
        return jsonify({"error": err_msg}), status

    try:
        user_id = int(get_jwt_identity())
        complaint_id = db.save_complaint(user_id, text)
        return jsonify({"message": "Complaint submitted successfully", "id": complaint_id}), 201
    except Exception as e:
        logger.error("Error submitting complaint: %s", e)
        return jsonify({"error": "An internal error occurred while submitting the complaint"}), 500


@app.route("/api/complaints", methods=["GET"])
@jwt_required()
def get_user_complaints():
    """Return the authenticated user's complaint history, newest first.

    Returns:
        JSON with ``complaints`` list; each item has id, complaint_text,
        category, confidence, response workflow fields, and created_at.
    """
    current_user_id = int(get_jwt_identity())
    rows = db.get_complaints_by_user(current_user_id)
    if rows is None:
        return jsonify({"error": "Database error"}), 500

    complaints = [
        {
            "id": r["id"],
            "complaint_text": r["complaint_text"],
            "category": r.get("category"),
            "confidence": float(r["confidence"]) if r.get("confidence") is not None else None,
            "response_status": r.get("response_status"),
            "sent_to_email": r.get("sent_to_email"),
            "delivery_mode": r.get("delivery_mode"),
            "created_at": r["created_at"].isoformat() if r.get("created_at") else None,
        }
        for r in rows
    ]
    return jsonify({"complaints": complaints})


@app.route("/api/complaints/<int:complaint_id>", methods=["GET"])
def get_complaint_by_id_endpoint(complaint_id):
    verify_jwt_in_request()
    current_user_id = int(get_jwt_identity())
    role = get_jwt().get("role", "USER")

    record = db.get_complaint_by_id(complaint_id)
    if not record:
        return jsonify({"error": "Complaint not found"}), 404

    if role != "ADMIN" and record.get("user_id") != current_user_id:
        return jsonify({"error": "Forbidden", "message": "You can only access your own complaints", "status": 403}), 403

    return jsonify(
        {
            "id": record["id"],
            "complaint_text": record["complaint_text"],
            "user_email": record.get("user_email"),
            "category": record.get("category"),
            "confidence": record.get("confidence"),
            "explanation": record.get("explanation"),
            "severity": record.get("severity"),
            "priority": record.get("priority"),
            "recommended_action": record.get("recommended_action"),
            "response_status": record.get("response_status"),
            "draft_response_text": record.get("draft_response_text"),
            "final_response_text": record.get("final_response_text"),
            "sent_to_email": record.get("sent_to_email"),
            "delivery_mode": record.get("delivery_mode"),
            "auto_sent_at": record["auto_sent_at"].isoformat() if record.get("auto_sent_at") else None,
            "created_at": record["created_at"].isoformat() if record.get("created_at") else None,
            "classified_at": record["classified_at"].isoformat() if record.get("classified_at") else None,
        }
    )


@app.route("/api/explanation/<int:complaint_id>", methods=["GET"])
@jwt_required(optional=True)
def get_explanation_endpoint(complaint_id):
    record = db.get_explanation(complaint_id)
    if not record:
        return jsonify({"error": "Explanation not found"}), 404

    return jsonify(
        {
            "complaint_id": record["complaint_id"],
            "explanation": record["explanation"],
            "created_at": record["created_at"].isoformat() if record.get("created_at") else None,
        }
    )


@app.route("/api/draft-response", methods=["POST"])
@limiter.limit("5/minute")
@jwt_required()
def draft_response_endpoint():
    data = request.get_json(silent=True) or {}
    complaint_text = data.get("complaint_text")
    category = data.get("category")
    confidence = data.get("confidence")

    err_msg, status = _validate_complaint_text(complaint_text)
    if err_msg:
        return jsonify({"error": err_msg}), status

    if not isinstance(category, str) or not category.strip():
        return jsonify({"error": "category must be a non-empty string"}), 400

    if confidence is None or not isinstance(confidence, (int, float)):
        return jsonify({"error": "confidence must be a number"}), 400

    if not (0.0 <= float(confidence) <= 1.0):
        return jsonify({"error": "confidence must be between 0.0 and 1.0"}), 400

    try:
        draft = draft_response_fn(complaint_text, category, float(confidence))
        return jsonify({"draft_response": draft})
    except Exception as e:
        logger.error("Error drafting response: %s", e)
        return jsonify({"error": "An internal error occurred while drafting the response"}), 500


def admin_required(f):
    """Decorator that enforces ADMIN role via JWT claims."""

    @wraps(f)
    def decorated(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()
        if claims.get("role") != "ADMIN":
            return jsonify({"error": "Forbidden", "message": "Admin access required", "status": 403}), 403
        return f(*args, **kwargs)

    return decorated


@app.route("/api/admin/complaints/<int:complaint_id>/reply", methods=["POST"])
@admin_required
def admin_send_reply_endpoint(complaint_id):
    data = request.get_json(silent=True) or {}
    message = data.get("message")

    if not isinstance(message, str) or not message.strip():
        return jsonify({"error": "message must be a non-empty string"}), 400

    record = db.get_complaint_by_id(complaint_id)
    if not record:
        return jsonify({"error": "Complaint not found"}), 404

    recipient_email = record.get("user_email")
    if not recipient_email:
        return jsonify({"error": "No recipient email available for this complaint"}), 400

    subject = f"Reviewed response to your complaint #{complaint_id}"
    delivery = send_response_email(recipient_email, subject, message.strip())
    if not delivery["success"]:
        return jsonify({"error": str(delivery["message"])}), 502

    admin_id = int(get_jwt_identity())
    existing_draft = record.get("draft_response_text")
    response_status = "approved" if existing_draft and existing_draft.strip() == message.strip() else "overridden"
    db.update_response_workflow(
        complaint_id,
        response_status=response_status,
        final_response_text=message.strip(),
        sent_to_email=recipient_email,
        delivery_mode=str(delivery["delivery_mode"]),
        override_by_user_id=admin_id,
        override_at=datetime.now(timezone.utc),
    )

    return jsonify(
        {
            "message": "Reply sent successfully",
            "response_status": response_status,
            "delivery_mode": delivery["delivery_mode"],
            "sent_to_email": recipient_email,
        }
    )


@app.route("/api/admin/complaints", methods=["GET"])
@admin_required
def admin_list_complaints():
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 20))
        if page < 1 or limit < 1:
            raise ValueError
        limit = min(limit, 100)
        category = request.args.get("category")
        min_conf = request.args.get("min_confidence")
        min_confidence = float(min_conf) if min_conf is not None else None
        status_filter = request.args.get("status")
        if status_filter not in (None, "all", "active", "resolved"):
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid query parameters"}), 400

    rows, total = db.get_admin_complaints(
        page,
        limit,
        category=category,
        min_confidence=min_confidence,
        status_filter=(None if status_filter in (None, "all") else status_filter),
    )
    if rows is None:
        return jsonify({"error": "Database error"}), 500

    complaints = [
        {
            "id": r["id"],
            "user_id": r.get("user_id"),
            "submitted_by_username": r.get("submitted_by_username"),
            "complaint_text": r["complaint_text"],
            "category": r.get("category"),
            "confidence": float(r["confidence"]) if r.get("confidence") is not None else None,
            "severity": r.get("severity"),
            "priority": r.get("priority"),
            "recommended_action": r.get("recommended_action"),
            "response_status": r.get("response_status"),
            "sent_to_email": r.get("sent_to_email"),
            "delivery_mode": r.get("delivery_mode"),
            "created_at": r["created_at"].isoformat() if r.get("created_at") else None,
        }
        for r in rows
    ]
    return jsonify({"total": total, "page": page, "limit": limit, "complaints": complaints})


@app.route("/api/admin/statistics", methods=["GET"])
@admin_required
def admin_statistics():
    stats = db.get_admin_statistics()
    if stats is None:
        return jsonify({"error": "Database error"}), 500
    return jsonify(stats)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
