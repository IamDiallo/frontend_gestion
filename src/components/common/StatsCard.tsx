import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  useTheme
} from '@mui/material';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'secondary';
}

const StatsCard = React.memo(({ 
  title, 
  value, 
  icon, 
  color = 'primary' 
}: StatsCardProps) => {
  const theme = useTheme();
  
  return (
    <Card sx={{ 
      borderRadius: 2,
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '6px',
        height: '100%',
        backgroundColor: theme.palette[color].main,
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
              {value}
            </Typography>
          </Box>
          <Avatar sx={{ 
            bgcolor: `${theme.palette[color].main}15`, 
            color: `${color}.main`,
            width: 56,
            height: 56
          }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
});

StatsCard.displayName = 'StatsCard';

export default StatsCard;
