import {type FC, type FormEvent, useEffect, useState} from "react";
import "./JudgePage.css";
import type {Database} from "../lib/Database.ts";
import {supabase} from "../lib/Supabase.ts";
import {ConfirmationOverlay} from "../components/Overlay.tsx";
import type {JudgePageProps} from "../lib/Types.ts";
import {Loader2} from "lucide-react";
import {JudgeItem} from "../components/JudgeItem.tsx";

type Judge = Database['public']['Tables']['judges']['Row'];
type JudgeInsert = Database['public']['Tables']['judges']['Insert'];

const JudgePage: FC<JudgePageProps> = ({userId}) => {
    const [judges, setJudges] = useState<Judge[]>([]);
    const [name, setName] = useState<string>("");
    const [prompt, setPrompt] = useState<string>("");
    const [model, setModel] = useState<string>("gpt-4");
    const [active, setActive] = useState<boolean>(true);
    const [loadingJudges, setLoadingJudges] = useState<boolean>(true);
    const [overlayMessage, setOverlayMessage] = useState<string>("");

    const addJudge = async (e: FormEvent) => {
        try {
            e.preventDefault();
            if (!name.trim()) return;

            const newJudge: JudgeInsert = {
                model_name: model,
                name: name,
                system_prompt: prompt,
                is_active: active,
            };

            const {data, error} = await supabase
                .from("judges")
                .insert(newJudge)
                .select();

            if (error) {
                setOverlayMessage("Failed to create judge:" + error.message);
                return;
            }

            setJudges((prev) => [...prev, ...data]);

            // Reset form
            setName("");
            setPrompt("");
            setModel("gpt-4");
            setActive(true);
        } catch (error) {
            setOverlayMessage("Failed to create judge:" + error);
        }
    };

    const toggleActive = async (id: string, current_is_active: boolean) => {
        try {
            const {error} = await supabase
                .from('judges')
                .update({is_active: !current_is_active})
                .match({id: id, user_id: userId});

            if (error) {
                setOverlayMessage("Failed to update judge:" + error.message);
                return;
            }

            setJudges((prev) =>
                prev.map((j) => (j.id === id ? {...j, is_active: !j.is_active} : j))
            );
        } catch (error) {
            setOverlayMessage("Failed to update judge:" + error);
        }
    };

    useEffect(() => {
        const fetchJudges = async () => {
            try {
                const {data, error} = await supabase
                    .from("judges")
                    .select("*")
                    .eq("user_id", userId);

                if (error) {
                    setOverlayMessage("Failed to fetch judges: " + error.message);
                    return;
                }

                setJudges(data || []);
            } catch (error) {
                setOverlayMessage("Failed to fetch judges: " + error);
            } finally {
                setLoadingJudges(false);
            }
        };

        fetchJudges();
    }, [userId]);

    return (
        <div className="judge-page">
            <h1>Judge Page</h1>

            {/* Judge Form */}
            <form className="judge-form" onSubmit={addJudge}>
                <h2>Create Judge</h2>
                <input
                    className="judge-name"
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
                <div className="model-active-row">
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
                            onChange={() => setActive(!active)}
                        />
                        Active
                    </label>
                </div>
                <button type="submit" className="add-judge-btn">Add Judge</button>
            </form>


            {/* Judge List */}
            <div className="judge-list">
                <h2>Existing Judges</h2>
                {loadingJudges &&
                    <div className="loading-container">
                        <Loader2 className="spinner"/>
                        <p>Loading...</p>
                    </div>
                }

                {!loadingJudges && judges.length === 0 ? (
                    <p className="empty">
                        No judges yet. Create one above.
                    </p>
                ) : (
                    <ul>
                        {judges.map((j) => (
                            <li key={j.id}>
                                <JudgeItem
                                    judge={j}
                                    userId={userId}
                                    onUpdated={(updated) =>
                                        setJudges((prev) =>
                                            prev.map((jj) => (jj.id === updated.id ? updated : jj))
                                        )
                                    }
                                    onError={(msg) => setOverlayMessage(msg)}
                                    onToggleActive={(id, current) => toggleActive(id, current)}
                                />
                            </li>
                        ))}
                    </ul>

                )}
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
}

export default JudgePage;