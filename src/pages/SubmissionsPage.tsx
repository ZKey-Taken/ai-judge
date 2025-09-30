import type {QuestionIdToAnswers, SubmissionIdToQuestions, SubmissionsPageProps} from "../lib/Types.ts";
import {type FC, useState} from "react";
import "./SubmissionsPage.css";
import {ConfirmationOverlay} from "../components/Overlay.tsx";
import {Loader2} from "lucide-react";
import {useFetchSubmissionsQuery} from "../queries/useFetchSubmissionsQuery.tsx";
import {useFetchQuestionsQuery} from "../queries/useFetchQuestionsQuery.tsx";
import {useFetchAnswersQuery} from "../queries/useFetchAnswersQuery.tsx";
import {useFetchQuestionJudgesQuery} from "../queries/useFetchQuestionJudgesQuery.tsx";
import {useFetchEvaluationsQuery} from "../queries/useFetchEvaluationsQuery.tsx";

const SubmissionsPage: FC<SubmissionsPageProps> = ({userId}) => {

    const {
        data: submissions,
        isLoading: loadingSubmissions,
        error: submissionsError
    } = useFetchSubmissionsQuery(userId);

    const {
        data: questionsData,
        isLoading: loadingQuestions,
        error: questionsError
    } = useFetchQuestionsQuery(userId);
    const submissionsToQuestions: SubmissionIdToQuestions | undefined = questionsData?.submissionsToQuestions;

    const {data: answersData, isLoading: loadingAnswers, error: answersError} = useFetchAnswersQuery(userId);
    const questionsToAnswers: QuestionIdToAnswers | undefined = answersData?.questionsToAnswers;

    const {data: questionToAssignedJudges, isLoading: loadingQj, error: qjError} = useFetchQuestionJudgesQuery(userId);

    const {
        data: evaluations,
        isLoading: loadingEvaluations,
        error: evaluationsError
    } = useFetchEvaluationsQuery(userId);

    const [overlayMessage, setOverlayMessage] = useState<string>("");

    const anyLoading = loadingSubmissions || loadingQuestions || loadingAnswers || loadingQj || loadingEvaluations;
    const currentErrorMessage = overlayMessage || submissionsError?.message || questionsError?.message || answersError?.message || qjError?.message || evaluationsError?.message || "";

    const totalEvaluations: number = evaluations?.length ?? 0;
    const passCount: number = evaluations?.filter(ev => (ev.verdict || "").toLowerCase() === "pass").length ?? 0;
    const passRate: number = totalEvaluations > 0 ? Math.round((passCount / totalEvaluations) * 100) : 0;

    /*
    TODO:
    - Display all evaluation results (verdict + reasoning + judge) for each submission.
     */

    return (
        <div className="submissions-page-container">
            <div className="submissions-outer-div">
                {!anyLoading && (
                    <h2 className="pass-rate-summary">{passRate} % pass of {totalEvaluations} evaluations</h2>
                )}
                {anyLoading ? (
                    <div className="loading-container">
                        <Loader2 className="spinner"/>
                        <p>Loading...</p>
                    </div>
                ) : (!submissions || !submissionsToQuestions || !questionsToAnswers || !questionToAssignedJudges || submissions.length === 0) ? (
                    <p className="empty-submissions">
                        No submission yet. Please upload file to get submission.
                    </p>
                ) : (
                    submissions.map((s) => {
                        const questions = submissionsToQuestions[s.id] || [];
                        const createdAtDate: Date = new Date(s.created_at);

                        return (
                            <div key={s.id} className="submission-div">
                                <h1>Submission created at {createdAtDate.getTime()}</h1>
                                <p className="submission-labeling-task-id"><strong>Labeling Task
                                    ID:</strong> {s.labeling_task_id}</p>
                                <p className="submission-queue-id"><strong>Queue ID:</strong> {s.queue_id}</p>

                                {questions.map((q) => {
                                    const answers = questionsToAnswers[q.id] || [];
                                    const assigned = questionToAssignedJudges[q.id] || [];

                                    return (
                                        <div key={q.id} className="question-div">
                                            <p className="question-text"><strong>Question
                                                Text:</strong> {q.questionText}
                                            </p>
                                            <p className="question-type"><strong>Question
                                                Type:</strong> {q.questionType}
                                            </p>
                                            <p className="question-rev"><strong>Rev:</strong> {q.rev}</p>

                                            {/* Assigned judges display only */}
                                            {assigned.length > 0 ? (
                                                <p className="question-assigned-judges">
                                                    <strong>Assigned
                                                        Judges:</strong> {assigned.map(j => j.name).join(", ")}
                                                </p>
                                            ) : (
                                                <p className="question-assigned-judges"><strong>Assigned
                                                    Judges:</strong> None</p>
                                            )}

                                            {answers.length > 0 ? (
                                                <div className="answers-div">
                                                    <p className="answers-label"><strong>Answers:</strong></p>
                                                    <ul className="answers-ul">
                                                        {answers.map((a) => (
                                                            <li key={a.id} className="answer-li">
                                                                <p className="answer-choice">
                                                                    <strong>Choice:</strong> {a.choice}</p>
                                                                <p className="answer-reasoning">
                                                                    <strong>Reasoning:</strong> {a.reasoning}</p>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ) : (
                                                <p className="no-answers-p">No answers yet</p>
                                            )}

                                            {/* Evaluations for this question */}
                                            {(() => {
                                                const qEvals = (evaluations ?? []).filter(ev => ev.question_id === q.id);
                                                return qEvals.length > 0 ? (
                                                    <div className="evaluations-div">
                                                        <p className="evaluations-label"><strong>Evaluations:</strong>
                                                        </p>
                                                        <ul className="evaluations-ul">
                                                            {qEvals.map((ev) => {
                                                                const judgeName = assigned.find(j => j.id === ev.judge_id)?.name ?? ev.judge_id;
                                                                return (
                                                                    <li key={ev.id} className="evaluation-li">
                                                                        <p className="evaluation-judge">
                                                                            <strong>Judge:</strong> {judgeName}</p>
                                                                        <p className="evaluation-verdict">
                                                                            <strong>Verdict:</strong> {ev.verdict}</p>
                                                                        <p className="evaluation-reasoning">
                                                                            <strong>Reasoning:</strong> {ev.reasoning}
                                                                        </p>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    </div>
                                                ) : (
                                                    <p className="no-evaluations-p">No evaluations yet</p>
                                                );
                                            })()}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })
                )}
            </div>

            {(currentErrorMessage) &&
                <ConfirmationOverlay
                    title="Unable to obtain submissions"
                    message={currentErrorMessage}
                    onConfirm={() => setOverlayMessage("")}
                />
            }
        </div>
    );
};

export default SubmissionsPage;