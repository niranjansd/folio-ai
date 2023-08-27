import React, { createContext, useContext, useState } from 'react';

interface SliderContextProps {
  sliderRef: string;
  setSliderRef: React.Dispatch<React.SetStateAction<string>>;
  ClassifyLabel: string;
    setClassifyLabel: React.Dispatch<React.SetStateAction<string>>;
  ClassifyConfidence: number;
    setClassifyConfidence: React.Dispatch<React.SetStateAction<number>>;
}

export const SliderContext = createContext<SliderContextProps | null>(null);


export const SliderProvider: React.FC = ({ children }) => {
    const [sliderRef, setSliderRef] = useState("");
    const [ClassifyLabel, setClassifyLabel] = useState("");
    const [ClassifyConfidence, setClassifyConfidence] = useState(0);

  return (
    <SliderContext.Provider value={{ sliderRef, setSliderRef, ClassifyLabel, setClassifyLabel,
                                     ClassifyConfidence, setClassifyConfidence }}>
      {children}
    </SliderContext.Provider>
  );
};

export const useSlider = () => {
    const context = useContext(SliderContext);
    if (!context) {
      throw new Error("useSlider must be used within a SliderProvider");
    }
    return context;
  };
// Path: components\SliderContext.tsx  
