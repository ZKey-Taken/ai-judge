import {type FC, useState} from "react";
import type {AssignJudgesProps, JudgeAssignments} from "../lib/Types.ts";
import "./AssignJudgesStep.css";
import {useFetchJudgesQuery} from "../queries/useFetchJudges.tsx";
import {supabase} from "../lib/Supabase.ts";
import {ConfirmationOverlay} from "../components/Overlay.tsx";
import {ArrowRight} from "lucide-react";

const AssignJudgesStep: FC<AssignJudgesProps> = ({appendix, userId, onNextStep}) => {
    const {data: judges = [], isLoading: loadingJudges, error} = useFetchJudgesQuery(userId);

    const [assignments, setAssignments] = useState<JudgeAssignments>({});
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isSaved, setIsSaved] = useState<boolean>(false);
    const [overlayMessage, setOverlayMessage] = useState<string>("");

    const handleToggleJudge = (questionId: string, judgeId: string) => {
        setAssignments((prev) => {
            const current = prev[questionId] || [];
            const updated = current.includes(judgeId)
                ? current.filter((id) => id !== judgeId) // remove if already selected
                : [...current, judgeId]; // add otherwise
            return {...prev, [questionId]: updated};
        });
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            // Build rows like: [{ question_id, judge_id }, ...]
            const rows = Object.entries(assignments).flatMap(([question_id, judgeIds]) =>
                (judgeIds || []).map((judge_id) => ({question_id, judge_id}))
            );

            if (rows.length > 0) {
                const {error} = await supabase.from("question_judges").insert(rows);

                if (error) {
                    setOverlayMessage(error.message)
                    return;
                }
            }
        } catch {
            /**/
        } finally {
            setIsSaving(false);
            setIsSaved(true);
        }
    }

    if (loadingJudges) return <p>Loading judges...</p>;
    if (error) return <p>Error loading judges: {error.message}.</p>;

    return (
        <div className="assign-judges-container">
            {appendix.map((a) => (
                <div key={a.id} className="assign-judges-appendix">
                    <p className="assign-judges-queue">Queue: {a.queueId}</p>
                    <p className="assign-judges-labelingTask">Labeling Task ID: {a.labelingTaskId}</p>
                    <p className="assign-judges-createdAt">Created At: {a.createdAt}</p>

                    {a.questions.map((q) => (
                        <div key={q.data.id} className="assign-judges-question">
                            <p>
                                <strong>Question Type: </strong>
                                {q.data.questionType}
                            </p>
                            <p>
                                <strong>Question Text: </strong>
                                {q.data.questionText}
                            </p>

                            <div className="judges-selector">
                                <p>Assign Judges:</p>
                                {judges.map((judge) => (
                                    <label key={judge.id} className="assign-judges-label">
                                        <input
                                            type="checkbox"
                                            className="assign-judges-input-checkbox"
                                            checked={assignments[q.data.id]?.includes(judge.id) || false}
                                            onChange={() => handleToggleJudge(q.data.id, judge.id)}
                                        />
                                        <p className="assign-judges-judge-name">{judge.name}</p>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ))}

            <div className="assign-judges-actions">
                <button
                    className="assign-judges-submit"
                    onClick={async () => {
                        if (!isSaved) await handleSave();
                        onNextStep();
                    }}
                    disabled={isSaving}
                >
                    {isSaving ? "Saving..." : <ArrowRight size={18}/>}
                </button>
                {isSaved && <span className="saved-indicator">Saved ✅</span>}
            </div>

            {overlayMessage && (
                <ConfirmationOverlay
                    title="Error"
                    message={overlayMessage}
                    onConfirm={() => setOverlayMessage("")}
                />
            )}
        </div>

    )
}

export default AssignJudgesStep;