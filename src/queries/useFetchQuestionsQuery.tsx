import {useQuery, type UseQueryResult} from "@tanstack/react-query";
import {supabase} from "../lib/Supabase.ts";
import type {Question, Submission, SubmissionIdToQuestions} from "../lib/Types.ts";

type QuestionsQueryResult = {
    questions: Question[];
    submissionsToQuestions: SubmissionIdToQuestions;
};

const useFetchQuestionsQuery = (submissions: Submission[] | undefined): UseQueryResult<QuestionsQueryResult, Error> => {
    return useQuery({
        queryKey: ["questions"],
        queryFn: async () => {
            const {data, error} = await supabase
                .from('questions')
                .select('*')
                .in('submission_id', (submissions ?? []).map(s => s.id));

            if (error) {
                throw new Error(error.message);
            }

            return data || [];
        },
        enabled: submissions && submissions.length > 0,
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