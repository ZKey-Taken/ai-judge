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

        // Filters
        const [selectedJudgeIds, setSelectedJudgeIds] = useState<string[]>([]);
        const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
        const [selectedVerdict, setSelectedVerdict] = useState<string>("");
        const [judgeSearch, setJudgeSearch] = useState<string>("");
        const [questionSearch, setQuestionSearch] = useState<string>("");

        const toggleId = (id: string, list: string[], setter: (v: string[]) => void) => {
            setter(list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
        };
        const removeJudge = (id: string) => setSelectedJudgeIds(prev => prev.filter(x => x !== id));
        const removeQuestion = (id: string) => setSelectedQuestionIds(prev => prev.filter(x => x !== id));

    const anyLoading = loadingSubmissions || loadingQuestions || loadingAnswers || loadingQj || loadingEvaluations;
    const currentErrorMessage = overlayMessage || submissionsError?.message || questionsError?.message || answersError?.message || qjError?.message || evaluationsError?.message || "";

    // Filter helpers
    const isFilteringActive = (selectedJudgeIds.length > 0) || (selectedQuestionIds.length > 0) || (selectedVerdict !== "");
    const matchesFilters = (ev: { judge_id: string; question_id: string; verdict: string | null }) => {
        const verdict = (ev.verdict || "").toLowerCase();
        const byJudge = selectedJudgeIds.length === 0 || selectedJudgeIds.includes(ev.judge_id);
        const byQuestion = selectedQuestionIds.length === 0 || selectedQuestionIds.includes(ev.question_id);
        const byVerdict = selectedVerdict === "" || verdict === selectedVerdict;
        return byJudge && byQuestion && byVerdict;
    };

    const filteredEvaluations = (evaluations ?? []).filter(matchesFilters);

    const totalEvaluations: number = filteredEvaluations.length;
    const passCount: number = filteredEvaluations.filter(ev => (ev.verdict || "").toLowerCase() === "pass").length;
    const passRate: number = totalEvaluations > 0 ? Math.round((passCount / totalEvaluations) * 100) : 0;

    // Build filter option sources
    const allJudgesMap: Record<string, string> = {};
    if (questionToAssignedJudges) {
        Object.values(questionToAssignedJudges).forEach(list => {
            list.forEach(j => { if (!allJudgesMap[j.id]) allJudgesMap[j.id] = j.name; });
        });
    }
    // Fallback: ensure every judge_id present in evaluations has an option
    (evaluations ?? []).forEach(ev => { if (!allJudgesMap[ev.judge_id]) allJudgesMap[ev.judge_id] = ev.judge_id; });
    const allJudgesOptions = Object.entries(allJudgesMap).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));

    const allQuestionsOptions = (questionsData?.questions ?? []).map(q => ({ id: q.id, text: q.questionText }));

    /*
    TODO:
    - Display all evaluation results (verdict + reasoning + judge) for each submission.
     */

    return (
        <div className="submissions-page-container">
            <div className="submissions-outer-div">
                {!anyLoading && (
                    <>
                        <h2 className="pass-rate-summary">{passRate} % pass of {totalEvaluations} evaluations</h2>
                        <>
                            <div className="filters-bar">
                                <div className="filter-segment">
                                    <span className="filter-label">Verdict</span>
                                    <div className="verdict-segment">
                                        <button
                                            type="button"
                                            className={`verdict-btn ${selectedVerdict === "" ? "active" : ""}`}
                                            onClick={() => setSelectedVerdict("")}
                                            title="Show all verdicts"
                                        >
                                            All
                                        </button>
                                        <button
                                            type="button"
                                            className={`verdict-btn pass ${selectedVerdict === "pass" ? "active" : ""}`}
                                            onClick={() => setSelectedVerdict("pass")}
                                            title="Show only Pass"
                                        >
                                            Pass
                                        </button>
                                        <button
                                            type="button"
                                            className={`verdict-btn fail ${selectedVerdict === "fail" ? "active" : ""}`}
                                            onClick={() => setSelectedVerdict("fail")}
                                            title="Show only Fail"
                                        >
                                            Fail
                                        </button>
                                        <button
                                            type="button"
                                            className={`verdict-btn inconclusive ${selectedVerdict === "inconclusive" ? "active" : ""}`}
                                            onClick={() => setSelectedVerdict("inconclusive")}
                                            title="Show only Inconclusive"
                                        >
                                            Inconclusive
                                        </button>
                                    </div>
                                </div>

                                <div className="filter-segment">
                                    <details className="dropdown">
                                        <summary className="dropdown-summary">
                                            Judges {selectedJudgeIds.length > 0 ? `(${selectedJudgeIds.length})` : ""}
                                        </summary>
                                        <div className="dropdown-panel">
                                            <input
                                                type="text"
                                                className="dropdown-search"
                                                value={judgeSearch}
                                                onChange={(e) => setJudgeSearch(e.target.value)}
                                                placeholder="Search judges..."
                                            />
                                            <div className="checkbox-list">
                                                {allJudgesOptions
                                                    .filter(j => j.name.toLowerCase().includes(judgeSearch.toLowerCase()))
                                                    .map(j => (
                                                        <label key={j.id} className="checkbox-item">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedJudgeIds.includes(j.id)}
                                                                onChange={() => toggleId(j.id, selectedJudgeIds, setSelectedJudgeIds)}
                                                            />
                                                            <span>{j.name}</span>
                                                        </label>
                                                    ))}
                                                {allJudgesOptions.filter(j => j.name.toLowerCase().includes(judgeSearch.toLowerCase())).length === 0 && (
                                                    <div className="dropdown-empty">No judges found</div>
                                                )}
                                            </div>
                                            <div className="dropdown-actions">
                                                <button type="button" onClick={() => setSelectedJudgeIds(allJudgesOptions.filter(j => j.name.toLowerCase().includes(judgeSearch.toLowerCase())).map(j => j.id))}>Select visible</button>
                                                <button type="button" onClick={() => setSelectedJudgeIds([])}>Clear</button>
                                            </div>
                                        </div>
                                    </details>
                                </div>

                                <div className="filter-segment">
                                    <details className="dropdown">
                                        <summary className="dropdown-summary">
                                            Questions {selectedQuestionIds.length > 0 ? `(${selectedQuestionIds.length})` : ""}
                                        </summary>
                                        <div className="dropdown-panel">
                                            <input
                                                type="text"
                                                className="dropdown-search"
                                                value={questionSearch}
                                                onChange={(e) => setQuestionSearch(e.target.value)}
                                                placeholder="Search questions..."
                                            />
                                            <div className="checkbox-list">
                                                {allQuestionsOptions
                                                    .filter(q => q.text.toLowerCase().includes(questionSearch.toLowerCase()))
                                                    .map(q => (
                                                        <label key={q.id} className="checkbox-item">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedQuestionIds.includes(q.id)}
                                                                onChange={() => toggleId(q.id, selectedQuestionIds, setSelectedQuestionIds)}
                                                            />
                                                            <span>{q.text}</span>
                                                        </label>
                                                    ))}
                                                {allQuestionsOptions.filter(q => q.text.toLowerCase().includes(questionSearch.toLowerCase())).length === 0 && (
                                                    <div className="dropdown-empty">No questions found</div>
                                                )}
                                            </div>
                                            <div className="dropdown-actions">
                                                <button type="button" onClick={() => setSelectedQuestionIds(allQuestionsOptions.filter(q => q.text.toLowerCase().includes(questionSearch.toLowerCase())).map(q => q.id))}>Select visible</button>
                                                <button type="button" onClick={() => setSelectedQuestionIds([])}>Clear</button>
                                            </div>
                                        </div>
                                    </details>
                                </div>

                                <button
                                    type="button"
                                    className="clear-filters-btn"
                                    onClick={() => { setSelectedJudgeIds([]); setSelectedQuestionIds([]); setSelectedVerdict(""); setJudgeSearch(""); setQuestionSearch(""); }}
                                    disabled={!isFilteringActive}
                                    title="Clear all filters"
                                >
                                    Clear all
                                </button>
                            </div>

                            {isFilteringActive && (
                                <div className="active-filters">
                                    {selectedVerdict && (
                                        <span className={`chip verdict-${selectedVerdict}`}>
                                            <span>Verdict: {selectedVerdict}</span>
                                            <button type="button" className="chip-remove" onClick={() => setSelectedVerdict("")}>×</button>
                                        </span>
                                    )}
                                    {selectedJudgeIds.map(jid => (
                                        <span key={jid} className="chip">
                                            <span>Judge: {allJudgesOptions.find(j => j.id === jid)?.name ?? jid}</span>
                                            <button type="button" className="chip-remove" onClick={() => removeJudge(jid)}>×</button>
                                        </span>
                                    ))}
                                    {selectedQuestionIds.map(qid => (
                                        <span key={qid} className="chip">
                                            <span>Question: {allQuestionsOptions.find(q => q.id === qid)?.text ?? qid}</span>
                                            <button type="button" className="chip-remove" onClick={() => removeQuestion(qid)}>×</button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </>
                    </>
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

                                    if (selectedQuestionIds.length > 0 && !selectedQuestionIds.includes(q.id)) { return null; }

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
                                                const qEvals = (evaluations ?? []).filter(ev => ev.question_id === q.id).filter(matchesFilters);
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
                                                    <p className="no-evaluations-p">{isFilteringActive ? "No evaluations match filters" : "No evaluations yet"}</p>
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