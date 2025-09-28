import {SendHorizonal, Upload} from "lucide-react";
import {type ChangeEvent, type FC, useRef, useState} from "react";
import JSON5 from "json5";
import type {AnswerInsert, Appendix, QuestionInsert, SubmissionInsert, UploadFileStepProps} from "../lib/Types.ts";
import "../steps/UploadFileStep.css";
import {supabase} from "../lib/Supabase.ts";
import {ConfirmationOverlay} from "../components/Overlay.tsx";

const UploadFileStep: FC<UploadFileStepProps> = ({onNextStep}) => {
    const buttonSize: number = 25;

    const [jsonPreview, setJsonPreview] = useState<string>("");
    const [overlayMessage, setOverlayMessage] = useState<string>("");
    // TODO: Bonus, save non-JSON files for LLM uses
    // const [file, setFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);


    const handleFileUpload = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const json = JSON5.parse(text);
            const jsonString: string = JSON.stringify(json, null, 2);
            setJsonPreview(jsonString);

            requestAnimationFrame(() => {
                if (textareaRef.current) {
                    textareaRef.current.style.height = "auto";
                    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
                }
            });
        } catch (error) {
            console.error('Invalid JSON:', error);
            setJsonPreview("Invalid JSON file");
            // Not JSON file, bonus: we save for LLM uses
        }
    };

    const handleSubmit = async () => {
        try {
            const parsedAppendix: Appendix[] = JSON5.parse(jsonPreview);

            // Batch insert submissions
            const submissionsData: SubmissionInsert[] = parsedAppendix.map(app => ({
                id: app.id,
                queue_id: app.queueId,
                labeling_task_id: app.labelingTaskId,
                created_at: new Date(app.createdAt).toISOString(),
            }));

            const {error: submissionError} = await supabase
                .from('submissions')
                .insert(submissionsData);

            if (submissionError) {
                setOverlayMessage(submissionError.message);
                return;
            }

            // Batch insert questions and answers
            const questionsData: QuestionInsert[] = [];
            const answersData: AnswerInsert[] = [];

            for (const appendix of parsedAppendix) {
                for (const q of appendix.questions) {
                    questionsData.push({
                        id: q.data.id,
                        questionText: q.data.questionText,
                        questionType: q.data.questionType,
                        rev: q.rev,
                        submission_id: appendix.id,
                        created_at: new Date().toISOString(),
                    });

                    const ans = appendix.answers[q.data.id];
                    if (ans) {
                        answersData.push({
                            id: q.data.id, // same as question ID
                            choice: ans.choice,
                            reasoning: ans.reasoning,
                            created_at: new Date().toISOString(),
                        });
                    }
                }
            }

            if (questionsData.length > 0) {
                const {error: questionsError} = await supabase
                    .from('questions')
                    .insert(questionsData);

                if (questionsError) {
                    setOverlayMessage(questionsError.message);
                    return;
                }
            }

            if (answersData.length > 0) {
                const {error: answersError} = await supabase
                    .from('answers')
                    .insert(answersData);

                if (answersError) {
                    setOverlayMessage(answersError.message);
                    return;
                }
            }

            onNextStep(parsedAppendix);
        } catch {
            /* empty */
        }
    };

    return (
        <div className="search-upload-container">
            <div className="search-wrapper">
                <input
                    className="file-input"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />
                <button type="button" className="upload-button" onClick={handleFileUpload}>
                    <Upload size={buttonSize}/>
                </button>

                <textarea
                    ref={textareaRef}
                    className="search-input"
                    placeholder="Upload a JSON file to preview it"
                    value={jsonPreview}
                    rows={1}
                    readOnly
                />

                <button
                    className="submit-button"
                    onClick={handleSubmit}
                    disabled={!jsonPreview}
                >
                    <SendHorizonal size={buttonSize}/>
                </button>
            </div>

            {overlayMessage &&
                <ConfirmationOverlay
                    title="Error"
                    message={overlayMessage}
                    onConfirm={() => setOverlayMessage("")}
                />
            }
        </div>
    );
};

export default UploadFileStep;