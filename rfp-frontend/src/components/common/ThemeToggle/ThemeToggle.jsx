import { useTheme } from '../../../context';
import './ThemeToggle.scss';

const ThemeToggle = () => {
  const { theme, toggleTheme, isDark } = useTheme();

  const getNextThemeName = () => {
    if (isDark) return 'light';
    return 'dark';
  };

  const getThemeIcon = () => {
    if (isDark) {
      return (
        <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
          <path d='M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z' />
        </svg>
      );
    } else {
      return (
        <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
          <circle cx='12' cy='12' r='5' />
          <path d='M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42' />
        </svg>
      );
    }
  };

  return (
    <div className='theme-toggle-container'>
      <button
        className='theme-toggle'
        onClick={toggleTheme}
        aria-label={`Switch to ${getNextThemeName()} theme`}
        title={`Switch to ${getNextThemeName()} theme`}
      >
        <div className={`toggle-track ${theme}`}>
          <div className='toggle-thumb'>{getThemeIcon()}</div>
        </div>
      </button>
    </div>
  );
};

export default ThemeToggle;
