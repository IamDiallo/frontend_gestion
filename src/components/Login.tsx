import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Container,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff,
  LockOutlined,
  PersonOutline
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthService } from '../services/auth';
import { isTokenExpired } from '../utils/tokenValidation';
import Logo from './common/Logo';

interface LocationState {
  from?: {
    pathname: string;
  };
}

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token && !isTokenExpired(token)) {
      // Token exists and is valid, redirect to the home page or intended destination
      const from = (location.state as LocationState)?.from?.pathname || '/';
      navigate(from);
    } else if (token && isTokenExpired(token)) {
      // Token exists but is expired, clear it
      console.log('Token expired, clearing auth data');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_expiration');
      localStorage.removeItem('user_permissions');
      localStorage.removeItem('user_role');
      localStorage.removeItem('is_admin');
    }
  }, [location, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!username.trim()) {
      setError('Veuillez entrer votre nom d\'utilisateur');
      return;
    }
    
    if (!password) {
      setError('Veuillez entrer votre mot de passe');
      return;
    }
    
    setLoading(true);
    setError(null);    try {
      // Clear any stored permission data first to ensure fresh permissions are fetched
      // This is by design - permissions are refreshed on each login for security
      localStorage.removeItem('user_permissions');
      localStorage.removeItem('user_role');
      localStorage.removeItem('is_admin');
      
      // Clear any existing tokens before login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
        // Call the login API with credentials
      await AuthService.login(username, password);
      
      // Verify the tokens were received and stored
      if (!localStorage.getItem('access_token')) {
        console.error('Login successful but access token not stored');
        throw new Error('Erreur d\'authentification: token non reçu');
      }
      
      // Get the intended destination from location state, or default to home page
      const from = (location.state as LocationState)?.from?.pathname || '/';
      
      // Short delay to allow token to be processed
      setTimeout(() => {
        navigate(from);
      }, 100);
    } catch (err: unknown) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Une erreur est survenue lors de la connexion. Veuillez réessayer.';
      
      // Check if it's an API error with response data
      if (err && typeof err === 'object' && 'response' in err) {
        const apiError = err as { response?: { data?: { detail?: string } } };
        setError(apiError.response?.data?.detail || errorMessage);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box 
        sx={{ 
          marginTop: 8, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center' 
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            padding: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            borderRadius: 2,
            width: '100%'
          }}
        >
          <Logo size="large" sx={{ mb: 3 }} />
          
          <Typography component="h2" variant="h5" sx={{ mb: 3 }}>
            Connexion
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Nom d'utilisateur"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutline color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1
                }
              }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Mot de passe"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1
                }
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ 
                py: 1.5, 
                borderRadius: 1,
                fontWeight: 'bold',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  boxShadow: '0 6px 15px rgba(0, 0, 0, 0.15)',
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Se connecter'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;