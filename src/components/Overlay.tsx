import {type FC, type ReactNode} from "react";
import "./Overlay.css";

interface OverlayProps {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    children?: ReactNode;
}

interface ConfirmationOverlayProps {
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    children?: ReactNode;
}

export const Overlay: FC<OverlayProps> = ({
                                              title,
                                              message,
                                              onConfirm,
                                              onCancel,
                                              confirmText = "OK",
                                              cancelText = "Cancel",
                                              children,
                                          }) => {
    return (
        <div className="overlay">
            <div className="overlay-content">
                <h2 className="overlay-title">{title}</h2>
                {children ?? <p className="overlay-message">{message}</p>}
                <div className="overlay-buttons">
                    <button onClick={onCancel}>{cancelText}</button>
                    <button onClick={onConfirm}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
};


export const ConfirmationOverlay: FC<ConfirmationOverlayProps> = ({
                                                                      title,
                                                                      message,
                                                                      onConfirm,
                                                                      confirmText = "OK",
                                                                      children,
                                                                  }) => {
    return (
        <div className="overlay">
            <div className="overlay-content">
                <h2 className="overlay-title">{title}</h2>
                {children ?? <p className="overlay-message">{message}</p>}
                <div className="overlay-single-button">
                    <button onClick={onConfirm}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
};