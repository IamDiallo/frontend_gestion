import React from 'react';
import { Box, Typography, SxProps, Theme } from '@mui/material';

type LogoSize = 'small' | 'medium' | 'large';
type LogoVariant = 'full' | 'icon';

interface LogoProps {
  size?: LogoSize;
  variant?: LogoVariant;
  sx?: SxProps<Theme>;
}

const Logo: React.FC<LogoProps> = ({ size = 'medium', variant = 'full', sx = {} }) => {
  // Calculate font size based on the requested size
  const getFontSize = (size: LogoSize): string => {
    switch (size) {
      case 'small':
        return '1.25rem';
      case 'large':
        return '2.5rem';
      case 'medium':
      default:
        return '1.75rem';
    }
  };

  // Calculate the icon size based on the requested size
  const getIconSize = (size: LogoSize): number => {
    switch (size) {
      case 'small':
        return 32;
      case 'large':
        return 56;
      case 'medium':
      default:
        return 40;
    }
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        ...sx 
      }}
    >
      {/* Icon part of the logo */}
      <Box
        sx={{
          width: getIconSize(size),
          height: getIconSize(size),
          bgcolor: 'primary.main',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: getFontSize(size),
          mr: variant === 'full' ? 1 : 0,
        }}
      >
        G
      </Box>
      
      {/* Text part of the logo (only shown for full variant) */}
      {variant === 'full' && (
        <Typography 
          variant="h6" 
          component="div"
          sx={{ 
            fontWeight: 'bold',
            fontSize: getFontSize(size),
            color: 'primary.main'
          }}
        >
          Gestion
        </Typography>
      )}
    </Box>
  );
};

export default Logo;
