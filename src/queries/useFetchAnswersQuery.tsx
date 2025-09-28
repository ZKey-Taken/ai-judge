import {useQuery, type UseQueryResult} from "@tanstack/react-query";
import type {Answer, Question, QuestionIdToAnswers} from "../lib/Types.ts";
import {supabase} from "../lib/Supabase.ts";

type AnswersQueryResult = {
    answers: Answer[];
    questionsToAnswers: QuestionIdToAnswers;
};

const useFetchAnswersQuery = (questions: Question[] | undefined): UseQueryResult<AnswersQueryResult, Error> => {
    return useQuery({
        queryKey: ["answers"],
        queryFn: async () => {
            const {data, error} = await supabase
                .from('answers')
                .select('*')
                .in('id', (questions ?? []).map(q => q.id));

            if (error) {
                throw new Error(error.message);
            }

            return data || [];
        },
        enabled: questions && questions.length > 0,
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