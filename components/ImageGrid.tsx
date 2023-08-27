import React, { useContext, useState } from 'react';
import Slider from './Slider';
import { SliderContext, useSlider } from './SliderContext';

interface ImageGridProps {
  images: string[];
  sliderIndex: number;
  setSliderIndex: (index: number) => void;
}

const ImageGrid: React.FC<ImageGridProps> = ({ images, sliderIndex, setSliderIndex }) => {
  const sliderContext = useContext(SliderContext); // Use context here

  return (
    <div id='imagegrid'>
      {images.map((image, index) => (
        <img
          key={index}
          src={image}
          alt={`Preview ${index}`}
          style={{ width: '100px', height: '100px', margin: '5px' }}
          onClick={() => {
            setSliderIndex(index);
            sliderContext.setShowSlider(true);
            sliderContext.setSliderRef(image);
          }}
        />
      ))}
     {sliderContext.showSlider &&
     <Slider onClose={() => sliderContext.setShowSlider(false)} />}
     </div>
  );
};

export default ImageGrid;
