import {createClient, SupabaseClient} from "@supabase/supabase-js";
import type {Database} from "./Database.ts";

const SUPABASEURL: string = import.meta.env.VITE_SUPABASE_URL;
const SUPABASEKEY: string = import.meta.env.VITE_SUPABASE_KEY;

export const supabase: SupabaseClient<Database> = createClient(SUPABASEURL, SUPABASEKEY);
