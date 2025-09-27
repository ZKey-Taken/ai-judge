import {type FC, useState} from "react";
import "./HomePage.css";
import {type Appendix, Steps} from "../lib/Types.ts";
import UploadFileStep from "../steps/UploadFileStep.tsx";
import AssignJudgesStep from "../steps/AssignJudgesStep.tsx";

const HomePage: FC = () => {
    const [currentStep, setCurrentStep] = useState<Steps>(Steps.UploadFile);
    const [appendix, setAppendix] = useState<Appendix[]>([]);

    return (
        <div className="home-page">
            {currentStep === Steps.UploadFile &&
                <UploadFileStep
                    onNextStep={(givenAppendixArr) => {
                        setAppendix(givenAppendixArr);
                        setCurrentStep(Steps.AssignJudges);
                    }}
                />
            }
            {currentStep === Steps.AssignJudges &&
                <AssignJudgesStep
                    appendix={appendix}
                    onNextStep={() => {
                        setCurrentStep(Steps.RunEvaluations);
                    }}
                />
            }
        </div>
    );
};

export default HomePage;
