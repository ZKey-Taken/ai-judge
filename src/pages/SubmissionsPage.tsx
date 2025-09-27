import type {QuestionIdToAnswers, Submission, SubmissionIdToQuestions, SubmissionsPageProps} from "../lib/Types.ts";
import {type FC, useEffect, useRef, useState} from "react";
import "./SubmissionsPage.css";
import {ConfirmationOverlay} from "../components/Overlay.tsx";
import {supabase} from "../lib/Supabase.ts";
import {Loader2} from "lucide-react";

const SubmissionsPage: FC<SubmissionsPageProps> = ({userId}) => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [submissionsToQuestions, setSubmissionsToQuestions] = useState<SubmissionIdToQuestions>({})
    const [questionsToAnswers, setQuestionsToAnswers] = useState<QuestionIdToAnswers>({});
    const [overlayMessage, setOverlayMessage] = useState<string>("");
    const dataFetched = useRef(false);
    const [loadingSubmissions, setLoadingSubmissions] = useState<boolean>(true);

    /*
    TODO:
    - Show all submissions and their questions/answers.
    - Display all evaluation results (verdict + reasoning + judge) for each submission.
     */

    useEffect(() => {
        if (dataFetched.current) return; // React StrictMode in dev makes useEffect run twice; this ensures data is fetched only once
        dataFetched.current = true;

        const getAllSubmission = async () => {
            try {
                // 1. Fetch all submissions
                const {data: submissionsData, error: submissionsError} = await supabase
                    .from('submissions')
                    .select('*')
                    .eq('user_id', userId);

                if (submissionsError) {
                    setOverlayMessage(submissionsError.message);
                    return;
                }

                // 2. Fetch all questions for these submissions
                const submissionIds = submissionsData.map(s => s.id);

                const {data: questionsData, error: questionsError} = await supabase
                    .from('questions')
                    .select('*')
                    .in('submission_id', submissionIds);

                if (questionsError) {
                    setOverlayMessage(questionsError.message);
                    return;
                }

                // 3. Fetch all answers for these questions
                const questionIds = questionsData.map(q => q.id);

                const {data: answersData, error: answersError} = await supabase
                    .from('answers')
                    .select('*')
                    .in('id', questionIds);
                if (answersError) {
                    setOverlayMessage(answersError.message);
                    return;
                }

                // 4. Organize data into maps
                const submissionsToQuestions: SubmissionIdToQuestions = {};
                questionsData.forEach(q => {
                    if (!submissionsToQuestions[q.submission_id]) submissionsToQuestions[q.submission_id] = [];
                    submissionsToQuestions[q.submission_id].push(q);
                });

                const questionsToAnswers: QuestionIdToAnswers = {};
                answersData.forEach(a => {
                    if (!questionsToAnswers[a.id]) questionsToAnswers[a.id] = [];
                    questionsToAnswers[a.id].push(a);
                });

                // 5. Update states
                setSubmissions(submissionsData);
                setSubmissionsToQuestions(submissionsToQuestions);
                setQuestionsToAnswers(questionsToAnswers);
            } catch (error) {
                setOverlayMessage(error as string);
            } finally {
                setLoadingSubmissions(false);
            }
        };

        getAllSubmission();
    }, [userId]);

    return (
        <div className="submissions-page-container">
            <div className="submissions-outer-div">
                {loadingSubmissions &&
                    <div className="loading-container">
                        <Loader2 className="spinner"/>
                        <p>Loading...</p>
                    </div>
                }

                {!loadingSubmissions && submissions.map((s) => {
                    const questions = submissionsToQuestions[s.id] || [];

                    return (
                        <div key={s.id} className="submission-div">
                            <h1>Submissions</h1>
                            <p className="submission-labeling-task-id"><strong>Labeling Task
                                ID:</strong> {s.labeling_task_id}</p>
                            <p className="submission-queue-id"><strong>Queue ID:</strong> {s.queue_id}</p>

                            {questions.map((q) => {
                                const answers = questionsToAnswers[q.id] || [];

                                return (
                                    <div key={q.id} className="question-div">
                                        <p className="question-text"><strong>Question Text:</strong> {q.questionText}
                                        </p>
                                        <p className="question-type"><strong>Question Type:</strong> {q.questionType}
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
                })}
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