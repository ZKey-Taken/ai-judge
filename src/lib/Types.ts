import type {Database} from "./Database.ts";
import type {User} from "@supabase/supabase-js";

// Databases
export type Judge = Database['public']['Tables']['judges']['Row'];
export type JudgeInsert = Database["public"]["Tables"]["judges"]["Insert"];
export type Submission = Database['public']['Tables']['submissions']['Row'];
export type Question = Database['public']['Tables']['questions']['Row'];
export type Answer = Database['public']['Tables']['answers']['Row'];

// Props
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
    onNextStep: () => void;
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
            questionType: "single_choice_with_reasoning";
            questionText: string;
        };
    }[];
    answers: {
        [questionId: string]: {
            choice: string;
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