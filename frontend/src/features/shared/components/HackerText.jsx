import React, { useState, useEffect, useRef } from "react";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";

const HackerText = ({ text, className = "", style = {} }) => {
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    let iteration = 0;
    
    clearInterval(intervalRef.current);
    
    if (isHovering) {
      intervalRef.current = setInterval(() => {
        setDisplayText((prev) => 
          text
            .split("")
            .map((char, index) => {
              if (index < iteration) {
                return text[index];
              }
              return LETTERS[Math.floor(Math.random() * LETTERS.length)];
            })
            .join("")
        );

        if (iteration >= text.length) {
          clearInterval(intervalRef.current);
        }
        
        iteration += 1 / 2;
      }, 30);
    } else {
      setDisplayText(text);
    }

    return () => clearInterval(intervalRef.current);
  }, [isHovering, text]);

  return (
    <span
      className={`hacker-text ${className}`}
      style={{ display: 'inline-block', whiteSpace: 'nowrap', ...style }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {displayText}
    </span>
  );
};

export default HackerText;
