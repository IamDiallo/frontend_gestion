import React, { useEffect, useState } from 'react';
import { 
  Drawer,
  List,
  Divider,
  Box,
  IconButton, 
  Typography,
  useMediaQuery,
  Skeleton,
  CircularProgress
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  Dashboard,
  ShoppingCart,
  People,
  LocalShipping,
  Inventory,
  Storefront,
  Group,
  AccountBalance,
  Settings,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { styled } from '@mui/material/styles';
import PermissionNavigationItem from './PermissionNavigation';
import { usePermissions } from '../context/PermissionContext';
import Logo from './common/Logo';

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant: "permanent" | "persistent" | "temporary";
  width: number;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose, variant, width }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { isAdmin, loading: permissionsLoading, refreshPermissions } = usePermissions();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Track when initial loading is complete
  useEffect(() => {
    if (!permissionsLoading && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [permissionsLoading, isInitialLoad]);
  // Check for user changes and refresh permissions if needed
  useEffect(() => {
    // Get current user from localStorage to detect user changes
    const storedUser = localStorage.getItem('current_user');
    
    // Only compare the string values to avoid unnecessary rerenders
    if (storedUser !== currentUser) {
      setCurrentUser(storedUser);
      
      // Only refresh permissions if there's actually a user logged in
      if (storedUser) {
        refreshPermissions(); // Reload permissions when user changes
      }
    }
  }, [currentUser, refreshPermissions]);

  // Define all navigation items with correct permission names
  const navigationItems = [
    {
      to: "/",
      icon: <Dashboard />,
      text: "Tableau de bord",
      requiredPermission: "view_dashboard"
    },
    {
      to: "/sales",
      icon: <ShoppingCart />,
      text: "Ventes",
      requiredPermission: "view_sale"
    },
    {
      to: "/clients",
      icon: <People />,
      text: "Clients",
      requiredPermission: "view_client"
    },
    {
      to: "/suppliers",
      icon: <LocalShipping />,
      text: "Suppliers",
      requiredPermission: "view_supplier"
    },
    {
      to: "/products",
      icon: <Inventory />,
      text: "Produits",
      requiredPermission: "view_product"
    },
    {
      to: "/production",
      icon: <Storefront />,
      text: "Production",
      requiredPermission: "view_production"
    },
    {
      to: "/inventory",
      icon: <Inventory />,
      text: "Inventaire",
      requiredPermission: "view_stock"
    },
    // Second section
    {
      divider: true
    },
    
    {
      to: "/treasury",
      icon: <AccountBalance />,
      text: "Trésorerie",
      requiredPermission: "view_treasury"
    },
    // Admin section
    {
      divider: true
    },
    {
      to: "/users",
      icon: <Group />,
      text: "Utilisateurs",
      requiredPermission: "view_user"
    },
    {
      to: "/settings",
      icon: <Settings />,
      text: "Paramètres", 
      requiredPermission: "view_parameters"
    }
  ];

  // Render a centered spinner for initial load
  if (isInitialLoad && permissionsLoading) {
    return (
      <Drawer
        sx={{
          width: width,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: width,
            boxSizing: 'border-box',
            backgroundColor: theme.palette.background.paper,
          },
        }}
        variant={variant}
        anchor="left"
        open={open}
        onClose={onClose}
      >
        <Box sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center',
          p: 2 
        }}>
          <CircularProgress size={40} />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Chargement...
          </Typography>
        </Box>
      </Drawer>
    );
  }

  // Render loading skeleton for navigation during loading state
  const renderLoadingItems = () => (
    <>
      {[1, 2, 3, 4].map((item) => (
        <Box key={`loading-${item}`} sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1 }}>
          <Skeleton variant="circular" width={24} height={24} sx={{ mr: open ? 3 : 0 }} />
          {open && <Skeleton variant="text" width={120} height={24} />}
        </Box>
      ))}
    </>
  );

  return (
    <Drawer
      sx={{
        width: width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: width,
          boxSizing: 'border-box',
          backgroundColor: theme.palette.background.paper,
          borderRight: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[1],
        },
      }}
      variant={variant}
      anchor="left"
      open={open}
      onClose={onClose}
    >
      <DrawerHeader sx={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: 2,
        py: 1.5
      }}>
        <Logo variant="full" size="medium" />
        {isSmallScreen && (
          <IconButton onClick={onClose}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </DrawerHeader>

      <Divider />

      <Box sx={{ p: 1 }}>
        <List component="nav" aria-label="main navigation" sx={{ p: 0.5 }}>
          {permissionsLoading ? (
            // Show loading skeleton
            renderLoadingItems()
          ) : (
            // Show actual navigation items based on permissions
            navigationItems.map((item, index) => {
              // Render divider if specified
              if ('divider' in item) {
                return <Divider key={`divider-${index}`} sx={{ my: 1 }} />;
              }
              
              // Typescript type assertion to access properties safely
              const navItem = item as {
                to: string;
                icon: React.ReactNode;
                text: string;
                requiredPermission?: string;
                adminOnly?: boolean;
              };
              
              // Special case for Dashboard - show during any state
              if (navItem.to === "/") {
                return (
                  <PermissionNavigationItem
                    key={navItem.to}
                    to={navItem.to}
                    icon={navItem.icon}
                    text={navItem.text}
                    requiredPermission={navItem.requiredPermission}
                    open={open}
                    forceShow={true} // Always show the dashboard
                  />
                );
              }
              
              // Skip admin-only items if user is not admin
              if (navItem.adminOnly && !isAdmin) {
                return null;
              }
              
              return (
                <PermissionNavigationItem
                  key={navItem.to}
                  to={navItem.to}
                  icon={navItem.icon}
                  text={navItem.text}
                  requiredPermission={navItem.requiredPermission}
                  open={open}
                />
              );
            })
          )}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;