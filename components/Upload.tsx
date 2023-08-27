import React, { RefObject } from 'react';

interface UploadProps {
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInput: RefObject<HTMLInputElement>;
}

const Upload: React.FC<UploadProps> = ({ handleDragOver, handleDragEnter, handleDrop, handleFileUpload, fileInput }) => (
  <div
    style={{
      border: '2px dashed #aaa',
      padding: '10px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}
    onDragOver={handleDragOver}
    onDragEnter={handleDragEnter}
    onDrop={handleDrop}
  >
    <input type="file" multiple onChange={handleFileUpload} style={{ display: 'none' }} ref={fileInput} />
    <button onClick={() => fileInput.current?.click()}>Select Images</button>
    <p>or drag and drop them here</p>
  </div>
);

export default Upload;
