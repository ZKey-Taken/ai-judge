import type {Database} from "./Database.ts";
import type {User} from "@supabase/supabase-js";

// Databases
export type Judge = Database['public']['Tables']['judges']['Row'];
export type JudgeInsert = Database["public"]["Tables"]["judges"]["Insert"];

export type Submission = Database['public']['Tables']['submissions']['Row'];
export type SubmissionInsert = Database["public"]["Tables"]["submissions"]["Insert"];

export type Question = Database['public']['Tables']['questions']['Row'];
export type QuestionInsert = Database["public"]["Tables"]["questions"]["Insert"];

export type Answer = Database['public']['Tables']['answers']['Row']; // answer.id matches with question.id
export type AnswerInsert = Database["public"]["Tables"]["answers"]["Insert"];

export type QuestionJudges = Database['public']['Tables']['question_judges']['Row'];
export type QuestionJudgesInsert = Database['public']['Tables']['question_judges']['Insert'];


// Props
export type HomePageProps = {
    userId: string;
};

export type SubmissionsPageProps = {
    userId: string;
};

export type JudgePageProps = {
    userId: string;
};

export type AddJudgeOverlayProps = {
    onClose: () => void;
    onCreated: (judge: Judge) => void;
    onError?: (message: string) => void;
};

export type UploadFileStepProps = {
    onNextStep: (appendix: Appendix[]) => void;
};

export type AssignJudgesProps = {
    appendix: Appendix[];
    userId: string;
    onNextStep: (assignments: JudgeAssignments) => void;
};


// Others
export type AuthContextType = {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
}

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

export const Steps = {
    UploadFile: "upload_file",
    AssignJudges: "assign_judges",
    RunEvaluations: "run_evaluations",
} as const;

export type Steps = (typeof Steps)[keyof typeof Steps];

export type SubmissionIdToQuestions = {
    [submissionId: string]: Question[];
};

export type QuestionIdToAnswers = {
    [questionId: string]: Answer[];
}

export type JudgeAssignments = {
    // Maps question ID to assigned Judge objects (from DB)
    [questionId: string]: Judge[];
};

export type QuestionWithJudge =
    QuestionJudges & {
    judges: Judge;
};