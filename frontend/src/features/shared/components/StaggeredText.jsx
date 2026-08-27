import React from 'react';
import '../styles/StaggeredText.css';

const StaggeredText = ({ text }) => {
  return (
    <span className="stagger-group">
      {text.split('').map((char, index) => (
        <span key={index} className="stagger-char-wrap" style={{ '--stagger': index }}>
          <span className="stagger-char" data-char={char === ' ' ? '\u00A0' : char}>
            {char === ' ' ? '\u00A0' : char}
          </span>
        </span>
      ))}
    </span>
  );
};

export default StaggeredText;
