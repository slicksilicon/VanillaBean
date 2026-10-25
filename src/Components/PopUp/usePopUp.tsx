import { useState, useCallback } from "react";
import type { PopUpButtonFormat, PopUpResult,  } from "../PopUp/PopUp";

interface PopUpState {
    isVisible: boolean;
    message: string;
    buttonFormat: PopUpButtonFormat;
    resolver?: (result: PopUpResult) => void;
}

export const usePopUp = () => {
    const [popUpState, setPopUpState] = useState<PopUpState>({
        isVisible: false,
        message: "",
        buttonFormat: "ok-only"
    });

    const showPopUp = useCallback((
        message: string, 
        buttonFormat: PopUpButtonFormat = "ok-only"
    ): Promise<PopUpResult> => {
        return new Promise((resolve) => {
            setPopUpState({
                isVisible: true,
                message,
                buttonFormat,
                resolver: resolve
            });
        });
    }, []);

    const handlePopUpResult = useCallback((result: PopUpResult) => {
        if (popUpState.resolver) {
            popUpState.resolver(result);
        }
        setPopUpState(prev => ({
            ...prev,
            isVisible: false,
            resolver: undefined
        }));
    }, [popUpState]);

    return {
        popUpState,
        showPopUp,
        handlePopUpResult
    };
};