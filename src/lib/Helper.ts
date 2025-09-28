import {supabase} from "./Supabase.ts";

// Converts array of string into a string, or if value is null/undefined returns empty string, otherwise string.
export const convertToString = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    else if (Array.isArray(value)) return value.join(', ');
    return String(value);
}

// Rollbacks/Deleting submission Ids using Supabase
export const rollbackSubmissions = async (insertedIds: string[]) => {
    if (!insertedIds || insertedIds.length === 0) return;

    await supabase
        .from('submissions')
        .delete()
        .in('id', insertedIds);
}