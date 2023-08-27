import React, { useContext, useState } from 'react';
import { SliderContext, useSlider } from './SliderContext';
// import { submitInference } from './Classify';
import { inferenceSqueezenet } from '../utils/predict';

const Sidebar: React.FC = () => {
  const sliderContext = useContext(SliderContext); // Use context here
  const { setClassifyLabel, setClassifyConfidence } = useSlider(); // Use context here

  // const [topResultLabel, setLabel] = useState("");
  // const [topResultConfidence, setConfidence] = useState("");
  // const [inferenceTime, setInferenceTime] = useState("");

  const handleButtonHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = '#0056b3';
  };

  const handleZoom = () => {
    // Implement zoom logic here
  };

  const handleSegment = () => {
    console.log('Segmenting image...');
  };

  const handleGrab = () => {
    // Implement grab logic here
  };

  // Define your handlers here
  const handleClassify = async () => {  
    if (sliderContext) {  
      console.log('Classifying image...');

      var [inferenceResult, infTime] = await inferenceSqueezenet(sliderContext.sliderRef);

      // Get the highest confidence.
      var topResult = inferenceResult[0];

      // Update the label and confidence
      setClassifyLabel(topResult.name.toUpperCase());
      setClassifyConfidence(topResult.probability);
      console.log(sliderContext);
    } else {
      console.log('Slider reference is not set. Unable to classify.');
    }
  };

  const sidebarStyle: React.CSSProperties = {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '75px',
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
    <div style={sidebarStyle}>
      <button style={buttonStyle}
              onClick={onClose} onMouseEnter={handleButtonHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007bff'}>Close</button>
      <button style={buttonStyle}
              onClick={handleClassify} onMouseEnter={handleButtonHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007bff'}>Classify</button>
      <button style={buttonStyle}
              onClick={handleZoom} onMouseEnter={handleButtonHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007bff'}>Zoom</button>
      <button style={buttonStyle}
              onClick={handleSegment} onMouseEnter={handleButtonHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007bff'}>Segm</button>
      <button style={buttonStyle}
              onClick={handleGrab} onMouseEnter={handleButtonHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007bff'}>Grab</button>
    </div>
  );
};

export default Sidebar;
