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
            {/* Pulse animations for nodes */}
            <radialGradient id="pulseGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stopColor={logoColor} stopOpacity="0.8">
                <animate attributeName="stop-opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor={logoColor} stopOpacity="0">
                <animate attributeName="stop-opacity" values="0;0.3;0" dur="2s" repeatCount="indefinite" />
              </stop>
            </radialGradient>
          </>
        )}
      </defs>
      
      {/* Modern circular background with subtle gradient */}
      <circle cx="50" cy="50" r="45" fill="url(#logoGradient)" opacity="0.1" />
      
      {/* Brain stylized outline with smoother curves */}
      <path
        d="M65,30c-3.5,0-6.5,1.8-8,4.5c-1.5-2.7-4.5-4.5-8-4.5c-5,0-9,4-9,9c0,2,0.6,3.8,1.8,5.3
        C38,51.5,38,57,35,63c-2.5,5,1.5,10,7,10c2.2,0,4.2-1,5.5-2.5l2.5-2.8l2.5,2.8C54,72,56,73,58.2,73
        c5.5,0,9.5-5,7-10c-3-6-3-11.5-6.2-17.7c1.2-1.5,1.8-3.3,1.8-5.3C74,34,70,30,65,30z"
        stroke="url(#logoGradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#glow)"
      />
      
      {/* Neural network nodes with pulse animation */}
      {animated ? (
        <>
          <circle cx="50" cy="42" r="6" fill="url(#pulseGradient)" opacity="0.6" />
          <circle cx="38" cy="52" r="6" fill="url(#pulseGradient)" opacity="0.6" />
          <circle cx="62" cy="52" r="6" fill="url(#pulseGradient)" opacity="0.6" />
          <circle cx="50" cy="62" r="6" fill="url(#pulseGradient)" opacity="0.6" />
        </>
      ) : null}
      
      <circle cx="50" cy="42" r="3.5" fill="url(#logoGradient)">
        {animated && <animate attributeName="r" values="3;4;3" dur="3s" repeatCount="indefinite" />}
      </circle>
      <circle cx="38" cy="52" r="3.5" fill="url(#logoGradient)">
        {animated && <animate attributeName="r" values="3;4;3" dur="3s" repeatCount="indefinite" begin="0.5s" />}
      </circle>
      <circle cx="62" cy="52" r="3.5" fill="url(#logoGradient)">
        {animated && <animate attributeName="r" values="3;4;3" dur="3s" repeatCount="indefinite" begin="1s" />}
      </circle>
      <circle cx="50" cy="62" r="3.5" fill="url(#logoGradient)">
        {animated && <animate attributeName="r" values="3;4;3" dur="3s" repeatCount="indefinite" begin="1.5s" />}
      </circle>
      
      {/* Neural connections with increased width */}
      <line x1="50" y1="42" x2="38" y2="52" stroke="url(#logoGradient)" strokeWidth="1.8">
        {animated && (
          <animate attributeName="stroke-opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite" begin="0.2s" />
        )}
      </line>
      <line x1="50" y1="42" x2="62" y2="52" stroke="url(#logoGradient)" strokeWidth="1.8">
        {animated && (
          <animate attributeName="stroke-opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite" begin="0.7s" />
        )}
      </line>
      <line x1="38" y1="52" x2="50" y2="62" stroke="url(#logoGradient)" strokeWidth="1.8">
        {animated && (
          <animate attributeName="stroke-opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite" begin="1.2s" />
        )}
      </line>
      <line x1="62" y1="52" x2="50" y2="62" stroke="url(#logoGradient)" strokeWidth="1.8">
        {animated && (
          <animate attributeName="stroke-opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite" begin="1.7s" />
        )}
      </line>
      
      {/* Modern text treatment */}
      <text x="50" y="88" textAnchor="middle" fill="url(#logoGradient)" fontWeight="700" fontSize="14" fontFamily="Arial, sans-serif">
        AI LEARN
      </text>
    </svg>
  );
};

export default Logo; 