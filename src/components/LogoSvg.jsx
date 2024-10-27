// src/components/LogoSvg.jsx
import React from 'react';

const LogoSvg = ({ className }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 300 60" 
      className={className}
    >
      {/* Main Logo Text */}
      <text x="45" y="38" fontFamily="Arial, sans-serif" fontSize="32" fontWeight="bold">
        <tspan fill="#FFFFFF">KE</tspan>
        <tspan fill="#FF4D4D" dx="10">Ajira</tspan>
        <tspan fill="#4ADE80">Link</tspan>
      </text>
      
      {/* Icon - Stylized combination of 'K' and chain link */}
      <g transform="translate(20, 15)">
        {/* K shape */}
        <path 
          d="M0 0 L0 30 M0 15 L12 0 M0 15 L12 30" 
          stroke="#FFFFFF" 
          strokeWidth="3" 
          fill="none"
        />
        {/* Chain link suggesting connection */}
        <circle cx="15" cy="15" r="4" fill="#FF4D4D"/>
        <circle cx="25" cy="15" r="4" fill="#4ADE80"/>
        <line x1="15" y1="15" x2="25" y2="15" stroke="#FFFFFF" strokeWidth="2"/>
      </g>

      {/* Flag-inspired accent lines */}
      <line x1="45" y1="45" x2="280" y2="45" stroke="#FFFFFF" strokeWidth="1"/>
      <line x1="45" y1="47" x2="280" y2="47" stroke="#FF4D4D" strokeWidth="1"/>
      <line x1="45" y1="49" x2="280" y2="49" stroke="#4ADE80" strokeWidth="1"/>
    </svg>
  );
};

export default LogoSvg;