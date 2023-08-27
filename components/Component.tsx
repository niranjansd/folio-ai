import React, { useState, useRef } from 'react';
// import * as tf from '@tensorflow/tfjs';
// import * as mobilenet from '@tensorflow-models/mobilenet';
import Upload from './Upload';
import Buttons from './Buttons';
import Animations from './Animations';
import ImageGrid from './ImageGrid';
import Categories from './Categories';


const Component: React.FC = (props) => {
    const fileInput = useRef(null);
    const [images, setImages] = useState<string[]>([]);
    const [showSlider, setShowSlider] = useState(false);
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
      
    
    // // //  run inference function - runs the model on the images
    // // const runInference = async () => {
    // //     setIsLoading(true);
    // //     const model = await mobilenet.load();
    // //     const categorizedImages = {};
        
    // //     for (const image of images) {
    // //         const imageElement = document.createElement('img');
    // //         imageElement.src = image;
        
    // //         const imageTensor = tf.browser.fromPixels(imageElement);
    // //         const resized = tf.image.resizeBilinear(imageTensor, [224, 224]);
    // //         const normalized = resized.div(tf.scalar(255));
        
    // //         const predictions = await model.classify(normalized);
        
    // //         // Assuming that the prediction class is in predictions[0].className
    // //         const predictionClass = predictions[0].className;
        
    // //         if (!categorizedImages[predictionClass]) {
    // //         categorizedImages[predictionClass] = [];
    // //         }
        
    // //         categorizedImages[predictionClass].push(image);
    // //     }
        
    // //     setCategories(categorizedImages);
    // //     setIsCategorized(true); // Categorization is complete
    // //     setIsLoading(false);
    // //     };
    
    // //     // View categories or not.
    // // const toggleCategorization = () => {
    // //     setViewCategorized(!viewCategorized);
    // //     };
    
    // // const handleCategorization = async () => {
    // //     if (!isCategorized) {
    // //         await runInference(); // Existing inference function
    // //         setIsCategorized(true);
    // //     }
    // //     toggleCategorization();
    // //     };
          

    return (
        <div>
            <Upload
                handleDragOver={handleDragOver}
                handleDragEnter={handleDragEnter}
                handleDrop={handleDrop}
                handleFileUpload={handleFileUpload}
                fileInput={fileInput}
            />
    {/* //         <Buttons handleCategorization={handleCategorization} hasImages={images.length > 0} viewCategorized={viewCategorized}/> */}
                {isLoading && <Animations />}
                {viewCategorized ? <Categories categories={categories} /> :
                <ImageGrid  images={images}
                            showSlider={showSlider}
                            sliderIndex={sliderIndex}
                            setShowSlider={setShowSlider}
                            setSliderIndex={setSliderIndex}
                            />}
            </div>
            // <div>rot</div>
    );
};

export default Component;
