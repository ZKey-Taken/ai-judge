import type {Answer, Question, Submission, SubmissionsPageProps} from "../lib/Types.ts";
import {type FC, useEffect, useState} from "react";
import "./SubmissionsPage.css";
import {ConfirmationOverlay} from "../components/Overlay.tsx";

const SubmissionsPage: FC<SubmissionsPageProps> = ({userId}) => {
    const [submissions, setSubmissions] = useState<Submission>();
    const [questions, setQuestions] = useState<Question>()
    const [answers, setAnswers] = useState<Answer>();
    const [overlayMessage, setOverlayMessage] = useState<string>("");

    /*
    TODO:
    - Show all submissions and their questions/answers.
    - Display all evaluation results (verdict + reasoning + judge) for each submission.
     */

    useEffect(() => {
        const getAllSubmission = async () => {
            try {
                // TODO: Obtain data from supabase
            } catch (error) {
                setOverlayMessage(error as string);
            }
        }

        getAllSubmission();
    }, [userId]);


    return (
        <div className="submissions-page-container">
            <h1>Submissions</h1>

            {overlayMessage &&
                <ConfirmationOverlay
                    title="Unable to obtain submissions"
                    message={overlayMessage}
                    onConfirm={() => setOverlayMessage("")}
                />
            }
        </div>
    );
};

export default SubmissionsPage;