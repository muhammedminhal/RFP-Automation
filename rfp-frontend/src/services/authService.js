// import { jwtDecode } from 'jwt-decode'; // TODO: Use when implementing token validation
import { STORAGE_KEYS, ERROR_MESSAGES, ROUTES } from '../constants';

/**
 * Frontend Auth Service for JWT management
 * Handles authentication state, token management, and user data
 */
class AuthService {
  /**
   * Get stored auth token
   * @returns {string|null} JWT token or null if not found
   */
  static getToken() {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  /**
   * Get stored refresh token
   * @returns {string|null} Refresh token or null if not found
   */
  static getRefreshToken() {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Get stored user data
   * @returns {Object|null} User data object or null if not found
   */
  static getUser() {
    try {
      const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  /**
   * Store auth data after login
   * @param {Object} authResponse - Response from authentication
   * @param {string} authResponse.token - JWT token
   * @param {string} authResponse.refreshToken - Refresh token
   * @param {Object} authResponse.user - User data
   */
  static storeAuthData(authResponse) {
    try {
      if (authResponse.token) {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, authResponse.token);
      }

      if (authResponse.refreshToken) {
        localStorage.setItem(
          STORAGE_KEYS.REFRESH_TOKEN,
          authResponse.refreshToken
        );
      }

      if (authResponse.user) {
        localStorage.setItem(
          STORAGE_KEYS.USER_DATA,
          JSON.stringify(authResponse.user)
        );
      }

      console.log('Auth data stored successfully');

      // Dispatch custom event to notify components about auth data update
      window.dispatchEvent(new CustomEvent('authDataUpdated'));
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw new Error(ERROR_MESSAGES.AUTH.TOKEN_INVALID);
    }
  }

  /**
   * Clear all auth data (logout)
   */
  static clearAuthData() {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    console.log('Auth data cleared');
  }

  // Check if user is authenticated
  static isAuthenticated() {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  // Get authorization headers for API calls
  static getAuthHeaders() {
    const token = this.getToken();
    return token
      ? {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      : {
          'Content-Type': 'application/json',
        };
  }

  // Parse JWT token (client-side, for display purposes only)
  static parseJWT(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing JWT:', error);
      return null;
    }
  }

  // Check if token is expired (client-side check)
  static isTokenExpired(token = null) {
    const tokenToCheck = token || this.getToken();
    if (!tokenToCheck) return true;

    const payload = this.parseJWT(tokenToCheck);
    if (!payload || !payload.exp) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  }

  // Handle auth response from OAuth redirect
  static handleAuthRedirect() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userData = urlParams.get('user');

    if (token && userData) {
      try {
        const user = JSON.parse(decodeURIComponent(userData));
        const authResponse = {
          token: token,
          user: user,
        };

        this.storeAuthData(authResponse);

        // Clean up URL by removing token and user parameters
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);

        console.log('Auth data extracted and stored successfully');
        return authResponse;
      } catch (error) {
        console.error('Error parsing auth data from redirect:', error);
        return null;
      }
    }

    return null;
  }

  // Logout user
  static async logout() {
    try {
      // Optional: Call backend logout endpoint
      const response = await fetch('/auth/logout', {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        console.log('Server logout successful');
      }
    } catch (error) {
      console.error('Server logout failed:', error);
    } finally {
      // Always clear local auth data
      this.clearAuthData();
    }
  }

  // Get user display name
  static getUserDisplayName() {
    const user = this.getUser();
    return user ? user.name || user.email || 'User' : 'User';
  }

  // Get user initials for avatar
  static getUserInitials() {
    const user = this.getUser();
    if (!user || !user.name) return 'U';

    return user.name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  // Check if user should be redirected to login
  static shouldRedirectToLogin() {
    return !this.isAuthenticated() || this.isTokenExpired();
  }

  /**
   * Redirect to login if not authenticated
   * @returns {boolean} True if redirect was performed
   */
  static redirectToLoginIfNeeded() {
    if (this.shouldRedirectToLogin()) {
      window.location.href = ROUTES.LOGIN;
      return true;
    }
    return false;
  }
}

export default AuthService;
