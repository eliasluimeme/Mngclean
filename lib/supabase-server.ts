import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseServerKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !supabaseServerKey) {
	throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.");
}

export const supabase = createClient(supabaseUrl, supabaseServerKey, {
	auth: {
		autoRefreshToken: false,
		persistSession: false,
	},
});
 