import React, { createContext, useContext, useState } from 'react';

interface SliderContextProps {
  sliderRef: string;
  setSliderRef: React.Dispatch<React.SetStateAction<string>>;
  showSlider: boolean;
  setShowSlider: React.Dispatch<React.SetStateAction<boolean>>;
  ClassifyLabel: string;
  setClassifyLabel: React.Dispatch<React.SetStateAction<string>>;
  ClassifyConfidence: number;
  setClassifyConfidence: React.Dispatch<React.SetStateAction<number>>;
}

// Initialize with default null values or equivalent
export const SliderContext = createContext<SliderContextProps>({
  sliderRef: '',
  setSliderRef: () => {},
  showSlider: false,
  setShowSlider: () => {},
  ClassifyLabel: '',
  setClassifyLabel: () => {},
  ClassifyConfidence: 0,
  setClassifyConfidence: () => {}
});

export const SliderProvider: React.FC = ({ children }) => {
  const [sliderRef, setSliderRef] = useState("");
  const [showSlider, setShowSlider] = useState(false);
  const [ClassifyLabel, setClassifyLabel] = useState("");
  const [ClassifyConfidence, setClassifyConfidence] = useState(0);

  return (
    <SliderContext.Provider value={{ 
        sliderRef, setSliderRef,
        showSlider, setShowSlider,
        ClassifyLabel, setClassifyLabel,
        ClassifyConfidence, setClassifyConfidence
    }}>
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
