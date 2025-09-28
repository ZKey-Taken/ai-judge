import {useQuery, type UseQueryResult} from "@tanstack/react-query";
import {supabase} from "../lib/Supabase.ts";
import type {JudgeAssignments, QuestionWithJudge} from "../lib/Types.ts";

const useFetchQuestionJudgesQuery = (userId: string): UseQueryResult<JudgeAssignments, Error> => {
    return useQuery({
        queryKey: ["question_judges", userId],
        queryFn: async () => {
            // Join question_judges -> judges and inner join questions for filtering by the owner (user_id)
            const {data, error} = await supabase
                .from('question_judges')
                .select("question_id, judge_id, judges(*), questions!inner(id)")
                .eq('questions.user_id', userId);

            if (error) {
                throw new Error(error.message);
            }

            return (data as unknown as QuestionWithJudge[]) || [];
        },
        select: (questionJudges: QuestionWithJudge[]): JudgeAssignments => {
            const questionToAssignedJudges: JudgeAssignments = {};

            questionJudges.forEach((qj) => {
                if (!questionToAssignedJudges[qj.question_id]) {
                    questionToAssignedJudges[qj.question_id] = [];
                }
                if (qj.judges) {
                    questionToAssignedJudges[qj.question_id].push(qj.judges);
                }
            });

            return questionToAssignedJudges;
        }
    });
}

export {useFetchQuestionJudgesQuery};