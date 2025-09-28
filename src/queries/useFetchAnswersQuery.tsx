import {useQuery, type UseQueryResult} from "@tanstack/react-query";
import type {Answer, QuestionIdToAnswers} from "../lib/Types.ts";
import {supabase} from "../lib/Supabase.ts";

type AnswersQueryResult = {
    answers: Answer[];
    questionsToAnswers: QuestionIdToAnswers;
};

const useFetchAnswersQuery = (userId: string): UseQueryResult<AnswersQueryResult, Error> => {
    return useQuery({
        queryKey: ["answers"],
        queryFn: async () => {
            const {data, error} = await supabase
                .from('answers')
                .select('*')
                .eq('user_id', userId);

            if (error) {
                throw new Error(error.message);
            }

            return data || [];
        },
        select: (answersData: Answer[]) => {
            const questionsToAnswers: QuestionIdToAnswers = {};

            answersData.forEach(a => {
                if (!questionsToAnswers[a.id]) {
                    questionsToAnswers[a.id] = [];
                }
                questionsToAnswers[a.id].push(a);
            });

            return {
                answers: answersData,
                questionsToAnswers: questionsToAnswers
            }
        }
    });
}

export {useFetchAnswersQuery};