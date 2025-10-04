import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Get theme from localStorage or default to 'dark'
    const savedTheme = localStorage.getItem('rfp_theme');
    return savedTheme || 'dark';
  });

  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem('rfp_theme', theme);

    // Add theme class to document root
    document.documentElement.setAttribute('data-theme', theme);

    // Also add to body for easier styling
    document.body.className = `theme-${theme}`;
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => {
      if (prevTheme === 'dark') return 'light';
      return 'dark';
    });
  };

  const value = {
    theme,
    toggleTheme,
    setTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ThemeContext;
