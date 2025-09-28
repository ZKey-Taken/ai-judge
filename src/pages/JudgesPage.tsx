import {type FC, useState} from "react";
import "./JudgePage.css";
import {supabase} from "../lib/Supabase.ts";
import {ConfirmationOverlay} from "../components/Overlay.tsx";
import type {JudgePageProps} from "../lib/Types.ts";
import {Loader2} from "lucide-react";
import {JudgeItem} from "../components/JudgeItem.tsx";
import {AddJudgeOverlay} from "../components/AddJudgeOverlay.tsx";
import {useFetchJudgesQuery} from "../queries/useFetchJudges.tsx";
import {useQueryClient} from "@tanstack/react-query";

const JudgePage: FC<JudgePageProps> = ({userId}) => {
    const queryClient = useQueryClient();
    const {data: judges = [], isLoading: loadingJudges, error} = useFetchJudgesQuery(userId);

    const [overlayMessage, setOverlayMessage] = useState<string>(error?.message || "");
    const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);

    const refetchJudges = async () => {
        await queryClient.invalidateQueries({queryKey: ["judges", userId]});
    }

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

            await refetchJudges();
        } catch (error) {
            setOverlayMessage("Failed to update judge:" + error);
        }
    };

    return (
        <div className="judge-page">
            <div className="judge-list">
                <div className="judge-title-div">
                    <h2>Existing Judges</h2>
                    <button
                        type="button"
                        className="add-judge-btn"
                        onClick={() => setIsCreateOpen(true)}
                    >
                        New Judge
                    </button>
                </div>

                {loadingJudges &&
                    <div className="loading-container">
                        <Loader2 className="spinner"/>
                        <p>Loading...</p>
                    </div>
                }

                {!loadingJudges && judges.length === 0 ? (
                    <p className="empty-judges">
                        No judges yet. Create one above.
                    </p>
                ) : (
                    <ul>
                        {judges.map((j) => (
                            <li key={j.id}>
                                <JudgeItem
                                    judge={j}
                                    userId={userId}
                                    onUpdated={refetchJudges}
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
                    onCreated={async () => {
                        await refetchJudges();
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