import {type FC, useState} from "react";
import type {
    AnswerInsert,
    AssignJudgesProps,
    Judge,
    JudgeAssignments,
    QuestionInsert,
    SubmissionInsert
} from "../lib/Types.ts";
import "./AssignJudgesStep.css";
import {useFetchJudgesQuery} from "../queries/useFetchJudgesQuery.tsx";
import {supabase} from "../lib/Supabase.ts";
import {ConfirmationOverlay} from "../components/Overlay.tsx";
import {ArrowRight} from "lucide-react";
import {convertToString, rollbackSubmissions} from "../lib/Helper.ts";

const AssignJudgesStep: FC<AssignJudgesProps> = ({appendix, userId, onNextStep}) => {
    const {data: judges = [], isLoading: loadingJudges, error} = useFetchJudgesQuery(userId);

    const [assignments, setAssignments] = useState<JudgeAssignments>({});
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isSaved, setIsSaved] = useState<boolean>(false);
    const [overlayMessage, setOverlayMessage] = useState<string>("");

    // Derived: ensure at least one judge assigned per question before allowing the next
    const allQuestionIds: string[] = appendix.flatMap(app => app.questions.map(q => q.data.id));
    const allQuestionsHaveJudge: boolean = allQuestionIds.length > 0 && allQuestionIds.every(qid => (assignments[qid]?.length || 0) > 0);

    const handleToggleJudge = (questionId: string, judge: Judge) => {
        setAssignments(prev => {
            const current = prev[questionId] || [];
            const exists = current.some(j => j.id === judge.id);

            const updated = exists
                ? current.filter(j => j.id !== judge.id) // remove by id
                : [...current, judge]; // add a judge object

            return {...prev, [questionId]: updated};
        });
    };

    const handleSave = async (): Promise<boolean> => {
        let insertedSubIds: string[] = [];
        try {
            setIsSaving(true);

            // 1) Build batch payloads for submissions, questions, answers from appendix
            const submissionsData: SubmissionInsert[] = appendix.map(app => ({
                id: app.id,
                queue_id: app.queueId,
                labeling_task_id: app.labelingTaskId,
                created_at: new Date(app.createdAt).toISOString(),
            }));

            const questionsData: QuestionInsert[] = [];
            const answersData: AnswerInsert[] = [];

            for (const app of appendix) {
                for (const q of app.questions) {
                    questionsData.push({
                        id: q.data.id,
                        questionText: q.data.questionText,
                        questionType: q.data.questionType,
                        rev: q.rev,
                        submission_id: app.id,
                    });

                    const ans = app.answers[q.data.id];
                    if (ans) {
                        const choice: string = convertToString(ans.choice || ans.choices);
                        answersData.push({
                            id: q.data.id,
                            choice: choice,
                            reasoning: ans.reasoning,
                        });
                    }
                }
            }

            insertedSubIds = submissionsData.map(s => s.id);

            // 2) Insert submissions
            const {error: submissionError} = await supabase.from('submissions').insert(submissionsData);
            if (submissionError) {
                if (submissionError.message === "duplicate key value violates unique constraint \"submissions_id_key\"") {
                    setOverlayMessage("You've already uploaded this submission before!")
                } else {
                    setOverlayMessage(submissionError.message);
                }

                return false;
            }

            // 3) Insert questions
            if (questionsData.length > 0) {
                const {error: questionsError} = await supabase.from('questions').insert(questionsData);
                if (questionsError) {
                    await rollbackSubmissions(insertedSubIds);
                    setOverlayMessage(questionsError.message);
                    return false;
                }
            }

            // 4) Insert answers
            if (answersData.length > 0) {
                const {error: answersError} = await supabase.from('answers').insert(answersData);
                if (answersError) {
                    await rollbackSubmissions(insertedSubIds);
                    setOverlayMessage(answersError.message);
                    return false;
                }
            }

            // 5) Insert question_judges from selection
            const qjRows = Object.entries(assignments).flatMap(([question_id, judges]) =>
                (judges || []).map((judge) => ({question_id, judge_id: judge.id}))
            );

            if (qjRows.length > 0) {
                const {error: qjError} = await supabase.from('question_judges').insert(qjRows);
                if (qjError) {
                    await rollbackSubmissions(insertedSubIds);
                    setOverlayMessage(qjError.message);
                    return false;
                }
            }

            setIsSaved(true);
            return true;
        } catch (e) {
            setOverlayMessage(convertToString(e));
            return false;
        } finally {
            setIsSaving(false);
        }
    }

    const handleNextStep = async () => {
        if (!allQuestionsHaveJudge) {
            setOverlayMessage("Please assign at least one judge to every question before continuing.");
            return;
        } else if (isSaved) {
            onNextStep(assignments);
            return;
        }
        const ok = await handleSave();
        if (ok) onNextStep(assignments);
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
                                {judges && judges.length === 0 ?
                                    <p className="assign-judges-empty-judges">
                                        No judges available. You can go to the Judges page to create them. Assign at
                                        least one judge per question to continue.
                                    </p>
                                    :
                                    judges
                                        .filter(judge => judge.is_active)
                                        .map((judge) => (
                                            <label key={judge.id} className="assign-judges-label">
                                                <input
                                                    type="checkbox"
                                                    className="assign-judges-input-checkbox"
                                                    checked={assignments[q.data.id]?.some(j => j.id === judge.id) || false}
                                                    onChange={() => handleToggleJudge(q.data.id, judge)}
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
                    onClick={handleNextStep}
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