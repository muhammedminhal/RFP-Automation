import { useEffect } from 'react';

/**
 * Custom hook to detect clicks outside of a specified element
 * @param {React.RefObject} ref - Reference to the element
 * @param {Function} callback - Function to call when click outside is detected
 * @param {boolean} isActive - Whether the hook should be active
 */
const useClickOutside = (ref, callback, isActive = true) => {
  useEffect(() => {
    if (!isActive) return;

    const handleClickOutside = event => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, callback, isActive]);
};

export default useClickOutside;
