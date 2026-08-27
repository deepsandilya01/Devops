import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../styles/NotFound.css';
import MouseTrail from "../../auth/components/MouseTrail";

const NotFound = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    
    let imgData = ctx.getImageData(0, 0, width, height);
    let pix = imgData.data;

    const flickering = () => {
      // It creates an intense static effect by assigning random grayscale values
      for (let i = 0; i < pix.length; i += 4) {
        const color = (Math.random() * 255) + 50;
        pix[i] = color;
        pix[i + 1] = color;
        pix[i + 2] = color;
        pix[i + 3] = 255; // Alpha
      }
      ctx.putImageData(imgData, 0, 0);
    };

    const interval = setInterval(flickering, 30);

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);
      imgData = ctx.getImageData(0, 0, width, height);
      pix = imgData.data;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="not-found-wrapper">
      <MouseTrail />
      <canvas ref={canvasRef} id="canvas"></canvas>
      <div className="caps"></div>
      <div className="frame">
        <div></div>
        <div></div>
        <div></div>
      </div>
      <h1 className="not-found-title">404</h1>
      
      <div className="not-found-content">
        <p>SYSTEM OFFLINE / PAGE NOT FOUND</p>
        <Link to="/" className="not-found-btn">RETURN TO BASE</Link>
      </div>
    </div>
  );
};

export default NotFound;
