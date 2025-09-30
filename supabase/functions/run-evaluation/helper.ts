import type {Appendix, Judge, JudgeAssignments} from "./types.ts";

// Type guards
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string");

/**
 * Converts unknown data to Appendix[] type
 * Throws an error if the input is invalid.
 */
export const toAppendix = (data: unknown): Appendix[] => {
    const result: Appendix[] = [];

    if (Array.isArray(data)) {
        data.forEach((item) => {
            if (!isRecord(item)) return;

            const { id, queueId, labelingTaskId, createdAt, questions, answers } = item as Record<string, unknown>;

            if (
                typeof id === "string" &&
                typeof queueId === "string" &&
                typeof labelingTaskId === "string" &&
                typeof createdAt === "number" &&
                Array.isArray(questions) &&
                isRecord(answers)
            ) {
                const qs = questions.map((q): Appendix["questions"][number] => {
                    if (!isRecord(q)) throw new Error("Invalid question structure");
                    const { rev, data } = q as Record<string, unknown>;
                    if (typeof rev !== "number" || !isRecord(data)) throw new Error("Invalid question structure");
                    const { id: qid, questionType, questionText } = data as Record<string, unknown>;
                    if (
                        typeof qid !== "string" ||
                        typeof questionType !== "string" ||
                        typeof questionText !== "string"
                    ) throw new Error("Invalid question structure");
                    return {
                        rev,
                        data: { id: qid, questionType, questionText },
                    };
                });

                const ansMap: Appendix["answers"] = {};
                for (const [qId, ans] of Object.entries(answers)) {
                    if (!isRecord(ans)) throw new Error(`Invalid answer for question ${qId}`);
                    const choice = (ans as Record<string, unknown>).choice;
                    const reasoning = (ans as Record<string, unknown>).reasoning;
                    const choices = (ans as Record<string, unknown>).choices;
                    if (!((typeof choice === "string") || isStringArray(choice))) {
                        throw new Error(`Invalid answer.choice for question ${qId}`);
                    }
                    if (typeof reasoning !== "string") {
                        throw new Error(`Invalid answer.reasoning for question ${qId}`);
                    }
                    ansMap[qId] = {
                        choice: choice as string | string[],
                        choices: isStringArray(choices) ? choices : undefined,
                        reasoning,
                    };
                }

                const appendixItem: Appendix = {
                    id,
                    queueId,
                    labelingTaskId,
                    createdAt,
                    questions: qs,
                    answers: ansMap,
                };
                result.push(appendixItem);
            }
        });
    }

    return result;
};

/**
 * Converts unknown data to JudgeAssignments type.
 * Throws an error if the input is invalid.
 */
export function toJudgeAssignments(data: unknown): JudgeAssignments {
    if (!isRecord(data)) {
        throw new Error(`Expected an object, got ${typeof data}`);
    }

    const assignments: JudgeAssignments = {};

    for (const [key, value] of Object.entries(data)) {
        if (!Array.isArray(value)) {
            throw new Error(`Expected an array for key "${key}", got ${typeof value}`);
        }

        const judges: Judge[] = [];

        for (const [index, item] of value.entries()) {
            if (!isRecord(item)) {
                throw new Error(`Expected object at "${key}[${index}]", got ${typeof item}`);
            }

            const judge = item as Partial<Judge>;

            const requiredFields: (keyof Judge)[] = [
                "id",
                "name",
                "model_name",
                "system_prompt",
                "user_id",
                "created_at",
                "updated_at",
                "is_active",
            ];

            for (const field of requiredFields) {
                if (!Object.prototype.hasOwnProperty.call(judge, field)) {
                    throw new Error(`Missing field "${String(field)}" at "${key}[${index}]"`);
                }
            }

            if (
                typeof judge.id !== "string" ||
                typeof judge.name !== "string" ||
                typeof judge.model_name !== "string" ||
                typeof judge.system_prompt !== "string" ||
                typeof judge.user_id !== "string" ||
                typeof judge.created_at !== "string" ||
                typeof judge.updated_at !== "string" ||
                typeof judge.is_active !== "boolean"
            ) {
                throw new Error(`Invalid field types at "${key}[${index}]"`);
            }

            judges.push(judge as Judge);
        }

        assignments[key] = judges;
    }

    return assignments;
}