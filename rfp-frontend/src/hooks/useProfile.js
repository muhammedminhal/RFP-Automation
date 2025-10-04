import { useState, useEffect, useCallback } from 'react';
import AuthService from '../services/authService';

/**
 * Custom hook to manage user profile data and menu state
 * @returns {Object} Profile data and methods
 */
const useProfile = () => {
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('user@example.com');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Function to load/refresh user data
  const loadUserData = useCallback(() => {
    const user = AuthService.getUser();
    if (user) {
      setUserName(user.name || 'User');
      setUserEmail(user.email || 'user@example.com');
    }
  }, []);

  // Load user data on mount
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Listen for auth data updates (e.g., after login)
  useEffect(() => {
    const handleAuthUpdate = () => {
      loadUserData();
    };

    window.addEventListener('authDataUpdated', handleAuthUpdate);
    return () => {
      window.removeEventListener('authDataUpdated', handleAuthUpdate);
    };
  }, [loadUserData]);

  // Toggle profile menu
  const toggleProfileMenu = useCallback(() => {
    setShowProfileMenu(prev => !prev);
  }, []);

  // Close profile menu
  const closeProfileMenu = useCallback(() => {
    setShowProfileMenu(false);
  }, []);

  return {
    userName,
    userEmail,
    showProfileMenu,
    toggleProfileMenu,
    closeProfileMenu,
    refreshUserData: loadUserData, // Expose refresh function
  };
};

export default useProfile;
