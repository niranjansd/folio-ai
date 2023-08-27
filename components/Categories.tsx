import React, { useState } from 'react';
import ImageGrid from './ImageGrid';

interface CategoriesProps {
  categories: { [key: string]: string[] };
}

const Categories: React.FC<CategoriesProps> = ({ categories }) => {
  const [showSlider, setShowSlider] = useState(false);
  const [sliderIndex, setSliderIndex] = useState(0);

  return (
    <>
      {Object.keys(categories).map((category) => (
        <div key={category}>
          <h2>{category}</h2>
          <ImageGrid
            images={categories[category]}
            showSlider={showSlider}
            sliderIndex={sliderIndex}
            setShowSlider={setShowSlider}
            setSliderIndex={setSliderIndex}
          />
        </div>
      ))}
    </>
  );
};

export default Categories;
