import {type ChangeEvent, type FC, useRef, useState} from "react";
import {SendHorizonal, Upload} from "lucide-react";
import "./Pages.css";

const HomePage: FC = () => {
    const buttonSize: number = 25;

    const [jsonPreview, setJsonPreview] = useState<string>("");
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
            let text = await file.text();

            // Clean up common issues
            text = text.replace(/^\uFEFF/, '');
            text = text.replace(/\u00A0/g, ' ');
            text = text.replace(/[\u2000-\u200B\u2028\u2029]/g, ' ');
            text = text.trim();

            const json = JSON.parse(text);
            const jsonString: string = JSON.stringify(json, null, 2);
            setJsonPreview(jsonString)

            requestAnimationFrame(() => {
                if (textareaRef.current) {
                    textareaRef.current.style.height = "auto";
                    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
                }
            });
        } catch {
            // Not JSON file, we save for other uses
            return;
        }
    };


    const handleSubmit = () => {
        console.log("Submit JSON:", jsonPreview);
    };

    return (
        <div className="home-page">
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
            </div>
        </div>
    );
};

export default HomePage;
