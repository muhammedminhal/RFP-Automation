import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useProfile, useClickOutside } from '../../../hooks';
import AuthService from '../../../services/authService';
import './ProfileMenu.scss';

/**
 * Reusable Profile Menu Component
 * Displays user avatar with dropdown menu for profile info and sign out
 * @component
 */
const ProfileMenu = ({ className = '' }) => {
  const navigate = useNavigate();
  const profileRef = useRef(null);

  const {
    userName,
    userEmail,
    showProfileMenu,
    toggleProfileMenu,
    closeProfileMenu,
  } = useProfile();

  // Close menu when clicking outside
  useClickOutside(profileRef, closeProfileMenu, showProfileMenu);

  const handleSignOut = async () => {
    await AuthService.logout();
    navigate('/login');
  };

  const getInitials = name => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className={`profile-section ${className}`} ref={profileRef}>
      <button
        className='profile-btn'
        onClick={toggleProfileMenu}
        aria-haspopup='true'
        aria-expanded={showProfileMenu}
        aria-label='User profile menu'
      >
        <div className='profile-avatar'>{getInitials(userName)}</div>
      </button>

      {showProfileMenu && (
        <div className='profile-dropdown' role='menu'>
          <div className='profile-info'>
            <div className='profile-name'>{userName}</div>
            <div className='profile-email'>{userEmail}</div>
          </div>
          <div className='profile-divider'></div>
          <button
            className='signout-btn'
            onClick={handleSignOut}
            role='menuitem'
          >
            <svg
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              aria-hidden='true'
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
  );
};

ProfileMenu.propTypes = {
  className: PropTypes.string,
};

export default ProfileMenu;
