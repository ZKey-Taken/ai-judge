import {type FC, useState} from "react";
import "./HomePage.css";
import {type Appendix, type HomePageProps, Steps} from "../lib/Types.ts";
import UploadFileStep from "../steps/UploadFileStep.tsx";
import AssignJudgesStep from "../steps/AssignJudgesStep.tsx";

const HomePage: FC<HomePageProps> = ({userId}) => {
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
                    userId={userId}
                    onNextStep={() => {
                        setCurrentStep(Steps.RunEvaluations);
                    }}
                />
            }
        </div>
    );
};

export default HomePage;
