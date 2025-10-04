// React imports
import { useState, useEffect, useCallback } from 'react';

// Third-party imports
import { useNavigate } from 'react-router-dom';

// Internal imports - Services
import AuthService from '../../services/authService';

// Internal imports - Constants
import { ROUTES, ERROR_MESSAGES } from '../../constants';

// Styles
import './login.scss';

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check for auth data from OAuth redirect
    const authData = AuthService.handleAuthRedirect();
    if (authData) {
      // Redirect to search page on successful auth
      navigate(ROUTES.SEARCH);
    }

    // Check if user is already authenticated
    if (AuthService.isAuthenticated()) {
      navigate(ROUTES.SEARCH);
    }
  }, [navigate]);

  const handleGoogleLogin = useCallback(() => {
    setIsLoading(true);
    setError('');
    try {
      const authBase =
        process.env.REACT_APP_AUTH_BASE_URL || 'http://localhost:3001';
      window.location.href = `${authBase}/api/auth/google`;
    } catch (error) {
      console.error('Google login error:', error);
      setError(ERROR_MESSAGES.AUTH.LOGIN_FAILED);
      setIsLoading(false);
    }
  }, []);

  return (
    <div className='login-container'>
      {/* Background Network Pattern */}
      <div className='network-background'>
        <div className='network-line line-1'></div>
        <div className='network-line line-2'></div>
        <div className='network-line line-3'></div>
        <div className='network-line line-4'></div>
        <div className='network-line line-5'></div>
      </div>

      {/* Header */}
      <header className='app-header'>
        <div className='logo'>
          <svg
            width='40'
            height='40'
            viewBox='0 0 40 40'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <defs>
              <linearGradient id='logoGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
                <stop offset='0%' style={{ stopColor: '#E50914' }} />
                <stop offset='100%' style={{ stopColor: '#B20710' }} />
              </linearGradient>
            </defs>
            <rect
              x='5'
              y='5'
              width='30'
              height='30'
              rx='6'
              fill='url(#logoGrad)'
            />
            <path
              d='M12 15 L18 20 L28 12'
              stroke='white'
              strokeWidth='3'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        </div>
        <button
          className='signin-btn'
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </header>

      {/* Main Content */}
      <main className='main-content'>
        <div className='hero-section'>
          <div className='hero-text'>
            <h1 className='hero-title'>
              Transform Your RFF Process.
              <br />
              Faster. Smarter. Automated.
            </h1>
            <p className='hero-subtitle'>
              Leverage AI to streamline bid management, craft winning proposals,
              and accelerate growth.
            </p>
          </div>

          {/* Holographic Document Graphic */}
          <div className='holographic-graphic'>
            <div className='holo-card'>
              <div className='doc-icon'>
                <div className='doc-line'></div>
                <div className='doc-line short'></div>
                <div className='doc-line'></div>
                <div className='doc-line short'></div>
              </div>
              <div className='doc-icon small'>
                <div className='doc-line'></div>
                <div className='doc-line'></div>
              </div>
              <div className='progress-bar'>
                <div className='progress-fill'></div>
              </div>
            </div>
            <div className='data-particles'>
              <div className='particle'></div>
              <div className='particle'></div>
              <div className='particle'></div>
              <div className='particle'></div>
              <div className='particle'></div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className='error-toast' role='alert'>
            <span>{error}</span>
          </div>
        )}
      </main>
    </div>
  );
};

export default Login;
