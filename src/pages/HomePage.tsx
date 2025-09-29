import {type FC, useState} from "react";
import "./HomePage.css";
import {type Appendix, type HomePageProps, type JudgeAssignments, Steps} from "../lib/Types.ts";
import UploadFileStep from "../steps/UploadFileStep.tsx";
import AssignJudgesStep from "../steps/AssignJudgesStep.tsx";

const HomePage: FC<HomePageProps> = ({userId}) => {
    const [currentStep, setCurrentStep] = useState<Steps>(Steps.UploadFile);
    const [evaluationComplete, setEvaluationComplete] = useState<boolean>(false);
    const [appendix, setAppendix] = useState<Appendix[]>([]);

    const runEvaluation = (assignments: JudgeAssignments) => {
        try {
            setEvaluationComplete(false);

            console.log("Assignments:", assignments);

            // const res = await fetch("/supabase/functions/run-ai-judges", {
            //     method: "POST",
            //     headers: {"Content-Type": "application/json"},
            //     body: JSON.stringify({appendix,}),
            // });
            // const data = await res.json();
            // console.log("AI Judges done:", data);

        } catch (error) {
            console.log(error)
        } finally {
            setEvaluationComplete(true);
        }
    }

    return (
        <div className="home-page">
            {currentStep === Steps.UploadFile &&
                <UploadFileStep
                    onNextStep={(givenAppendixArr: Appendix[]) => {
                        setAppendix(givenAppendixArr);
                        setCurrentStep(Steps.AssignJudges);
                    }}
                />
            }
            {currentStep === Steps.AssignJudges &&
                <AssignJudgesStep
                    appendix={appendix}
                    userId={userId}
                    onNextStep={(assignments: JudgeAssignments) => {
                        runEvaluation(assignments);
                        setCurrentStep(Steps.RunEvaluations);
                    }}
                />
            }
            {currentStep === Steps.RunEvaluations &&
                (evaluationComplete ?
                        <p>Evaluation Complete</p>
                        :
                        <p>Running Evaluation ...</p>
                )
            }
        </div>
    );
};

export default HomePage;
