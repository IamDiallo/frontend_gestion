import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Divider,
  IconButton,
  CssBaseline,
  useMediaQuery,
  Menu,
  MenuItem,
  Button,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { useThemeContext } from "../contexts/ThemeContext";
import { usePermissions } from '../context/PermissionContext'; // Import permissions context
import Sidebar from './Sidebar';
import Logo from './common/Logo';
import { AuthService } from '../services/auth'; // Import the auth service

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));

const AppBarStyled = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<{
  open?: boolean;
}>(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const Layout: React.FC = () => {
  const theme = useTheme();
  const { toggleColorMode, darkMode } = useThemeContext();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(!isSmallScreen);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);  const navigate = useNavigate();
  const { userRole } = usePermissions(); // Get user role from permissions context
  
  // Add state to store current user information
  const [currentUser, setCurrentUser] = useState({
    username: '',
    role: ''
  });

  // Effect to load user information on component mount
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // Use cached data from AuthService.getCurrentUser (uses 5-minute cache)
        const userData = await AuthService.getCurrentUser();
        setCurrentUser({
          username: userData.username || 'Utilisateur',
          role: userData.profile_data?.role || userRole || ''
        });
      } catch (error) {
        console.error('Error fetching user info:', error);
        // Fallback to stored permissions data if API call fails
        setCurrentUser({
          username: localStorage.getItem('username') || 'Utilisateur',
          role: userRole || ''
        });
      }
    };

    fetchUserInfo();
    // Only run once on mount, not when userRole changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect to handle screen size changes
  useEffect(() => {
    if (isSmallScreen) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  }, [isSmallScreen]);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  // Helper function to format role for display
  const getRoleLabel = (role: string): string => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'consultant': return 'Consultant';
      case 'supervisor': return 'Superviseur';
      case 'commercial': return 'Commercial';
      case 'cashier': return 'Chef de Caisse';
      default: return role || 'Utilisateur';
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBarStyled position="fixed" open={open} sx={{ boxShadow: '0 0 10px rgba(0,0,0,0.1)', borderRadius: '0' }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ mr: 2, ...(open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
          <Logo variant="full" sx={{ flexGrow: 1 }} />
          <Tooltip title={darkMode ? 'Mode clair' : 'Mode sombre'}>
            <IconButton onClick={toggleColorMode} color="inherit">
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
          <Button
            onClick={handleMenuOpen}
            color="inherit"
            startIcon={<PersonIcon />}
            sx={{ textTransform: 'none', ml: 1 }}
          >
            {currentUser.username || 'Utilisateur'}
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            {/* Add user role information to menu */}
            <MenuItem disableRipple sx={{ pointerEvents: 'none', opacity: 0.7 }}>
              <Typography variant="caption">
                {getRoleLabel(currentUser.role)}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
              <PersonIcon fontSize="small" sx={{ mr: 1 }} />
              Mon profil
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
              Déconnexion
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBarStyled>

      {/* Use the Sidebar component here */}
      <Sidebar 
        open={open} 
        onClose={handleDrawerClose} 
        variant={isSmallScreen ? "temporary" : "persistent"} 
        width={drawerWidth} 
      />

      <Main open={open} sx={{ 
        flexGrow: 1, 
        p: { xs: 2, sm: 3 },
        marginLeft: isSmallScreen ? 0 : (open ? 0 : `-${drawerWidth}px`),
        width: isSmallScreen ? '100%' : 'auto',
        overflow: 'auto' // Add overflow auto
      }}>
        <DrawerHeader
        
        />
        <Box >
          <Outlet />
        </Box>
      </Main>
    </Box>
  );
};

export default Layout;