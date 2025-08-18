const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixAuth() {
  try {
    const sql = require("fs").readFileSync("database/fix_auth_final.sql", "utf8");
    const { error } = await supabase.rpc("exec_sql", { query: sql });
    if (error) throw error;
    console.log("✅ Successfully applied auth fixes");
  } catch (error) {
    console.log("❌ Error:", error);
  }
}

fixAuth();
