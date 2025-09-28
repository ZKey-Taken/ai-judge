import {SendHorizonal, Upload} from "lucide-react";
import {type ChangeEvent, type FC, useRef, useState} from "react";
import JSON5 from "json5";
import type {Appendix, UploadFileStepProps} from "../lib/Types.ts";
import "../steps/UploadFileStep.css";
import {ConfirmationOverlay} from "../components/Overlay.tsx";
import {convertToString} from "../lib/Helper.ts";

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
            onNextStep(parsedAppendix);
        } catch (error) {
            setOverlayMessage(convertToString(error));
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