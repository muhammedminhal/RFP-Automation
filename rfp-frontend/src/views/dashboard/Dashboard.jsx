import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../../services/authService';
import { Sidebar } from '../../components';
import './dashboard.scss';

const Dashboard = () => {
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
    <div className='dashboard-page'>
      <Sidebar />

      {/* Header */}
      <header className='dashboard-header'>
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
      <main className='dashboard-content'>
        {/* Hero Section */}
        <section className='hero-section'>
          <div className='hero-text'>
            <h1 className='hero-title'>RFP Process. Automated</h1>
            <p className='hero-subtitle'>
              Enanagement, craft craft oote growth.
            </p>
          </div>
          <div className='holographic-visual'>
            <div className='holo-device'>
              <div className='device-screen'>
                <div className='doc-element doc-1'>
                  <svg
                    width='32'
                    height='32'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                  >
                    <path
                      d='M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                    <path
                      d='M14 2v6h6M16 13H8M16 17H8M10 9H8'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                </div>
                <div className='doc-element doc-2'>
                  <svg
                    width='28'
                    height='28'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                  >
                    <path
                      d='M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                    <path
                      d='M14 2v6h6'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                </div>
                <div className='doc-element doc-3'>
                  <svg
                    width='24'
                    height='24'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                  >
                    <rect
                      x='3'
                      y='3'
                      width='18'
                      height='18'
                      rx='2'
                      ry='2'
                      strokeWidth='2'
                    />
                    <line
                      x1='9'
                      y1='9'
                      x2='15'
                      y2='9'
                      strokeWidth='2'
                      strokeLinecap='round'
                    />
                    <line
                      x1='9'
                      y1='15'
                      x2='15'
                      y2='15'
                      strokeWidth='2'
                      strokeLinecap='round'
                    />
                  </svg>
                </div>
                <div className='progress-indicator'>
                  <div className='progress-bar'>
                    <div className='progress-fill'></div>
                  </div>
                </div>
              </div>
              <div className='device-glow'></div>
            </div>
            <div className='data-particles'>
              <div className='particle particle-1'></div>
              <div className='particle particle-2'></div>
              <div className='particle particle-3'></div>
              <div className='particle particle-4'></div>
              <div className='particle particle-5'></div>
            </div>
            <div className='grid-overlay'></div>
          </div>
        </section>

        {/* Stats Section */}
        <section className='stats-section'>
          <div className='stat-card'>
            <div className='stat-icon'>
              <svg
                width='40'
                height='40'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
              >
                <path
                  d='M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <path
                  d='M14 2v6h6M16 13H8M16 17H8M10 9H8'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </div>
            <div className='stat-value'>1,234</div>
            <div className='stat-label'>Total RFP Documents</div>
          </div>

          <div className='stat-card'>
            <div className='stat-icon'>
              <svg
                width='40'
                height='40'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
              >
                <path
                  d='M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <circle
                  cx='12'
                  cy='7'
                  r='4'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </div>
            <div className='stat-value'>567</div>
            <div className='stat-label'>Total Clients</div>
          </div>
        </section>

        {/* Features Section */}
        <section className='features-section'>
          <div className='feature-card'>
            <div className='feature-icon'>
              <svg
                width='48'
                height='48'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
              >
                <ellipse
                  cx='12'
                  cy='5'
                  rx='9'
                  ry='3'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <path
                  d='M21 12c0 1.66-4 3-9 3s-9-1.34-9-3'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <path
                  d='M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </div>
            <h3 className='feature-title'>Centrizal Data Reporistary</h3>
          </div>

          <div className='feature-card'>
            <div className='feature-icon'>
              <svg
                width='48'
                height='48'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
              >
                <path
                  d='M17 18a5 5 0 00-10 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <path
                  d='M9 12h6'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <path
                  d='M12 9v6'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </div>
            <h3 className='feature-title'>Collaboratioe Workflows</h3>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
