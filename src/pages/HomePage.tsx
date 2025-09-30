import {type FC, useState} from "react";
import "./HomePage.css";
import {type Appendix, type HomePageProps, type JudgeAssignments, Steps} from "../lib/Types.ts";
import UploadFileStep from "../steps/UploadFileStep.tsx";
import AssignJudgesStep from "../steps/AssignJudgesStep.tsx";
import {supabase} from "../lib/Supabase.ts";

const HomePage: FC<HomePageProps> = ({userId}) => {
    const [currentStep, setCurrentStep] = useState<Steps>(Steps.UploadFile);
    const [evaluationComplete, setEvaluationComplete] = useState<boolean>(false);
    const [appendix, setAppendix] = useState<Appendix[]>([]);

    const runEvaluation = async (assignments: JudgeAssignments) => {
        try {
            setEvaluationComplete(false);

            const {data, error} = await supabase.functions.invoke("run-evaluation", {
                body: {appendix, assignments},
            });

            if (error) {
                console.error("run-evaluation error:", error);
            } else {
                console.log("AI Judges done:", data);
            }
        } catch (error) {
            console.log(error);
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
                    onNextStep={async (assignments: JudgeAssignments) => {
                        await runEvaluation(assignments);
                        setCurrentStep(Steps.RunEvaluations);
                    }}
                />
            }
            {currentStep === Steps.RunEvaluations &&
                (evaluationComplete ?
                        <p className="home-page-p">
                            Evaluation Complete, goto Results page to view!
                        </p>
                        :
                        <p className="home-page-p">
                            Running Evaluation ...
                        </p>
                )
            }
        </div>
    );
};

export default HomePage;
