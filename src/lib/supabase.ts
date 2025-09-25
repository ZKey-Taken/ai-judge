import {createClient, SupabaseClient} from "@supabase/supabase-js";

const SUPABASEURL: string = import.meta.env.SUPABASE_URL;
const SUPABASEKEY: string = import.meta.env.SUPABASE_KEY;

export const supabase: SupabaseClient = createClient(SUPABASEURL, SUPABASEKEY);
