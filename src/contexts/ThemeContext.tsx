import React, { createContext, useContext, useMemo, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, Theme, PaletteMode } from '@mui/material';

// Define the type for the context value
type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  toggleColorMode: () => void;
  darkMode: boolean;
  theme: Theme;
}

// Create the context with a default value
const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'light',
  toggleColorMode: () => {},
  darkMode: false,
  theme: createTheme(),
});

// Custom hook to use the theme context
export const useThemeContext = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

// Create a primary theme with specific light/dark palettes
const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light mode palette
          primary: {
            main: '#1976d2',
            light: '#42a5f5',
            dark: '#1565c0',
          },
          secondary: {
            main: '#9c27b0',
            light: '#ba68c8',
            dark: '#7b1fa2',
          },
          background: {
            default: '#f5f5f5',
            paper: '#ffffff',
          },
          text: {
            primary: '#212121',
            secondary: '#757575',
          },
        }
      : {
          // Dark mode palette
          primary: {
            main: '#90caf9',
            light: '#e3f2fd',
            dark: '#42a5f5',
          },
          secondary: {
            main: '#ce93d8',
            light: '#f3e5f5',
            dark: '#ab47bc',
          },
          background: {
            default: '#121212',
            paper: '#1e1e1e',
          },
          text: {
            primary: '#e0e0e0',
            secondary: '#9e9e9e',
          },
        }),
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none' as const, // Fix: ensure type matches TextTransform
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8,
          padding: '8px 16px',
          boxShadow: mode === 'light' ? '0 4px 6px rgba(0,0,0,0.08)' : '0 4px 6px rgba(0,0,0,0.25)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: mode === 'light' 
            ? '0 2px 10px rgba(0,0,0,0.05)' 
            : '0 2px 10px rgba(0,0,0,0.3)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

// Theme Provider Component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Try to get saved theme preference from localStorage, default to 'light'
  const storedTheme = localStorage.getItem('theme-mode') as ThemeMode | null;
  const [themeMode, setThemeMode] = useState<ThemeMode>(storedTheme || 'light');
  
  // Track if we're in dark mode for easier component access
  const darkMode = themeMode === 'dark';
  
  // Create theme based on dark mode preference
  const theme = useMemo(() => 
    createTheme(getDesignTokens(darkMode ? 'dark' : 'light')), 
    [darkMode]
  );

  // Save theme preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('theme-mode', themeMode);
  }, [themeMode]);

  // Toggle between light and dark mode
  const toggleColorMode = () => {
    setThemeMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };

  // Context value
  const contextValue = {
    themeMode,
    toggleColorMode,
    darkMode,
    theme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

// Export the theme for use in places where the context is not available
// export { theme };

export default ThemeProvider;
