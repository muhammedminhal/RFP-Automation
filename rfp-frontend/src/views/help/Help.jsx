import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../../services/authService';
import { Sidebar } from '../../components';
import './help.scss';

const Help = () => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('user@example.com');
  const navigate = useNavigate();
  const profileRef = useRef(null);

  const handleSignOut = async () => {
    await AuthService.logout();
    navigate('/login');
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  // Load user data
  useEffect(() => {
    const loadUserData = () => {
      const user = AuthService.getUser();
      if (user) {
        setUserName(user.name || 'User');
        setUserEmail(user.email || 'user@example.com');
      }
    };

    loadUserData();

    // Listen for auth data updates
    window.addEventListener('authDataUpdated', loadUserData);
    return () => {
      window.removeEventListener('authDataUpdated', loadUserData);
    };
  }, []);

  // Auto-close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target) &&
        showProfileMenu
      ) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  return (
    <div className='help-page'>
      <Sidebar />

      {/* Header */}
      <header className='help-header'>
        <div className='header-spacer'></div>
        <div className='profile-section' ref={profileRef}>
          <button className='profile-btn' onClick={toggleProfileMenu}>
            <div className='profile-avatar'>
              {userName && userName.charAt(0).toUpperCase()}
            </div>
          </button>

          {showProfileMenu && (
            <div className='profile-dropdown'>
              <div className='profile-info'>
                <div className='profile-name'>{userName}</div>
                <div className='profile-email'>{userEmail}</div>
              </div>
              <div className='profile-divider'></div>
              <button className='signout-btn' onClick={handleSignOut}>
                <svg
                  width='16'
                  height='16'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                >
                  <path
                    d='M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className='help-content'>
        <div className='construction-container'>
          <div className='construction-icon'>
            <svg
              width='120'
              height='120'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
            >
              <circle
                cx='12'
                cy='12'
                r='10'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <path
                d='M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <line
                x1='12'
                y1='17'
                x2='12.01'
                y2='17'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </div>
          <h1 className='construction-title'>Page Under Construction</h1>
          <p className='construction-subtitle'>
            We&apos;re building a comprehensive help center for you. Stay tuned!
          </p>
          <div className='construction-details'>
            <div className='detail-item'>
              <svg
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
              >
                <circle
                  cx='12'
                  cy='12'
                  r='10'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <path
                  d='M12 6v6l4 2'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
              <span>Coming Soon</span>
            </div>
            <div className='detail-item'>
              <svg
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
              >
                <path
                  d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
              <span>In Development</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Help;
