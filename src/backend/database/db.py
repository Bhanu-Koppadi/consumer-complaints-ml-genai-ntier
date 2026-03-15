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

    def save_classification(self, complaint_id, category, confidence):
        """Save classification result."""
        conn = self.get_connection()
        if not conn:
            return

        try:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO classification_results (complaint_id, category, confidence) VALUES (%s, %s, %s)",
                    (complaint_id, category, confidence),
                )
                conn.commit()
        except psycopg2.Error as e:
            conn.rollback()
            logger.error("Error saving classification: %s", e)
        finally:
            if conn:
                self._get_pool().putconn(conn)

    def save_explanation(self, complaint_id, explanation):
        """Save GenAI explanation."""
        conn = self.get_connection()
        if not conn:
            return

        try:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO ai_explanations (complaint_id, explanation) VALUES (%s, %s)",
                    (complaint_id, explanation),
                )
                conn.commit()
        except psycopg2.Error as e:
            conn.rollback()
            logger.error("Error saving explanation: %s", e)
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
                        cr.category,
                        cr.confidence,
                        cr.created_at AS classified_at,
                        ae.explanation
                    FROM complaints c
                    LEFT JOIN LATERAL (
                        SELECT category, confidence, created_at
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
                        cr.confidence
                    FROM complaints c
                    LEFT JOIN LATERAL (
                        SELECT category, confidence
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

    def get_admin_complaints(self, page: int, limit: int, category=None, min_confidence=None):
        """Fetch paginated complaints with optional category / confidence filters."""
        conn = self.get_connection()
        if not conn:
            return None, 0

        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                conditions = []
                params: list = []
                if category is not None:
                    conditions.append("cr.category = %s")
                    params.append(category)
                if min_confidence is not None:
                    conditions.append("cr.confidence >= %s")
                    params.append(min_confidence)

                # SAFETY: where_clause is assembled from hard-coded SQL literals only.
                # All user-controlled values are bound through 'params' via %s placeholders.
                # Never embed user-supplied strings directly into conditions.
                where_clause = ("WHERE " + " AND ".join(conditions)) if conditions else ""
                # Verify every condition contributes exactly one bound parameter.
                if len(params) != len(conditions):
                    raise AssertionError(
                        "Each filter condition must correspond to exactly one bound parameter; "
                        "never interpolate user input directly into SQL."
                    )
                count_sql = f"""
                    SELECT COUNT(*) AS total
                    FROM complaints c
                    LEFT JOIN LATERAL (
                        SELECT category, confidence
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
                           u.username AS submitted_by_username
                    FROM complaints c
                    LEFT JOIN users u ON c.user_id = u.id
                    LEFT JOIN LATERAL (
                        SELECT category, confidence
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
