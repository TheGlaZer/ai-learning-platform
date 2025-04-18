import React from 'react';
import { useTheme } from '@mui/material';

interface LogoProps {
  width?: number;
  height?: number;
  color?: string;
  variant?: 'light' | 'dark' | 'auto';
  animated?: boolean;
}

const Logo: React.FC<LogoProps> = ({ 
  width = 40, 
  height = 40, 
  color,
  variant = 'auto',
  animated = true
}) => {
  const theme = useTheme();
  
  // Determine color based on variant and theme
  let logoColor = color;
  
  if (!logoColor) {
    if (variant === 'light') {
      logoColor = '#ffffff';
    } else if (variant === 'dark') {
      logoColor = '#3f51b5';
    } else {
      // Auto mode - use theme to determine color
      logoColor = theme.palette.mode === 'dark' ? '#ffffff' : theme.palette.primary.main;
    }
  }

  // Secondary color for gradient
  const secondaryColor = theme.palette.mode === 'dark' 
    ? '#9fa8da' 
    : theme.palette.secondary.main || '#ff4081';
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Define gradients */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={logoColor} />
          <stop offset="100%" stopColor={secondaryColor} />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        
        {animated && (
          <>
            {/* Pulse animation for circle */}
            <radialGradient id="pulseGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stopColor={logoColor} stopOpacity="0.8">
                <animate attributeName="stop-opacity" values="0.8;0.3;0.8" dur="3s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor={logoColor} stopOpacity="0">
                <animate attributeName="stop-opacity" values="0;0.2;0" dur="3s" repeatCount="indefinite" />
              </stop>
            </radialGradient>
          </>
        )}
      </defs>
      
      {/* Modern circular background */}
      <circle cx="50" cy="50" r="45" fill="url(#logoGradient)" opacity="0.1" />
      
      {/* Outer ring */}
      <circle 
        cx="50" 
        cy="50" 
        r="40" 
        stroke="url(#logoGradient)" 
        strokeWidth="2.5" 
        fill="none" 
        filter="url(#glow)"
      >
        {animated && (
          <animate attributeName="stroke-dasharray" values="0,251;251,0" dur="3s" repeatCount="1" />
        )}
      </circle>
      
      {/* Decorative element - simple circuit-like pattern */}
      <path
        d="M30,50 L42,50 M58,50 L70,50"
        stroke="url(#logoGradient)"
        strokeWidth="2"
        strokeLinecap="round"
      >
        {animated && (
          <animate attributeName="stroke-dasharray" values="0,20;20,0" dur="2s" repeatCount="indefinite" />
        )}
      </path>
      
      {/* Decorative dot elements */}
      <circle cx="30" cy="50" r="3" fill="url(#logoGradient)">
        {animated && <animate attributeName="r" values="2;3;2" dur="3s" repeatCount="indefinite" />}
      </circle>
      <circle cx="70" cy="50" r="3" fill="url(#logoGradient)">
        {animated && <animate attributeName="r" values="2;3;2" dur="3s" repeatCount="indefinite" begin="0.5s" />}
      </circle>
      
      {/* AI Text */}
      <text x="50" y="58" textAnchor="middle" fill="url(#logoGradient)" fontWeight="700" fontSize="26" fontFamily="Arial, sans-serif">
        AI
      </text>
      
      {/* Optional glowing effect behind text */}
      {animated && (
        <circle cx="50" cy="50" r="20" fill="url(#pulseGradient)" opacity="0.4" />
      )}
    </svg>
  );
};

export default Logo; 