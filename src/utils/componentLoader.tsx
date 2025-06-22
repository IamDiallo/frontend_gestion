import React from 'react';
import { CircularProgress, Box } from '@mui/material';

// Loading fallback component
export const LoadingFallback: React.FC = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 4 }}>
    <CircularProgress />
  </Box>
);
