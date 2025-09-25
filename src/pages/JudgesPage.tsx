import {type FormEvent, useState} from "react";
import "./JudgePage.css";

export type Judge = {
    id: string;
    name: string;
    prompt: string;
    model: string;
    active: boolean;
};

export default function JudgePage() {
    const [judges, setJudges] = useState<Judge[]>([]);
    const [name, setName] = useState("");
    const [prompt, setPrompt] = useState("");
    const [model, setModel] = useState("gpt-4");
    const [active, setActive] = useState(true);

    const addJudge = (e: FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const newJudge: Judge = {
            id: crypto.randomUUID(),
            name,
            prompt,
            model,
            active,
        };

        setJudges((prev) => [...prev, newJudge]);

        // Reset form
        setName("");
        setPrompt("");
        setModel("gpt-4");
        setActive(true);
    };

    const toggleActive = (id: string) => {
        setJudges((prev) =>
            prev.map((j) => (j.id === id ? {...j, active: !j.active} : j))
        );
    };

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
                {judges.length === 0 ? (
                    <p className="empty">
                        No judges yet. Create one above.
                    </p>
                ) : (
                    <ul>
                        {/*TODO: Complete the classNames later when actual judges appear*/}
                        {judges.map((j) => (
                            <li key={j.id} className={j.active ? "" : ""}>
                                <div>
                                    <strong>{j.name}</strong> ({j.model})
                                    <p>{j.prompt}</p>
                                </div>
                                <div className="">
                                    <button onClick={() => toggleActive(j.id)}>
                                        {j.active ? "Deactivate" : "Activate"}
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
