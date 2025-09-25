import {createClient, SupabaseClient} from "@supabase/supabase-js";

const SUPABASEURL: string = import.meta.env.VITE_SUPABASE_URL;
const SUPABASEKEY: string = import.meta.env.VITE_SUPABASE_KEY;

export const supabase: SupabaseClient = createClient(SUPABASEURL, SUPABASEKEY);
