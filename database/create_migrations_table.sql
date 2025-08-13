-- Create migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial migration record
INSERT INTO migrations (name, executed_at) VALUES ('initial_schema', NOW())
ON CONFLICT (name) DO NOTHING;
