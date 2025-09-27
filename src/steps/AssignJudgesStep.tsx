import {type FC} from "react";
import type {AssignJudgesProps} from "../lib/Types.ts";
import "./AssignJudgesStep.css";

const AssignJudgesStep: FC<AssignJudgesProps> = ({appendix, onNextStep}) => {

    return (
        <div className="assign-judges-container">
            {appendix.map((a) => {
                return (
                    <div key={a.id} className="assign-judges-appendix">
                        <p>{a.queueId}</p>
                        {a.questions.map((q) => {
                            return (
                                <div key={q.data.id} className="assign-judges-question">
                                    <p>{q.data.questionType}</p>
                                    <p>{q.data.questionText}</p>
                                </div>
                            )
                        })}
                    </div>
                );
            })}
        </div>
    )
}

export default AssignJudgesStep;