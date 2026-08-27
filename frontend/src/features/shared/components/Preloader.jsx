import React, { useEffect, useRef, useState, useMemo } from "react";
import { gsap } from "gsap";
import "../styles/Preloader.css";
import MouseTrail from "../../auth/components/MouseTrail";

const RollingColumn = ({ digits, duration, ease = "power2.inOut" }) => {
  const stripRef = useRef(null);

  useEffect(() => {
    if (stripRef.current) {
      const total = digits.length;
      gsap.to(stripRef.current, {
        y: `-${((total - 1) / total) * 100}%`,
        duration: duration,
        ease: ease,
      });
    }
  }, [duration, digits, ease]);

  return (
    <div className="counter-column">
      <div className="counter-strip" ref={stripRef}>
        {digits.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
    </div>
  );
};





const Preloader = ({ onComplete }) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const filledWrapperRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    gsap.set(filledWrapperRef.current, {
      WebkitMaskPosition: "0px 400px",
      maskPosition: "0px 400px"
    });

    const tl = gsap.timeline({
      onComplete: () => {
        if (onComplete) onComplete();
      }
    });

    tl.to({ value: 0 }, {
      value: 100,
      duration: 4.5,
      ease: "power2.inOut",
      onUpdate: function () {
        setProgress(Math.round(this.targets()[0].value));
      }
    }, 0);
    tl.to(filledWrapperRef.current, {
      WebkitMaskPosition: "1800px -200px",
      maskPosition: "1800px -200px",
      duration: 4.5,
      ease: "power2.inOut"
    }, 0)
      .to(".preloader-footer", {
        opacity: 0,
        y: 20,
        duration: 0.4,
        ease: "power2.in"
      }, "-=0.4")
      .to(filledWrapperRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.out"
      }, "zoom")
      .to(containerRef.current, {
        backgroundColor: "rgba(0,0,0,0)",
        duration: 1.2,
        ease: "power2.inOut"
      }, "zoom")
      .to(textRef.current, {
        scale: 180,
        opacity: 0,
        duration: 1.5,
        ease: "power4.in"
      }, "zoom")
      .to(containerRef.current, {
        opacity: 0,
        duration: 0.1
      });

  }, [onComplete]);

  const onesDigits = useMemo(() => {
    let d = [];
    for (let i = 0; i < 10; i++) d.push(...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    d.push(0);
    return d;
  }, []);

  const tensDigits = useMemo(() => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0], []);
  const hundredsDigits = useMemo(() => [0, 1], []);

  return (
    <div className="preloader-container" ref={containerRef}>
      <MouseTrail />
      <div className="noise-overlay" style={{ opacity: 0.15, zIndex: 1, pointerEvents: "none" }} />

      <div className="preloader-content">
        <div className="preloader-text-wrapper" ref={textRef}>
          <h1 className="preloader-text hollow">QUICKLIVE</h1>
          <div className="preloader-text-filled-wrapper" ref={filledWrapperRef}>
            <h1 className="preloader-text filled">QUICKLIVE</h1>
          </div>
        </div>

        <div className="preloader-footer">
          <div className="preloader-status">
            INITIALIZING ENVIRONMENT...
          </div>
          <div className="preloader-percentage">
            <div className="counter-column hundreds">
              <RollingColumn digits={hundredsDigits} duration={4.5} />
            </div>

            <RollingColumn digits={tensDigits} duration={4.5} />
            <RollingColumn digits={onesDigits} duration={4.5} />
            <span className="percentage-symbol">%</span>
          </div>

        </div>
      </div>
    </div>
  );
};


export default Preloader;
