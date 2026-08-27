import React from 'react';
import '../styles/ElasticText.css';

const ElasticText = ({ text, className = "" }) => {
  const letters = text.split('');
  return (
    <span className={`elastic-text-wrap ${className}`}>
      <span className="elastic-text">
        {letters.map((char, i) => (
          <span 
            key={i} 
            className="elastic-char" 
            style={{ 
              '--idx': i,
              '--cnt': letters.length 
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </span>
    </span>
  );
};

export default ElasticText;
