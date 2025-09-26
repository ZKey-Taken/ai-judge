import {type FC, useState} from "react";
import "./HomePage.css";
import {type Appendix, Steps} from "../lib/Types.ts";
import UploadFileStep from "../components/UploadFileStep.tsx";

const HomePage: FC = () => {
    const [currentStep, setCurrentStep] = useState<Steps>(Steps.UploadFile);
    const [appendix, setAppendix] = useState<Appendix[]>();

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
        </div>
    );
};

export default HomePage;
