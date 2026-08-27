import React, { useEffect, useState } from "react";
import "../styles/PageSwitcher.css";
import gsap from "gsap";

const PageSwitcher = () => {
  const [maskUrl, setMaskUrl] = useState("");

  useEffect(() => {
    setMaskUrl(`/masking/masking-final.gif?t=${Date.now()}`);

    const tl = gsap.timeline();

    tl.to(".parts", {
      y: "100vh",
      duration: 0.5,
      delay: 0.1,
      stagger: 0.08,
      ease: "power3.inOut",
    });

    tl.to(".whole-cover", {
      y: "100vh",
      duration: 0.1,
      ease: "power3.out",
    });

    tl.fromTo(
      ".morph-container",
      { opacity: 0 },
      { opacity: 1, duration: 0.3 }
    );

    tl.to(".parts", {
      y: "-100vh",
      duration: 0.4,
      ease: "power3.inOut",
    });


    tl.to(".whole-cover", {
      display: "none",
      duration: 4.5,
    });

  }, []);

  return (
    <>
      <div className="switch-wrapper">
        <div className="parts part-1"></div>
        <div className="parts part-2"></div>
        <div className="parts part-3"></div>
        <div className="parts part-4"></div>
        <div className="parts part-5"></div>
        <div className="parts part-6"></div>
        <div className="parts part-7"></div>
      </div>

      <div
        className="whole-cover"
        style={{
          WebkitMaskImage: `url(${maskUrl})`,
          WebkitMaskSize: "cover",
          WebkitMaskPosition: "center",
          WebkitMaskRepeat: "no-repeat",
        }}
      >
        <svg className="morph-filters" style={{ width: 0, height: 0, position: "absolute" }}>
          <defs>
            <filter id="threshold">
              <feColorMatrix
                in="SourceGraphic"
                type="matrix"
                values="1 0 0 0 0
                        0 1 0 0 0
                        0 0 1 0 0
                        0 0 0 255 -140"
              />
            </filter>
          </defs>
        </svg>

        <div className="morph-container">
          <div className="word-rotator">
            <div className="morph-word">CRAFT</div>
            <div className="morph-word">DEPLOY</div>
            <div className="morph-word">SCALE</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PageSwitcher;