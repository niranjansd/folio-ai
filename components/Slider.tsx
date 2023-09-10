import React, { useState, useRef, useEffect, useContext } from 'react';
import Sidebar from './Sidebar';
import { SliderContext, SliderContextProps } from './SliderContext';

type SliderProps = {
  onClose: () => void;
};

const Slider: React.FC<SliderProps> = ({ onClose }) => {
  const sliderContext = useContext(SliderContext); // Use context here
  const image = sliderContext.sliderRef;
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlays = sliderContext.overlays;
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [endX, setEndX] = useState(0);
  const [endY, setEndY] = useState(0);
  const [zoomed, setZoomed] = useState(false);
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

  // *******************************************************
  // Canvas handlers
  // *******************************************************
  // New effect to draw the image on the canvas.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const img = new Image();
      img.src = image;
      img.addEventListener('load', function(this: HTMLImageElement) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        sliderContext.setSliderSize([this.width, this.height]);
      })};
  }, [image]);  

  // New click handler for drawing dots on canvas.
  const handleCanvasClick = (event: React.MouseEvent) => {
    if (overlayRef.current) {
      const canvas = overlayRef.current;
      const ctx = canvas.getContext('2d');
      const x = event.clientX - canvas.getBoundingClientRect().left;
      const y = event.clientY - canvas.getBoundingClientRect().top;
      if (!ctx) return;
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();

      const scaledx = x * sliderContext.sliderSize[0] / canvas.width;
      const scaledy = y * sliderContext.sliderSize[1] / canvas.height;
  
      sliderContext.setPoints([...sliderContext.points, [ scaledx, scaledy ]]);  
    };
  };

  const plotOverlays = (canvas: HTMLCanvasElement, sliderContext: SliderContextProps) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const masks = sliderContext.overlays;
    if (!masks) return;
    let maskBounds: Array<number>;
    if (!sliderContext.overlayBounds) {
      maskBounds = [0, 0, sliderContext.sliderSize[0], sliderContext.sliderSize[1]];
    } else {
      maskBounds = sliderContext.overlayBounds;
    }

    const imgWidth = sliderContext.sliderSize[0];
    const imgHeight = sliderContext.sliderSize[1];
    const canvasWidth = canvas.width || imgWidth; // Canvas dimensions
    const canvasHeight = canvas.height || imgHeight;
    const xScale = canvasWidth / imgWidth;
    const yScale = canvasHeight / imgHeight;
    // Step 1: Determine unique mask IDs
    const uniqueMasks = Array.from(new Set(masks));
    // Step 2 & 3: Create overlay for each unique mask ID and plot points
    uniqueMasks.forEach((maskId) => {
      if (maskId === 0) return;
      // Choose a color for this maskId, you can also map this dynamically
      ctx.fillStyle = `rgba(267, 61, 63, 0.5)`;
      for (let x=maskBounds[0]; x < maskBounds[2]; x++) {
        for (let y=maskBounds[1]; y < maskBounds[3]; y++) {
          if (masks[y + x * imgHeight] === maskId) {
            ctx.fillRect(x * xScale, y *yScale, xScale, yScale);
          }
        }
      }
    });
  };

  const plotPoints = (canvas: HTMLCanvasElement, sliderContext: SliderContextProps) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    for (let i = 0; i < sliderContext.points.length; i++) {
      const x = sliderContext.points[i][0] * canvas.width / sliderContext.sliderSize[0];
      const y = sliderContext.points[i][1] * canvas.height / sliderContext.sliderSize[1];
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // clear canvas effects
  useEffect(() => {
    if (sliderContext.clearCanvas === '') { return; }
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const clear = sliderContext.clearCanvas

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      if (clear !== 'all' ) {
        if (clear !== 'points') {
          plotPoints(canvas, sliderContext);
        }
        if (clear !== 'overlays') {
          plotOverlays(canvas, sliderContext);
        }
      }
      sliderContext.setClearCanvas('');
    }
    img.src = sliderContext.sliderRef;
  }, [sliderContext.clearCanvas]);  

  // Plot canvas overlays
  useEffect(() => {
    if (!sliderContext.overlays) { return; }
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    plotOverlays(canvas, sliderContext);
    // console.log('plotting overlays');
  }, [sliderContext.overlays]);  
  
  // *******************************************************
  // Slider handlers
  // *******************************************************
  // Effect to close the slider image viewer
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

  // const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  //   const rect = e.target.getBoundingClientRect();
  //   setCorrectedStartX(rect.left);
  //   setCorrectedStartY(rect.top);
  //   setViewport({
  //     left: rect.left,
  //     top: rect.top,
  //     width: rect.width,
  //     height: rect.height,
  //   });
  // };

  const classifyStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    width: '50%',
    height: '100px',
    backgroundColor: '#f5f5f5',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
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
  if (!sliderContext.showSlider) return null;
  // console.log(sliderContext);
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
    >
      <Sidebar />
      <div
        style={{
          position: 'absolute',
          overflow: 'hidden',
          width: viewport.width,
          height: viewport.height,
        }}
      >
        <canvas 
          ref={canvasRef}
          width={viewport.width}
          height={viewport.height}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            position: 'absolute',
            zIndex: 1,
          }}
        >
        </canvas>
        <canvas 
          ref={overlayRef}
          width={viewport.width}
          height={viewport.height}
          onClick={handleCanvasClick}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            position: 'absolute',
            backgroundColor: 'transparent',
            zIndex: 2,

          }}
        >
        </canvas>
      </div>
      {sliderContext.ClassifyLabel && <div style={classifyStyle}>{sliderContext.ClassifyLabel}</div>}
    </div>
  );
};

export default Slider;
