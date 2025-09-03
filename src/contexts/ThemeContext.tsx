import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (replace with your Supabase URL and anon key)
const supabaseUrl = 'https://your-supabase-project-url.supabase.co';
const supabaseAnonKey = 'your-supabase-anon-key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Interface defining the theme context type
interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  supabase: typeof supabase; // Add Supabase client to context
}

// Create the context with an undefined default value
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Safely initialize isDarkMode from localStorage with fallback to system preference
  const getInitialDarkMode = (): boolean => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      try {
        const parsedTheme = JSON.parse(savedTheme);
        // Ensure parsed value is a boolean
        return typeof parsedTheme === 'boolean' ? parsedTheme : false;
      } catch (error) {
        console.warn('Invalid darkMode value in localStorage, resetting:', error);
        localStorage.removeItem('darkMode'); // Clear invalid data
        return false; // Default to false (light mode)
      }
    }
    // Fallback to system preference if no valid localStorage value
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const [isDarkMode, setIsDarkMode] = useState<boolean>(getInitialDarkMode);

  useEffect(() => {
    // Apply theme to document root
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Persist theme to localStorage
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Toggle dark mode function
  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, supabase }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};