import {type FC, useEffect, useState} from "react";
import "./JudgePage.css";
import type {Database} from "../lib/Database.ts";
import {supabase} from "../lib/Supabase.ts";
import {ConfirmationOverlay} from "../components/Overlay.tsx";
import type {JudgePageProps} from "../lib/Types.ts";
import {Loader2} from "lucide-react";
import {JudgeItem} from "../components/JudgeItem.tsx";
import {AddJudgeOverlay} from "../components/AddJudgeOverlay.tsx";

type Judge = Database['public']['Tables']['judges']['Row'];

const JudgePage: FC<JudgePageProps> = ({userId}) => {
    const [judges, setJudges] = useState<Judge[]>([]);
    const [loadingJudges, setLoadingJudges] = useState<boolean>(true);
    const [overlayMessage, setOverlayMessage] = useState<string>("");
    const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);

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
            <div className="judge-title-div">
                <h1>Judge Page</h1>
                <button
                    type="button"
                    className="add-judge-btn"
                    onClick={() => setIsCreateOpen(true)}
                >
                    New Judge
                </button>
            </div>


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

            {isCreateOpen && (
                <AddJudgeOverlay
                    onClose={() => setIsCreateOpen(false)}
                    onCreated={(created) => {
                        setJudges((prev) => [...prev, created]);
                        setIsCreateOpen(false);
                    }}
                    onError={(msg) => setOverlayMessage(msg)}
                />
            )}

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