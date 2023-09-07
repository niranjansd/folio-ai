import React, { createContext, useContext, useState } from 'react';

interface SliderContextProps {
  sliderRef: string;
  setSliderRef: React.Dispatch<React.SetStateAction<string>>;
  showSlider: boolean;
  setShowSlider: React.Dispatch<React.SetStateAction<boolean>>;
  sliderSize: number[];
  setSliderSize: React.Dispatch<React.SetStateAction<number[]>>;
  embeddings: Float32Array | null;
  setEmbeddings: React.Dispatch<React.SetStateAction<Float32Array | null>>;
  ClassifyLabel: string;
  setClassifyLabel: React.Dispatch<React.SetStateAction<string>>;
  ClassifyConfidence: number;
  setClassifyConfidence: React.Dispatch<React.SetStateAction<number>>;
  overlays: string[];
  setOverlays: React.Dispatch<React.SetStateAction<string[]>>;
  points: Array<number[]>;
  setPoints: React.Dispatch<React.SetStateAction<Array<number[]>>>;
}

// Initialize with default null values or equivalent
export const SliderContext = createContext<SliderContextProps>({
  sliderRef: '',
  setSliderRef: () => {},
  showSlider: false,
  setShowSlider: () => {},
  sliderSize: [0, 0],
  setSliderSize: () => {},
  embeddings: null,
  setEmbeddings: () => {},
  ClassifyLabel: '',
  setClassifyLabel: () => {},
  ClassifyConfidence: 0,
  setClassifyConfidence: () => {},
  overlays: [],
  setOverlays: () => {},
  points: [],
  setPoints: () => {}
});

export const SliderProvider: React.FC = ({ children }) => {
  const [sliderRef, setSliderRef] = useState("");
  const [showSlider, setShowSlider] = useState(false);
  const [sliderSize, setSliderSize] = useState([0, 0]);
  const [embeddings, setEmbeddings] = useState<Float32Array | null>(null);
  const [ClassifyLabel, setClassifyLabel] = useState("");
  const [ClassifyConfidence, setClassifyConfidence] = useState(0);
  const [overlays, setOverlays] = useState([] as string[]);
  const [points, setPoints] = useState([] as Array<number[]>);


  return (
    <SliderContext.Provider value={{ 
        sliderRef, setSliderRef,
        showSlider, setShowSlider,
        sliderSize, setSliderSize,
        embeddings, setEmbeddings,
        ClassifyLabel, setClassifyLabel,
        ClassifyConfidence, setClassifyConfidence,
        overlays, setOverlays,
        points, setPoints
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
