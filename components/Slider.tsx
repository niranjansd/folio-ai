import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './Sidebar';

type SliderProps = {
  image: string;
  onClose: () => void;
};

const Slider: React.FC<SliderProps> = ({ image, onClose }) => {
  const [sliderRef, setSliderRef] = useState("");
  const [drawing, setDrawing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [endX, setEndX] = useState(0);
  const [endY, setEndY] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const [correctedStartX, setCorrectedStartX] = useState(0);
  const [correctedStartY, setCorrectedStartY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [viewport, setViewport] = useState({
    left: 0,
    top: 0,
    width: 500,
    height: 300,
  });

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleDragStart = (e: React.MouseEvent) => {
    if (zoomed) {
      setDragging(true);
      setDragStartX(e.clientX);
      setDragStartY(e.clientY);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (imageRef.current === null) {
      return;
    }
    if (zoomed) {
      handleDragStart(e);
    } else {
    setDrawing(true);
    const rect = imageRef.current.getBoundingClientRect(); // Use the image ref
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setStartX(x);
    setStartY(y);
    setEndX(x); // Initialize endX and endY with the same values
    setEndY(y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (imageRef.current === null) {
      return;
    }
    if (drawing) {
      const rect = imageRef.current.getBoundingClientRect();
      setEndX(e.clientX - rect.left);
      setEndY(e.clientY - rect.top);
    } else if (dragging) {
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      Object.assign(imageRef.current.style, {
        left: `${dx}px`,
        top: `${dy}px`,
      });
    }
  };

  const handleMouseUp = () => {
    if (imageRef.current === null) {
      return;
    }
    if (drawing) {
      setDrawing(false);
      const rect = imageRef.current.getBoundingClientRect();
      const originalWidth = rect.width;
      const originalHeight = rect.height;
  
      const selectedWidth = Math.abs(startX - endX);
      const selectedHeight = Math.abs(startY - endY);
      
      const left = Math.min(startX, endX);
      const top = Math.min(startY, endY);
  
      const zoomFactorWidth = originalWidth / selectedWidth;
      const zoomFactorHeight = originalHeight / selectedHeight;
  
      const zoomFactor = Math.min(zoomFactorWidth, zoomFactorHeight);
  
      const zoomStyle = {
        transform: `scale(${zoomFactor})`,
        transformOrigin: `${left}px ${top}px`,
        width: `${originalWidth}px`,
        height: `${originalHeight}px`,
        objectFit: 'cover',
      };
  
      Object.assign(imageRef.current.style, zoomStyle);
      setZoomed(true);
    } else if (dragging) {
      const rect = imageRef.current.getBoundingClientRect();
      const left = rect.left;
      const top = rect.top;
      setStartX(left);
      setStartY(top);
      setDragging(false);
    };    
  };

  const handleDoubleClick = () => {
    if (imageRef.current === null) {
      return;
    }
    if (zoomed) {
      Object.assign(imageRef.current.style, {
        position: 'relative',
        // left: '0',
        // top: '0',
        // width: 'auto',
        // height: 'auto',
        maxWidth: '100%',
        maxHeight: '100%',
        width: '100%',
        height: '100%',
        objectFit: 'cover',
      });
      const rect = imageRef.current.getBoundingClientRect();
      setViewport({
        left: correctedStartX,
        top: correctedStartY,
        width: rect.width,
        height: rect.height,
      });
      setZoomed(false);
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const rect = e.target.getBoundingClientRect();
    setCorrectedStartX(rect.left);
    setCorrectedStartY(rect.top);
    setViewport({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    });
  };

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    border: '2px solid rgba(255, 255, 255, 0.7)',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    left: Math.min(startX, endX) + correctedStartX,
    top: Math.min(startY, endY) + correctedStartY,
    width: Math.abs(startX - endX),
    height: Math.abs(startY - endY),
  };
  // setSliderRef(imageRef.current);
  console.log(sliderRef);
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      // onClick={onClose}
    >
      <Sidebar onClose={onClose} />
      <div
        style={{
          position: 'absolute',
          overflow: 'hidden',
          width: viewport.width,
          height: viewport.height,
        }}
      >
        <img
          ref={(imageRef)}
          // ref={(imageRef) => setSliderRef(imageRef)}
          id="slider-image"
          src={image}
          alt="Slider Preview"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            position: 'relative',
          }}
          onLoad={handleImageLoad}
          onDoubleClick={handleDoubleClick}
          // onClick={(e) => e.stopPropagation()}
        />
      </div>
      {drawing && <div style={overlayStyle}></div>}
    </div>
  );
};

export default Slider;
