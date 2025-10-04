import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { ROUTES } from '../../../constants';
import ThemeToggle from '../ThemeToggle';
import './Sidebar.scss';

/**
 * Sidebar Navigation Component
 * @param {Object} props - Component props
 * @param {boolean} props.isCollapsed - Whether sidebar is collapsed
 */
const Sidebar = ({ isCollapsed = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useRef(null);

  const navigationItems = [
    {
      id: 'search',
      label: 'Search',
      path: ROUTES.SEARCH,
      icon: (
        <svg
          width='20'
          height='20'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
        >
          <circle cx='11' cy='11' r='7' strokeWidth='2' />
          <path d='M16 16 L21 21' strokeWidth='2' strokeLinecap='round' />
        </svg>
      ),
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: ROUTES.DASHBOARD,
      icon: (
        <svg
          width='20'
          height='20'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
        >
          <rect
            x='3'
            y='3'
            width='7'
            height='7'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
          <rect
            x='14'
            y='3'
            width='7'
            height='7'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
          <rect
            x='14'
            y='14'
            width='7'
            height='7'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
          <rect
            x='3'
            y='14'
            width='7'
            height='7'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      ),
    },
    {
      id: 'rfp-documents',
      label: 'RFP Documents',
      path: ROUTES.RFP_DOCUMENTS,
      icon: (
        <svg
          width='20'
          height='20'
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
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/settings',
      icon: (
        <svg
          width='20'
          height='20'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
        >
          <circle cx='12' cy='12' r='3' strokeWidth='2' />
          <path
            d='M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      ),
    },
    {
      id: 'help',
      label: 'Help',
      path: '/help',
      icon: (
        <svg
          width='20'
          height='20'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
        >
          <circle cx='12' cy='12' r='10' strokeWidth='2' />
          <path
            d='M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      ),
    },
  ];

  const handleNavigation = item => {
    navigate(item.path);
  };

  const isActive = path => {
    return location.pathname === path;
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Handle click outside to close sidebar
  useEffect(() => {
    const handleClickOutside = event => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        isOpen
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      {/* Toggle Button */}
      <button className='sidebar-toggle' onClick={toggleSidebar}>
        <svg
          width='24'
          height='24'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
        >
          <path
            d='M3 12h18M3 6h18M3 18h18'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className='sidebar-overlay sidebar-overlay--visible'
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <aside
        ref={sidebarRef}
        className={`sidebar ${isCollapsed ? 'sidebar--collapsed' : ''} ${isOpen ? 'sidebar--open' : ''}`}
      >
        {/* Navigation Menu */}
        <nav className='sidebar__nav'>
          <ul className='nav-list'>
            {navigationItems.map(item => (
              <li key={item.id} className='nav-item'>
                <button
                  className={`nav-link ${isActive(item.path) ? 'nav-link--active' : ''}`}
                  onClick={() => handleNavigation(item)}
                  title={isCollapsed ? item.label : ''}
                >
                  <span className='nav-icon'>{item.icon}</span>
                  {!isCollapsed && (
                    <span className='nav-label'>{item.label}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Theme Toggle */}
        <div className='sidebar__theme-toggle'>
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
};

Sidebar.propTypes = {
  isCollapsed: PropTypes.bool,
};

export default Sidebar;
