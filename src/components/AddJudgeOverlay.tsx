import {type FC, type FormEvent, useState} from "react";
import {supabase} from "../lib/Supabase.ts";
import "./AddJudgeOverlay.css";
import type {AddJudgeOverlayProps, Judge, JudgeInsert} from "../lib/Types.ts";

export const AddJudgeOverlay: FC<AddJudgeOverlayProps> = ({
                                                              onClose,
                                                              onCreated,
                                                              onError,
                                                          }) => {
    const [name, setName] = useState<string>("");
    const [prompt, setPrompt] = useState<string>("");
    const [model, setModel] = useState<string>("auto-free");
    const [active, setActive] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (submitting) return;

        try {
            if (!name.trim() || !prompt.trim()) return;

            setSubmitting(true);

            const newJudge: JudgeInsert = {
                model_name: model,
                name: name.trim(),
                system_prompt: prompt.trim(),
                is_active: active,
            };

            const {data, error} = await supabase
                .from("judges")
                .insert(newJudge)
                .select()
                .single();

            if (error) {
                onError?.("Failed to create judge: " + error.message);
                return;
            }

            if (data) {
                onCreated(data as Judge);
            }
        } catch (err) {
            onError?.("Failed to create judge: " + err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="add-judge-overlay">
            <div className="add-judge-modal">
                <h2 className="add-judge-title">Create Judge</h2>

                <form className="add-judge-form" onSubmit={handleSubmit}>
                    <input
                        className="add-judge-name"
                        type="text"
                        placeholder="Judge Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />

                    <textarea
                        placeholder="System Prompt / Rubric"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        required
                    />

                    <div className="add-judge-model-active-row">
                        <select value={model} onChange={(e) => setModel(e.target.value)}>
                            <option value="auto-free">Auto (Free LLM: Groq → HF → Heuristic)</option>
                            <option value="groq/llama-3.1-8b-instant">Groq: llama-3.1-8b-instant</option>
                            <option value="hf/mistralai/Mistral-7B-Instruct-v0.2">Hugging Face: Mistral-7B-Instruct</option>
                            <option value="heuristic">Heuristic (no external API)</option>
                        </select>

                        <label className="add-judge-active-button">
                            <input
                                type="checkbox"
                                checked={active}
                                onChange={() => setActive((v) => !v)}
                            />
                            Active
                        </label>
                    </div>

                    <div className="add-judge-actions">
                        <button
                            className="add-judge-cancel"
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button className="add-judge-submit"
                                type="submit"
                                disabled={submitting}
                        >
                            {submitting ? "Creating..." : "Create Judge"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
