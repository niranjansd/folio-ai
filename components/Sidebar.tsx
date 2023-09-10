import React, { useContext, useState } from 'react';
import { SliderContext, useSlider } from './SliderContext';
import { inferenceSqueezenet, inferenceSuperRes, inferenceSAM } from '../utils/predict';
import { loadEmbedding, loadSAM } from '../utils/sam';
import * as ImgUtils from '../utils/imageHelper';
import { Session } from '../utils/session';

const Sidebar: React.FC = () => {
  const sliderContext = useContext(SliderContext); // Use context here
  const [isLoading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [encoderSession, setEncoderSession] = useState<Session | null>(null);
  const [decoderSession, setDecoderSession] = useState<Session | null>(null);

  const handleButtonHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = '#0056b3';
  };

  const handleZoom = () => {
    // Implement zoom logic here
  };

  const handleLoadModel = async () => {
    setLoading(true);
    setLoadingText("Loading model...");
    if (sliderContext) {
      const path = sliderContext.sliderRef;
      const image = await ImgUtils.loadImageFromPath(path);
      const [encoderSession, decoderSession] = await loadSAM(image);
      setDecoderSession(decoderSession);
      setEncoderSession(encoderSession);
      if (!sliderContext.embeddings) {
        const embedding = await loadEmbedding(encoderSession, image);
        sliderContext.setEmbeddings(embedding);
      }
    } else {
      console.log('Slider reference is not set. Unable to load model.');
    }
    setLoading(false);
  };

  const handleSegment = async () => {
    setLoading(true);
    setLoadingText("Segmenting...");    
    if (sliderContext) {
      var [embedding, mask, maskBounds] = await inferenceSAM(sliderContext, decoderSession, encoderSession);
      sliderContext.setOverlayBounds(maskBounds);
      sliderContext.setOverlays(mask);
      sliderContext.setPoints([]);
      sliderContext.setEmbeddings(embedding);
    } else {
      console.log('Slider reference is not set. Unable to segment.');
    }
    setLoading(false);
  };

  const handleUpscale = async () => {
    setLoading(true);
    setLoadingText("Upscaling...");
    if (sliderContext) {  
      console.log('Upscaling image...');
      var [inferenceResult, infTime] = await inferenceSuperRes(sliderContext.sliderRef);
      sliderContext.setSliderRef(inferenceResult);
    } else {
      console.log('Slider reference is not set. Unable to classify.');
    }
    setLoading(false);
  };

  // Define your handlers here
  const handleClassify = async () => {  
    setLoading(true);
    setLoadingText("Classifying...");    
    if (sliderContext) {  
      console.log('Classifying image...');

      var [inferenceResult, infTime] = await inferenceSqueezenet(sliderContext.sliderRef);

      // Get the highest confidence.
      var topResult = inferenceResult[0];

      // Update the label and confidence
      sliderContext.setClassifyLabel(topResult.name.toUpperCase());
      sliderContext.setClassifyConfidence(topResult.probability);
      // console.log(sliderContext);
    } else {
      console.log('Slider reference is not set. Unable to classify.');
    }
    setLoading(false);
  };

  const onClose = () => {
    sliderContext.setShowSlider(false);
  };

  const handleClear = () => {
    sliderContext.setPoints([]);
    sliderContext.setOverlays(null);
    sliderContext.setClassifyLabel("");
    sliderContext.setClassifyConfidence(0);
    sliderContext.setClearCanvas("all");
  };

  const sidebarStyle: React.CSSProperties = {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '125px',
    height: '100%',
    backgroundColor: '#f5f5f5',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '10px',
    boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
  };

  const buttonStyle = {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    margin: '10px 0',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500' as '500', // Explicit casting to string literal type
    transition: 'background-color 0.3s',
  };

  
  return (
    <div>
      <div style={sidebarStyle}>
      {isLoading ? <div>{loadingText}</div> : null}
      <button style={buttonStyle}
              onClick={onClose} onMouseEnter={handleButtonHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007bff'}>Close</button>
      <button style={buttonStyle}
              disabled={(sliderContext.embeddings !== null && decoderSession !== null) || isLoading}
              onClick={handleLoadModel} onMouseEnter={handleButtonHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007bff'}>Load</button>
      <button style={buttonStyle}
              onClick={handleClear} onMouseEnter={handleButtonHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007bff'}>Clear</button>
      <button style={buttonStyle}
              onClick={handleSegment} onMouseEnter={handleButtonHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007bff'}>Segment</button>
    </div>
    </div>
  );
};

export default Sidebar;
