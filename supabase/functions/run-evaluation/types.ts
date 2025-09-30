import type {Database} from "./database.ts";

export type Judge = Database['public']['Tables']['judges']['Row'];
export type EvaluationInsert = Database['public']['Tables']['evaluations']['Insert'];

export type JudgeAssignments = {
    [questionId: string]: Judge[];
};

export type Appendix = {
    id: string;
    queueId: string;
    labelingTaskId: string;
    createdAt: number;
    questions: {
        rev: number;
        data: {
            id: string;
            questionType: string;
            questionText: string;
        };
    }[];
    answers: {
        [questionId: string]: {
            choice: string | string[]; // string[] is a fallback, unsure what the actual type is
            choices?: string[];
            reasoning: string;
        };
    };
};