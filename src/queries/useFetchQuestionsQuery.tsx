import {useQuery, type UseQueryResult} from "@tanstack/react-query";
import {supabase} from "../lib/Supabase.ts";
import type {Question, SubmissionIdToQuestions} from "../lib/Types.ts";

type QuestionsQueryResult = {
    questions: Question[];
    submissionsToQuestions: SubmissionIdToQuestions;
};

const useFetchQuestionsQuery = (userId: string): UseQueryResult<QuestionsQueryResult, Error> => {
    return useQuery({
        queryKey: ["questions"],
        queryFn: async () => {
            const {data, error} = await supabase
                .from('questions')
                .select('*')
                .eq('user_id', userId);

            if (error) {
                throw new Error(error.message);
            }

            return data || [];
        },
        select: (questionsData: Question[]): QuestionsQueryResult => {
            const submissionsToQuestions: SubmissionIdToQuestions = {};

            questionsData.forEach((q) => {
                if (!submissionsToQuestions[q.submission_id]) {
                    submissionsToQuestions[q.submission_id] = [];
                }
                submissionsToQuestions[q.submission_id].push(q);
            });

            return {
                questions: questionsData,
                submissionsToQuestions: submissionsToQuestions,
            };
        }
    });
}

export {useFetchQuestionsQuery};