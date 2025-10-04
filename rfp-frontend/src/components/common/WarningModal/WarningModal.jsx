import PropTypes from 'prop-types';
import './WarningModal.scss';

const WarningModal = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'warning',
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
          >
            <path
              d='M22 11.08V12a10 10 0 1 1-5.93-9.14'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
            <path
              d='M22 4L12 14.01l-3-3'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        );
      case 'error':
        return (
          <svg
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
          >
            <circle cx='12' cy='12' r='10' strokeWidth='2' />
            <path
              d='M15 9l-6 6M9 9l6 6'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        );
      default:
        return (
          <svg
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
          >
            <path
              d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
            <path
              d='M12 9v4M12 17h.01'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        );
    }
  };

  return (
    <div className='warning-modal-overlay' onClick={onClose}>
      <div className='warning-modal' onClick={e => e.stopPropagation()}>
        <div className='modal-header'>
          <div className={`modal-icon modal-icon-${type}`}>{getIcon()}</div>
          <h3 className='modal-title'>{title}</h3>
        </div>

        <div className='modal-content'>
          <p className='modal-message'>{message}</p>
        </div>

        <div className='modal-footer'>
          <button className='ok-btn' onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

WarningModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['warning', 'success', 'error', 'info']),
};

export default WarningModal;
