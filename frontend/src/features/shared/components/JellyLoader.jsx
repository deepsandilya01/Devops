import React from "react";
import "./JellyLoader.css";

export default function JellyLoader({ style = {} }) {
  return (
    <div className="jelly-contain" style={style}>
      <svg className="jelly-svg" viewBox="0 0 255 100">
        <ellipse className="jelly-1" rx="10" ry="10" />
        <ellipse className="jelly-2" rx="10" ry="10" />
        <ellipse className="jelly-3" rx="10" ry="10" />
        <ellipse className="jelly-4" rx="10" ry="10" />
        <ellipse className="jelly-5" rx="10" ry="10" />
        <ellipse className="floor-1" />
        <ellipse className="floor-2" />
        <ellipse className="floor-3" />
        <ellipse className="floor-4" />
        <ellipse className="floor-5" />
      </svg>
    </div>
  );
}
