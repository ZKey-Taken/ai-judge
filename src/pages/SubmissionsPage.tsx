import type {QuestionIdToAnswers, SubmissionIdToQuestions, SubmissionsPageProps} from "../lib/Types.ts";
import {type FC, useState} from "react";
import "./SubmissionsPage.css";
import {ConfirmationOverlay} from "../components/Overlay.tsx";
import {Loader2} from "lucide-react";
import {useFetchSubmissionsQuery} from "../queries/useFetchSubmissionsQuery.tsx";
import {useFetchQuestionsQuery} from "../queries/useFetchQuestionsQuery.tsx";
import {useFetchAnswersQuery} from "../queries/useFetchAnswersQuery.tsx";

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

    const [overlayMessage, setOverlayMessage] = useState<string>(
        submissionsError?.message || questionsError?.message || answersError?.message || ""
    );

    /*
    TODO:
    - Display all evaluation results (verdict + reasoning + judge) for each submission.
     */

    return (
        <div className="submissions-page-container">
            <div className="submissions-outer-div">
                {(loadingSubmissions || loadingQuestions || loadingAnswers) ? (
                    <div className="loading-container">
                        <Loader2 className="spinner"/>
                        <p>Loading...</p>
                    </div>
                ) : (!submissions || !submissionsToQuestions || !questionsToAnswers || submissions.length === 0) ? (
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

                                    return (
                                        <div key={q.id} className="question-div">
                                            <p className="question-text"><strong>Question
                                                Text:</strong> {q.questionText}
                                            </p>
                                            <p className="question-type"><strong>Question
                                                Type:</strong> {q.questionType}
                                            </p>
                                            <p className="question-rev"><strong>Rev:</strong> {q.rev}</p>

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
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })
                )}
            </div>

            {overlayMessage &&
                <ConfirmationOverlay
                    title="Unable to obtain submissions"
                    message={overlayMessage}
                    onConfirm={() => setOverlayMessage("")}
                />
            }
        </div>
    );
};

export default SubmissionsPage;