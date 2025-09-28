import {useQuery, type UseQueryResult} from "@tanstack/react-query";
import {supabase} from "../lib/Supabase.ts";
import type {Judge} from "../lib/Types.ts";

const useFetchJudgesQuery = (userId: string): UseQueryResult<Judge[], Error> => {
    return useQuery({
        queryKey: ["judges"],
        queryFn: async () => {
            const {data, error} = await supabase
                .from("judges")
                .select("*")
                .eq("user_id", userId);

            if (error) {
                throw new Error(error.message);
            }

            return data || [];
        },
    });
}

export {useFetchJudgesQuery};