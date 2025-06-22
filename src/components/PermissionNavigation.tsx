import React from 'react';
import { 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Tooltip,
  Skeleton
} from '@mui/material';
import { NavLink, useLocation } from 'react-router-dom';
import { usePermissions } from '../context/PermissionContext';

interface PermissionNavigationItemProps {
  to: string;
  icon: React.ReactNode;
  text: string;
  requiredPermission?: string | null;
  open: boolean;
  forceShow?: boolean; // New prop to force showing the item
}

const PermissionNavigationItem: React.FC<PermissionNavigationItemProps> = ({
  to,
  icon,
  text,
  requiredPermission,
  open,
  forceShow = false
}) => {
  const location = useLocation();
  const { hasPermission, loading } = usePermissions();

  // Always render the item during loading or if forceShow is true
  if (loading || forceShow) {
    const content = (
      <ListItemButton
        component={NavLink}
        to={to}
        sx={{
          minHeight: 48,
          justifyContent: open ? 'initial' : 'center',
          px: 2.5,
          borderRadius: '8px',
          mb: 0.5,
          '&.active': {
            bgcolor: 'primary.light',
            color: 'primary.contrastText',
            '& .MuiListItemIcon-root': {
              color: 'primary.contrastText',
            }
          }
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: open ? 3 : 'auto',
            justifyContent: 'center',
          }}
        >
          {icon}
        </ListItemIcon>
        {loading && open ? (
          <Skeleton variant="text" width="80%" height={24} />
        ) : (
          <ListItemText 
            primary={text} 
            sx={{ 
              opacity: open ? 1 : 0,
              '& .MuiTypography-root': {
                fontWeight: location.pathname === to ? 'bold' : 'normal',
              }
            }} 
          />
        )}
      </ListItemButton>
    );

    return (
      <ListItem disablePadding sx={{ display: 'block' }}>
        {open ? content : <Tooltip title={text} placement="right">{content}</Tooltip>}
      </ListItem>
    );
  }
  
  // For items with no permission requirement, always show them
  if (requiredPermission === null) {
    const content = (
      <ListItemButton
        component={NavLink}
        to={to}
        sx={{
          minHeight: 48,
          justifyContent: open ? 'initial' : 'center',
          px: 2.5,
          borderRadius: '8px',
          mb: 0.5,
          '&.active': {
            bgcolor: 'primary.light',
            color: 'primary.contrastText',
            '& .MuiListItemIcon-root': {
              color: 'primary.contrastText',
            }
          }
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: open ? 3 : 'auto',
            justifyContent: 'center',
          }}
        >
          {icon}
        </ListItemIcon>
        <ListItemText 
          primary={text} 
          sx={{ 
            opacity: open ? 1 : 0,
            '& .MuiTypography-root': {
              fontWeight: location.pathname === to ? 'bold' : 'normal',
            }
          }} 
        />
      </ListItemButton>
    );

    return (
      <ListItem disablePadding sx={{ display: 'block' }}>
        {open ? content : <Tooltip title={text} placement="right">{content}</Tooltip>}
      </ListItem>
    );
  }
  
  // Check for permission directly
  const hasAccess = requiredPermission ? hasPermission(requiredPermission) : true;
  
  // Don't render if no permission
  if (!hasAccess) {
    return null;
  }

  const content = (
    <ListItemButton
      component={NavLink}
      to={to}
      sx={{
        minHeight: 48,
        justifyContent: open ? 'initial' : 'center',
        px: 2.5,
        borderRadius: '8px',
        mb: 0.5,
        '&.active': {
          bgcolor: 'primary.light',
          color: 'primary.contrastText',
          '& .MuiListItemIcon-root': {
            color: 'primary.contrastText',
          }
        },
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: 0,
          mr: open ? 3 : 'auto',
          justifyContent: 'center',
        }}
      >
        {icon}
      </ListItemIcon>
      <ListItemText 
        primary={text} 
        sx={{ 
          opacity: open ? 1 : 0,
          '& .MuiTypography-root': {
            fontWeight: location.pathname === to ? 'bold' : 'normal',
          }
        }} 
      />
    </ListItemButton>
  );

  return (
    <ListItem disablePadding sx={{ display: 'block' }}>
      {open ? content : (
        <Tooltip title={text} placement="right">
          {content}
        </Tooltip>
      )}
    </ListItem>
  );
};

export default PermissionNavigationItem;
