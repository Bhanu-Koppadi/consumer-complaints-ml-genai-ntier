import logging
import threading

import psycopg2
import psycopg2.pool
from psycopg2.extras import RealDictCursor
from werkzeug.security import generate_password_hash

from config import Config

logger = logging.getLogger(__name__)


class Database:
    def __init__(self):
        self.conn_url = Config.DATABASE_URL
        self._pool = None
        self._pool_lock = threading.Lock()

    def _get_pool(self):
        """Return the connection pool, initialising it on first call (thread-safe)."""
        if self._pool is None:
            with self._pool_lock:
                if self._pool is None:
                    self._pool = psycopg2.pool.ThreadedConnectionPool(
                        minconn=1,
                        maxconn=10,
                        dsn=self.conn_url,
                    )
        return self._pool

    def get_connection(self):
        """Acquire a connection from the pool."""
        try:
            return self._get_pool().getconn()
        except psycopg2.Error as e:
            logger.error("Database connection error: %s", e)
            return None

    def save_complaint(self, user_id, text):
        """Save a new complaint."""
        conn = self.get_connection()
        if not conn:
            return None

        try:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO complaints (user_id, complaint_text) VALUES (%s, %s) RETURNING id", (user_id, text)
                )
                complaint_id = cur.fetchone()[0]
                conn.commit()
                return complaint_id
        except psycopg2.Error as e:
            conn.rollback()
            logger.error("Error saving complaint: %s", e)
            return None
        finally:
            if conn:
                self._get_pool().putconn(conn)

    def save_classification(
        self,
        complaint_id,
        category,
        confidence,
        severity: str = "Low",
        priority: str = "P3",
        recommended_action: str = "review_required",
        response_status: str = "pending",
    ) -> bool:
        """Save classification result including advanced intelligence fields."""
        conn = self.get_connection()
        if not conn:
            return False

        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO classification_results
                        (complaint_id, category, confidence, severity, priority, recommended_action, response_status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (complaint_id, category, confidence, severity, priority, recommended_action, response_status),
                )
                conn.commit()
                return True
        except psycopg2.Error as e:
            conn.rollback()
            logger.error("Error saving classification: %s", e)
            return False
        finally:
            if conn:
                self._get_pool().putconn(conn)

    def save_explanation(self, complaint_id, explanation) -> bool:
        """Save GenAI explanation."""
        conn = self.get_connection()
        if not conn:
            return False

        try:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO ai_explanations (complaint_id, explanation) VALUES (%s, %s)",
                    (complaint_id, explanation),
                )
                conn.commit()
                return True
        except psycopg2.Error as e:
            conn.rollback()
            logger.error("Error saving explanation: %s", e)
            return False
        finally:
            if conn:
                self._get_pool().putconn(conn)

    def delete_complaint(self, complaint_id: int) -> bool:
        """Delete a complaint row by id. Used to clean failed partial writes."""
        conn = self.get_connection()
        if not conn:
            return False

        try:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM complaints WHERE id = %s", (complaint_id,))
                deleted = cur.rowcount > 0
                conn.commit()
                return deleted
        except psycopg2.Error as e:
            conn.rollback()
            logger.error("Error deleting complaint %s: %s", complaint_id, e)
            return False
        finally:
            if conn:
                self._get_pool().putconn(conn)

    def get_complaint_by_id(self, complaint_id):
        """Fetch a single complaint with its latest classification and explanation."""
        conn = self.get_connection()
        if not conn:
            return None

        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT
                        c.id,
                        c.user_id,
                        c.complaint_text,
                        c.created_at,
                        u.email AS user_email,
                        cr.category,
                        cr.confidence,
                        cr.severity,
                        cr.priority,
                        cr.recommended_action,
                        cr.response_status,
                        cr.auto_sent_at,
                        cr.draft_response_text,
                        cr.final_response_text,
                        cr.sent_to_email,
                        cr.delivery_mode,
                        cr.created_at AS classified_at,
                        ae.explanation
                    FROM complaints c
                    LEFT JOIN users u ON c.user_id = u.id
                    LEFT JOIN LATERAL (
                        SELECT category, confidence, severity, priority, recommended_action,
                               response_status, auto_sent_at, draft_response_text,
                               final_response_text, sent_to_email, delivery_mode, created_at
                        FROM classification_results
                        WHERE complaint_id = c.id
                        ORDER BY created_at DESC
                        LIMIT 1
                    ) cr ON true
                    LEFT JOIN LATERAL (
                        SELECT explanation
                        FROM ai_explanations
                        WHERE complaint_id = c.id
                        ORDER BY created_at DESC
                        LIMIT 1
                    ) ae ON true
                    WHERE c.id = %s
                    """,
                    (complaint_id,),
                )
                return cur.fetchone()
        except psycopg2.Error as e:
            logger.error("Error fetching complaint by ID: %s", e)
            return None
        finally:
            if conn:
                self._get_pool().putconn(conn)

    def update_response_workflow(
        self,
        complaint_id: int,
        *,
        response_status: str,
        draft_response_text: str | None = None,
        final_response_text: str | None = None,
        sent_to_email: str | None = None,
        delivery_mode: str | None = None,
        auto_sent_at=None,
        override_by_user_id: int | None = None,
        override_at=None,
    ) -> bool:
        """Update workflow and delivery fields on the latest classification row."""
        conn = self.get_connection()
        if not conn:
            return False

        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE classification_results
                    SET response_status = %s,
                        draft_response_text = COALESCE(%s, draft_response_text),
                        final_response_text = COALESCE(%s, final_response_text),
                        sent_to_email = COALESCE(%s, sent_to_email),
                        delivery_mode = COALESCE(%s, delivery_mode),
                        auto_sent_at = COALESCE(%s, auto_sent_at),
                        override_by_user_id = COALESCE(%s, override_by_user_id),
                        override_at = COALESCE(%s, override_at)
                    WHERE id = (
                        SELECT id
                        FROM classification_results
                        WHERE complaint_id = %s
                        ORDER BY created_at DESC
                        LIMIT 1
                    )
                    """,
                    (
                        response_status,
                        draft_response_text,
                        final_response_text,
                        sent_to_email,
                        delivery_mode,
                        auto_sent_at,
                        override_by_user_id,
                        override_at,
                        complaint_id,
                    ),
                )
                conn.commit()
                return cur.rowcount > 0
        except psycopg2.Error as e:
            conn.rollback()
            logger.error("Error updating response workflow: %s", e)
            return False
        finally:
            if conn:
                self._get_pool().putconn(conn)

    def get_complaints_by_user(self, user_id: int):
        """Return all complaints with latest classification for a given user.

        Args:
            user_id: The authenticated user's ID.

        Returns:
            List of complaint rows (RealDictRow), newest first, or None on error.
        """
        conn = self.get_connection()
        if not conn:
            return None

        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT
                        c.id,
                        c.complaint_text,
                        c.created_at,
                        cr.category,
                        cr.confidence,
                        cr.response_status,
                        cr.sent_to_email,
                        cr.delivery_mode
                    FROM complaints c
                    LEFT JOIN LATERAL (
                        SELECT category, confidence, response_status, sent_to_email, delivery_mode
                        FROM classification_results
                        WHERE complaint_id = c.id
                        ORDER BY created_at DESC
                        LIMIT 1
                    ) cr ON true
                    WHERE c.user_id = %s
                    ORDER BY c.created_at DESC
                    """,
                    (user_id,),
                )
                return cur.fetchall()
        except psycopg2.Error as e:
            logger.error("Error fetching complaints for user %s: %s", user_id, e)
            return None
        finally:
            if conn:
                self._get_pool().putconn(conn)

    def get_admin_complaints(self, page: int, limit: int, category=None, min_confidence=None, status_filter=None):
        """Fetch paginated complaints with optional category/confidence/status filters."""
        conn = self.get_connection()
        if not conn:
            return None, 0

        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                conditions = []
                params: list = []
                bound_param_conditions = 0
                if category is not None:
                    conditions.append("cr.category = %s")
                    params.append(category)
                    bound_param_conditions += 1
                if min_confidence is not None:
                    conditions.append("cr.confidence >= %s")
                    params.append(min_confidence)
                    bound_param_conditions += 1
                if status_filter == "resolved":
                    conditions.append("cr.response_status IN ('approved', 'overridden', 'auto_sent')")
                elif status_filter == "active":
                    conditions.append("COALESCE(cr.response_status, 'pending') IN ('pending', 'escalated')")

                # SAFETY: where_clause is assembled from hard-coded SQL literals only.
                # All user-controlled values are bound through 'params' via %s placeholders.
                # Never embed user-supplied strings directly into conditions.
                where_clause = ("WHERE " + " AND ".join(conditions)) if conditions else ""
                # Verify every placeholder-based condition contributes exactly one bound parameter.
                if len(params) != bound_param_conditions:
                    raise AssertionError(
                        "Each placeholder condition must correspond to exactly one bound parameter; "
                        "never interpolate user input directly into SQL."
                    )
                count_sql = f"""
                    SELECT COUNT(*) AS total
                    FROM complaints c
                    LEFT JOIN LATERAL (
                        SELECT category, confidence, response_status
                        FROM classification_results
                        WHERE complaint_id = c.id
                        ORDER BY created_at DESC
                        LIMIT 1
                    ) cr ON true
                    {where_clause}
                """
                cur.execute(count_sql, params)
                total = cur.fetchone()["total"]

                offset = (page - 1) * limit
                data_sql = f"""
                    SELECT c.id, c.user_id, c.complaint_text, c.created_at,
                           cr.category, cr.confidence,
                          cr.severity, cr.priority, cr.recommended_action,
                          cr.response_status, cr.sent_to_email, cr.delivery_mode,
                           u.username AS submitted_by_username
                    FROM complaints c
                    LEFT JOIN users u ON c.user_id = u.id
                    LEFT JOIN LATERAL (
                       SELECT category, confidence, severity, priority, recommended_action,
                           response_status, sent_to_email, delivery_mode
                        FROM classification_results
                        WHERE complaint_id = c.id
                        ORDER BY created_at DESC
                        LIMIT 1
                    ) cr ON true
                    {where_clause}
                    ORDER BY c.created_at DESC
                    LIMIT %s OFFSET %s
                """
                cur.execute(data_sql, params + [limit, offset])
                rows = cur.fetchall()
                return list(rows), total
        except psycopg2.Error as e:
            logger.error("Error fetching admin complaints: %s", e)
            return None, 0
        finally:
            if conn:
                self._get_pool().putconn(conn)

    def get_admin_statistics(self):
        """Fetch aggregate statistics for the admin dashboard."""
        conn = self.get_connection()
        if not conn:
            return None

        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT
                        COUNT(*) AS total_complaints,
                        AVG(cr.confidence) AS average_confidence,
                        SUM(CASE WHEN cr.confidence < 0.5 THEN 1 ELSE 0 END) AS low_confidence_count,
                        MIN(c.created_at)::date AS start_date,
                        MAX(c.created_at)::date AS end_date
                    FROM complaints c
                    LEFT JOIN LATERAL (
                        SELECT confidence
                        FROM classification_results
                        WHERE complaint_id = c.id
                        ORDER BY created_at DESC
                        LIMIT 1
                    ) cr ON true
                    """)
                stats = cur.fetchone()

                cur.execute(
                    """
                    SELECT cr.category, COUNT(*) AS count
                    FROM complaints c
                    JOIN LATERAL (
                        SELECT category
                        FROM classification_results
                        WHERE complaint_id = c.id
                        ORDER BY created_at DESC
                        LIMIT 1
                    ) cr ON true
                    GROUP BY cr.category
                    ORDER BY count DESC
                    """
                    # INNER JOIN intentional: exclude complaints without a classification
                )
                by_category = {row["category"]: row["count"] for row in cur.fetchall()}

                # Severity breakdown (v2 columns — zero if migration not yet applied)
                cur.execute(
                    """
                    SELECT
                        COALESCE(SUM(CASE WHEN cr.severity = 'High'   THEN 1 ELSE 0 END), 0) AS high_severity_count,
                        COALESCE(SUM(CASE WHEN cr.severity = 'Medium' THEN 1 ELSE 0 END), 0) AS medium_severity_count,
                        COALESCE(SUM(CASE WHEN cr.severity = 'Low'    THEN 1 ELSE 0 END), 0) AS low_severity_count,
                        COALESCE(SUM(CASE WHEN cr.recommended_action = 'auto_send'        THEN 1 ELSE 0 END), 0) AS auto_send_count,
                        COALESCE(SUM(CASE WHEN cr.recommended_action = 'review_required'  THEN 1 ELSE 0 END), 0) AS review_required_count,
                        COALESCE(SUM(CASE WHEN cr.recommended_action = 'escalate'         THEN 1 ELSE 0 END), 0) AS escalated_count
                    FROM complaints c
                    LEFT JOIN LATERAL (
                        SELECT severity, recommended_action
                        FROM classification_results
                        WHERE complaint_id = c.id
                        ORDER BY created_at DESC
                        LIMIT 1
                    ) cr ON true
                    """
                )
                severity_stats = cur.fetchone() or {}

                return {
                    "total_complaints": stats["total_complaints"],
                    "by_category": by_category,
                    "average_confidence": (
                        float(stats["average_confidence"]) if stats["average_confidence"] is not None else 0.0
                    ),
                    "low_confidence_count": int(stats["low_confidence_count"] or 0),
                    "date_range": {
                        "start": str(stats["start_date"]) if stats["start_date"] else None,
                        "end": str(stats["end_date"]) if stats["end_date"] else None,
                    },
                    "high_severity_count": int(severity_stats.get("high_severity_count") or 0),
                    "medium_severity_count": int(severity_stats.get("medium_severity_count") or 0),
                    "low_severity_count": int(severity_stats.get("low_severity_count") or 0),
                    "auto_send_count": int(severity_stats.get("auto_send_count") or 0),
                    "review_required_count": int(severity_stats.get("review_required_count") or 0),
                    "escalated_count": int(severity_stats.get("escalated_count") or 0),
                }
        except psycopg2.Error as e:
            logger.error("Error fetching admin statistics: %s", e)
            return None
        finally:
            if conn:
                self._get_pool().putconn(conn)

    def get_explanation(self, complaint_id):
        """Fetch the latest explanation for a complaint."""
        conn = self.get_connection()
        if not conn:
            return None

        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT complaint_id, explanation, created_at
                    FROM ai_explanations
                    WHERE complaint_id = %s
                    ORDER BY created_at DESC
                    LIMIT 1
                    """,
                    (complaint_id,),
                )
                return cur.fetchone()
        except psycopg2.Error as e:
            logger.error("Error fetching explanation: %s", e)
            return None
        finally:
            if conn:
                self._get_pool().putconn(conn)

    def create_user(self, username: str, email: str, password_hash: str, role: str = "USER"):
        """Insert a new user and return the created row (id, username, role)."""
        conn = self.get_connection()
        if not conn:
            return None

        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    INSERT INTO users (username, email, password_hash, role)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, username, role
                    """,
                    (username, email, password_hash, role),
                )
                user = cur.fetchone()
                conn.commit()
                return user
        except psycopg2.Error as e:
            conn.rollback()
            logger.error("Error creating user: %s", e)
            return None
        finally:
            if conn:
                self._get_pool().putconn(conn)

    def find_user_by_username(self, username: str):
        """Return the user row for *username*, or None if not found."""
        conn = self.get_connection()
        if not conn:
            return None

        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    "SELECT id, username, password_hash, role FROM users WHERE username = %s",
                    (username,),
                )
                return cur.fetchone()
        except psycopg2.Error as e:
            logger.error("Error finding user: %s", e)
            return None
        finally:
            if conn:
                self._get_pool().putconn(conn)


# Singleton
db = Database()


def create_default_users():
    """Create default admin and user accounts if configured and they do not exist."""
    if not Config.CREATE_DEFAULT_USERS:
        return
    admin_password = Config.DEFAULT_ADMIN_PASSWORD
    user_password = Config.DEFAULT_USER_PASSWORD
    if not admin_password or not user_password:
        logger.warning(
            "CREATE_DEFAULT_USERS is enabled but DEFAULT_ADMIN_PASSWORD/DEFAULT_USER_PASSWORD "
            "are not set. Skipping default user creation."
        )
        return
    admin_username = Config.DEFAULT_ADMIN_USERNAME
    user_username = Config.DEFAULT_USER_USERNAME
    if db.find_user_by_username(admin_username) is None:
        db.create_user(
            username=admin_username,
            email=Config.DEFAULT_ADMIN_EMAIL,
            password_hash=generate_password_hash(admin_password),
            role="ADMIN",
        )
        logger.info("Created default admin user: %s", admin_username)
    if db.find_user_by_username(user_username) is None:
        db.create_user(
            username=user_username,
            email=Config.DEFAULT_USER_EMAIL,
            password_hash=generate_password_hash(user_password),
            role="USER",
        )
        logger.info("Created default user: %s", user_username)


def init_db():
    """Initialize DB and create default users if configured."""
    create_default_users()
