import React, { useState, useRef } from 'react';
import Upload from './Upload';
import Animations from './Animations';
import ImageGrid from './ImageGrid';
import Categories from './Categories';


const Component: React.FC = (props) => {
    const fileInput = useRef(null);
    const [images, setImages] = useState<string[]>([]);
    const [sliderIndex, setSliderIndex] = useState(0);
    const [categories, setCategories] = useState({});
    const [isCategorized, setIsCategorized] = useState(false);
    const [viewCategorized, setViewCategorized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const processFiles = (files: FileList) => {
        const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
        const imagePromises: Promise<string>[] = imageFiles.map((imageFile) => {
            return new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (event) => resolve(event.target?.result as string);
              reader.onerror = (error) => reject(error);
              reader.readAsDataURL(imageFile);
            });
          });
          
          Promise.all<string>(imagePromises).then((imagesArray) => {
            setImages(imagesArray);
          });
        };
      

      const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
      };
      
      const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
      };
      
      const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
          processFiles(e.target.files);
        }
      };
      
      const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files) {
          processFiles(e.dataTransfer.files);
        }
      };
      
    

    return (
        <div>
            <Upload
                handleDragOver={handleDragOver}
                handleDragEnter={handleDragEnter}
                handleDrop={handleDrop}
                handleFileUpload={handleFileUpload}
                fileInput={fileInput}
            />
                {isLoading && <Animations />}
                {viewCategorized ? <Categories categories={categories} /> :
                <ImageGrid  images={images}
                            sliderIndex={sliderIndex}
                            setSliderIndex={setSliderIndex}
                            />}
            </div>
    );
};

export default Component;
