#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Grant all privileges on the database
    GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;
    
    -- Grant all privileges on the public schema
    GRANT ALL ON SCHEMA public TO $POSTGRES_USER;
    GRANT ALL ON SCHEMA public TO public;
    
    -- Set ownership of public schema
    ALTER SCHEMA public OWNER TO $POSTGRES_USER;
    
    -- Grant default privileges for future tables and sequences
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $POSTGRES_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $POSTGRES_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO $POSTGRES_USER;
EOSQL

echo "Database initialization completed successfully!"
