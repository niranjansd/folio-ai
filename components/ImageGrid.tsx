import React from 'react';
import Slider from './Slider';
import { useSlider } from './SliderContext';

interface ImageGridProps {
  images: string[];
  showSlider: boolean;
  sliderIndex: number;
  setShowSlider: (show: boolean) => void;
  setSliderIndex: (index: number) => void;
}

const ImageGrid: React.FC<ImageGridProps> = ({ images, showSlider, sliderIndex, setShowSlider, setSliderIndex }) => {
  const { setSliderRef } = useSlider(); // Use context here

  return (
    <div>
      {images.map((image, index) => (
        <img
          key={index}
          src={image}
          alt={`Preview ${index}`}
          style={{ width: '100px', height: '100px', margin: '5px' }}
          onClick={() => {
            setSliderIndex(index);
            setShowSlider(true);
            setSliderRef(image);
          }}
        />
      ))}
      {showSlider && <Slider image={images[sliderIndex]} onClose={() => setShowSlider(false)} />}
    </div>
  );
};

export default ImageGrid;
