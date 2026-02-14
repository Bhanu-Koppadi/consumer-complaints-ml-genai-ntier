# Database - Consumer Complaints ML + GenAI System

This directory contains the PostgreSQL database schema for the AI-Based Consumer Complaints Classification System.

**Source of truth:** `schema.sql` is the canonical schema definition. Any change must be applied to `schema.sql` first and then reflected in `docs/11_database_schema.md`.

## 📁 Contents

- `schema.sql` - Complete PostgreSQL schema definition with tables, indexes, and comments
- `queries-for-daily-user.sql` - Common queries for testing and development

## 🗄️ Database Schema

For full schema details (tables, relationships, indexes, constraints, and queries), see `docs/11_database_schema.md`.

## 🚀 Setup Instructions

### Prerequisites

- PostgreSQL 13 or higher installed and running
- Database admin credentials

### Option 1: Using psql (Command Line)

```powershell
# Create the database
psql -U postgres -c "CREATE DATABASE consumer_complaints;"

# Apply the schema
psql -U postgres -d consumer_complaints -f schema.sql
```

### Option 2: Using Docker Compose

```powershell
# Start PostgreSQL container
docker compose -f ../docker-compose.yml up -d

# Wait for database to be ready
Start-Sleep -Seconds 10

# Apply the schema
psql -h localhost -p 5432 -U postgres -d consumer_complaints -f schema.sql
```

### Option 3: Using pgAdmin (GUI)

1. Open pgAdmin
2. Right-click on "Databases" → "Create" → "Database..."
3. Name: `consumer_complaints`
4. Click "Save"
5. Right-click on the new database → "Query Tool"
6. Open `schema.sql` and execute

### Verification

After applying the schema, verify the tables were created:

```sql
-- List all tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Count rows in each table (should be 0 for new database)
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM complaints;
SELECT COUNT(*) FROM classification_results;
SELECT COUNT(*) FROM ai_explanations;
```

## 🔐 Security Notes

Security considerations are documented in `docs/11_database_schema.md`.

## 🧪 Testing

To test the schema with sample data, see the commented section at the end of `schema.sql`.

## 📚 Integration

The database access layer in `database/db.py` mirrors this schema structure. Any changes to the schema should be reflected in the database access code.

## 🔄 Migrations

For production use, consider using Alembic migrations for schema versioning and upgrades. This SQL file serves as the baseline schema.

## 🤝 Contributing

When proposing schema changes:
1. Update `schema.sql`
2. Update corresponding database access code in `database/db.py`
3. Update documentation in `docs/11_database_schema.md`
4. Document the change rationale
5. Test with PostgreSQL

## 📄 License

See the main repository [LICENSE](../../LICENSE) file.
