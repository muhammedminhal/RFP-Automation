import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../../services/authService';
import { Sidebar } from '../../components';
import './settings.scss';

const Settings = () => {
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
    <div className='settings-page'>
      <Sidebar />

      {/* Header */}
      <header className='settings-header'>
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
      <main className='settings-content'>
        <div className='construction-container'>
          <div className='construction-icon'>
            <svg
              width='120'
              height='120'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
            >
              <path
                d='M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </div>
          <h1 className='construction-title'>Page Under Construction</h1>
          <p className='construction-subtitle'>
            We&apos;re working hard to bring you the Settings page. Check back
            soon!
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
                <circle
                  cx='12'
                  cy='12'
                  r='3'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <path
                  d='M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z'
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

export default Settings;
