'use client';

import React, { useEffect } from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
      <Box sx={{ py: 6 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Something went wrong
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          We're sorry, but there was a problem loading this page.
        </Typography>
        
        <Button 
          variant="contained" 
          color="primary" 
          onClick={reset}
          startIcon={<RefreshIcon />}
          sx={{ mt: 2 }}
        >
          Try again
        </Button>
      </Box>
    </Container>
  );
} 