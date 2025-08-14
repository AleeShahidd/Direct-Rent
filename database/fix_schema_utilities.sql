-- Function to execute SQL statements from Node.js scripts
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;

-- Function to check if a table exists in the schema
CREATE OR REPLACE FUNCTION check_schema_exists(schema_name TEXT, table_name TEXT)
RETURNS TABLE(exists BOOLEAN)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = schema_name
    AND table_name = table_name
  );
END;
$$;
