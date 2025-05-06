-- Create a function to execute raw SQL for migrations
-- This is needed to run migrations from server-side code
-- IMPORTANT: This is an admin-only function and should be protected

-- First check if the function already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_proc 
        WHERE proname = 'run_sql'
    ) THEN
        -- Create the function
        CREATE OR REPLACE FUNCTION run_sql(sql_query text)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER -- Run with definer's privileges
        AS $$
        BEGIN
            EXECUTE sql_query;
        END;
        $$;

        -- Set row-level security for this function
        ALTER FUNCTION run_sql(text) OWNER TO postgres;
        REVOKE EXECUTE ON FUNCTION run_sql(text) FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION run_sql(text) TO service_role;
        
        RAISE NOTICE 'Created run_sql function for migrations';
    ELSE
        RAISE NOTICE 'run_sql function already exists';
    END IF;
END $$; 