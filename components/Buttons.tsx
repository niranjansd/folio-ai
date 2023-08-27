import React from 'react';

interface CategorizeButtonProps {
  handleCategorization: () => void;
  hasImages: boolean;
  viewCategorized: boolean;
}

const CategorizeButton: React.FC<CategorizeButtonProps> = ({ handleCategorization, hasImages, viewCategorized }) => {
  if (!hasImages) return null; // Return null if hasImages is false

  return (
    <button
      onClick={handleCategorization}
      style={{
        background: '#4CAF50',
        border: 'none',
        color: 'white',
        padding: '15px 32px',
        textAlign: 'center',
        textDecoration: 'none',
        display: 'inline-block',
        fontSize: '16px',
        margin: '4px 2px',
        cursor: 'pointer',
        borderRadius: '4px',
      }}
    >
      {viewCategorized ? "Uncategorize" : "Categorize"}
    </button>
  );
};

export default CategorizeButton;
