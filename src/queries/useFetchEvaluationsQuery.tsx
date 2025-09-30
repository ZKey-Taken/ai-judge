import {useQuery, type UseQueryResult} from "@tanstack/react-query";
import {supabase} from "../lib/Supabase.ts";
import type {Evaluation} from "../lib/Types.ts";

const useFetchEvaluationsQuery = (userId: string): UseQueryResult<Evaluation[], Error> => {
    return useQuery({
        queryKey: ["evaluations"],
        queryFn: async () => {
            const {data, error} = await supabase
                .from('evaluations')
                .select("*")
                .eq("user_id", userId);

            if (error) {
                throw new Error(error.message);
            }

            return data || [];
        },
    });
};

export {useFetchEvaluationsQuery};
