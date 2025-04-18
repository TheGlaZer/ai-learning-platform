"use client";

import React from 'react';
import { useRTL } from '@/contexts/RTLContext';
import { Box, Typography, Button } from '@mui/material';

interface RTLAwareComponentProps {
  title: string;
  content: string;
}

export const RTLAwareComponent: React.FC<RTLAwareComponentProps> = ({ 
  title, 
  content 
}) => {
  const { isRTL, direction, toggleDirection } = useRTL();

  return (
    <Box
      sx={{
        padding: 3,
        margin: 2,
        borderRadius: 2,
        backgroundColor: 'background.paper',
        boxShadow: 1,
        // Example of direction-specific styling
        textAlign: isRTL ? 'right' : 'left',
      }}
    >
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
        {title}
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3 }}>
        {content}
      </Typography>
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: isRTL ? 'flex-start' : 'flex-end',
        gap: 2
      }}>
        <Button 
          variant="outlined" 
          onClick={toggleDirection}
        >
          Toggle Direction (Current: {direction})
        </Button>
        
        <Button 
          variant="contained"
          // This component automatically inherits RTL behavior from MUI theme
        >
          Submit
        </Button>
      </Box>
    </Box>
  );
};

export default RTLAwareComponent; 