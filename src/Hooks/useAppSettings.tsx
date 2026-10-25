/* NO FAST REFRESH SUPPORT FOR THIS MODULE */
import React, { createContext, useContext, useState } from "react";

export interface AppSettingsInterface {
    selectedSegment: string;
    setSelectedSegment: (segment: string) => void;
}

const defaultSettings: AppSettingsInterface = {
    selectedSegment: "",
    setSelectedSegment: () => {},
};

const AppSettingsContext = createContext(defaultSettings);

export const AppSettingsProvider: React.FC<React.PropsWithChildren<object>> = ({ children }) => {
    const [selectedSegment, setSelectedSegment] = useState("");

    return (
        <AppSettingsContext.Provider value={{ selectedSegment, setSelectedSegment }}>
            {children}
        </AppSettingsContext.Provider>
    );
};


// eslint-disable-next-line react-refresh/only-export-components
export const useAppSettings = () => {
  return useContext(AppSettingsContext);
};
