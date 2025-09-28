import {useQuery, type UseQueryResult} from "@tanstack/react-query";
import {supabase} from "../lib/Supabase.ts";
import type {Submission} from "../lib/Types.ts";

const useFetchSubmissionsQuery = (userId: string): UseQueryResult<Submission[], Error> => {
    return useQuery({
        queryKey: ["submissions"],
        queryFn: async () => {
            const {data, error} = await supabase
                .from('submissions')
                .select('*')
                .eq('user_id', userId);

            if (error) {
                throw new Error(error.message);
            }

            return data || [];
        },
    });
}

export {useFetchSubmissionsQuery};