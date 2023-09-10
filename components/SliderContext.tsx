import React, { createContext, useContext, useState } from 'react';

export interface SliderContextProps {
  sliderRef: string;
  setSliderRef: React.Dispatch<React.SetStateAction<string>>;
  showSlider: boolean;
  setShowSlider: React.Dispatch<React.SetStateAction<boolean>>;
  sliderSize: number[];
  setSliderSize: React.Dispatch<React.SetStateAction<number[]>>;
  embeddings: Array<number> | null;
  setEmbeddings: React.Dispatch<React.SetStateAction<Array<number> | null>>;
  ClassifyLabel: string;
  setClassifyLabel: React.Dispatch<React.SetStateAction<string>>;
  ClassifyConfidence: number;
  setClassifyConfidence: React.Dispatch<React.SetStateAction<number>>;
  overlays: Array<number> | null;
  setOverlays: React.Dispatch<React.SetStateAction<Array<number> | null>>;
  overlayBounds: Array<number> | null;
  setOverlayBounds: React.Dispatch<React.SetStateAction<Array<number> | null>>;
  points: Array<number[]>;
  setPoints: React.Dispatch<React.SetStateAction<Array<number[]>>>;
  clearCanvas: string;
  setClearCanvas: React.Dispatch<React.SetStateAction<string>>;
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
  overlays: null,
  setOverlays: () => {},
  overlayBounds: null,
  setOverlayBounds: () => {},
  points: [],
  setPoints: () => {},
  clearCanvas: '',
  setClearCanvas: () => {}
});

export const SliderProvider: React.FC = ({ children }) => {
  const [sliderRef, setSliderRef] = useState("");
  const [showSlider, setShowSlider] = useState(false);
  const [sliderSize, setSliderSize] = useState([0, 0]);
  const [embeddings, setEmbeddings] = useState<Array<number> | null>(null);
  const [ClassifyLabel, setClassifyLabel] = useState("");
  const [ClassifyConfidence, setClassifyConfidence] = useState(0);
  const [overlays, setOverlays] = useState<Array<number> | null>(null);
  const [overlayBounds, setOverlayBounds] = useState<Array<number> | null>(null);
  const [points, setPoints] = useState([] as Array<number[]>);
  const [clearCanvas, setClearCanvas] = useState("");


  return (
    <SliderContext.Provider value={{ 
        sliderRef, setSliderRef,
        showSlider, setShowSlider,
        sliderSize, setSliderSize,
        embeddings, setEmbeddings,
        ClassifyLabel, setClassifyLabel,
        ClassifyConfidence, setClassifyConfidence,
        overlays, setOverlays,
        overlayBounds, setOverlayBounds,
        points, setPoints,
        clearCanvas, setClearCanvas
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
