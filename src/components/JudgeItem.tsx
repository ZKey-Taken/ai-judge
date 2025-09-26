import {type FC, useMemo, useState} from "react";
import type {Database} from "../lib/Database.ts";
import {supabase} from "../lib/Supabase.ts";
import "./JudgeItem.css";

type Judge = Database["public"]["Tables"]["judges"]["Row"];

type JudgeItemProps = {
    judge: Judge;
    userId: string;
    onUpdated: (updated: Judge) => void;
    onError?: (message: string) => void;
    onToggleActive: (id: string, currentIsActive: boolean) => Promise<void> | void;
};

export const JudgeItem: FC<JudgeItemProps> = ({
                                                  judge,
                                                  userId,
                                                  onUpdated,
                                                  onError,
                                                  onToggleActive,
                                              }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState(judge.name);
    const [prompt, setPrompt] = useState(judge.system_prompt);
    const [model, setModel] = useState(judge.model_name);
    const [active, setActive] = useState<boolean>(judge.is_active);

    const canSave = useMemo(() => {
        return name.trim().length > 0 && prompt.trim().length > 0 && model.trim().length > 0;
    }, [name, prompt, model]);

    const handleSave = async () => {
        if (!canSave || saving) return;
        setSaving(true);
        try {
            const update = {
                name,
                system_prompt: prompt,
                model_name: model,
                is_active: active,
            };

            const {data, error} = await supabase
                .from("judges")
                .update(update)
                .match({id: judge.id, user_id: userId})
                .select()
                .single();

            if (error) {
                onError?.("Failed to save judge: " + error.message);
                return;
            }

            if (data) {
                onUpdated(data as Judge);
                setIsEditing(false);
            }
        } catch (e) {
            onError?.("Failed to save judge: " + e);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setName(judge.name);
        setPrompt(judge.system_prompt);
        setModel(judge.model_name);
        setActive(judge.is_active);
    };

    if (!isEditing) {
        return (
            <div className="judges-div">
                <strong>{judge.name}</strong> ({judge.model_name})
                <p className="prompt">{judge.system_prompt}</p>
                <p>
                    Status:
                    <span className={`status ${judge.is_active ? "active" : "inactive"}`}>
            {judge.is_active ? " Active" : " Inactive"}
          </span>
                </p>
                <div style={{display: "flex", gap: 8, marginTop: 8}}>
                    <button
                        onClick={() => onToggleActive(judge.id, judge.is_active ?? false)}
                        className={judge.is_active ? "deactivate" : "activate"}
                    >
                        {judge.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button onClick={() => setIsEditing(true)} className="edit-btn">
                        Edit
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="judges-div">
            <div style={{display: "flex", flexDirection: "column", gap: 8}}>
                <label>
                    <div style={{fontSize: 12, opacity: 0.8}}>Name</div>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="judge-name"
                        placeholder="Judge Name"
                    />
                </label>

                <label>
                    <div style={{fontSize: 12, opacity: 0.8}}>System Prompt / Rubric</div>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="System Prompt / Rubric"
                    />
                </label>

                <div className="model-active-row" style={{gap: 12}}>
                    <select value={model} onChange={(e) => setModel(e.target.value)}>
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                        <option value="claude-2">Claude 2</option>
                        <option value="gemini-pro">Gemini Pro</option>
                    </select>

                    <label className="judge-active-button">
                        <input
                            type="checkbox"
                            checked={active}
                            onChange={() => setActive((v) => !v)}
                        />
                        Active
                    </label>
                </div>

                <div style={{display: "flex", gap: 8, marginTop: 8}}>
                    <button
                        onClick={handleSave}
                        className="save-btn"
                        disabled={!canSave || saving}
                    >
                        {saving ? "Saving..." : "Save"}
                    </button>
                    <button onClick={handleCancel} className="cancel-btn" disabled={saving}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};
