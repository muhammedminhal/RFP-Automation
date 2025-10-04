import './unauthorized.scss';

const Unauthorized = () => {
  const handleBackToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <div className='unauthorized-page'>
      <div className='unauthorized-container'>
        <div className='unauthorized-content'>
          {/* Icon */}
          <div className='unauthorized-icon'>
            <svg width='64' height='64' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L19 5V4.5C19 3.1 17.9 2 16.5 2S14 3.1 14 4.5V5C14 5.6 14.4 6 15 6S16 5.6 16 5V4.5C16 4.2 16.2 4 16.5 4S17 4.2 17 4.5V7L15 9H21M15 10V19C15 20.1 15.9 21 17 21S19 20.1 19 21V10H15Z' />
              <path d='M12 7C8.7 7 6 9.7 6 13V21H18V13C18 9.7 15.3 7 12 7Z' />
            </svg>
          </div>

          {/* Title */}
          <h1 className='unauthorized-title'>Access Denied</h1>

          {/* Message */}
          <p className='unauthorized-message'>
            Your email address is not authorized to access this application.
            Please contact your administrator to request access.
          </p>

          {/* Additional Info */}
          <div className='unauthorized-info'>
            <p>If you believe this is an error, please:</p>
            <ul>
              <li>Verify you&apos;re using the correct email address</li>
              <li>Contact your system administrator</li>
              <li>Try logging in with a different account</li>
            </ul>
          </div>

          {/* Actions */}
          <div className='unauthorized-actions'>
            <button className='btn-primary' onClick={handleBackToLogin}>
              Back to Login
            </button>

            <a
              href='mailto:admin@example.com?subject=Access Request&body=Hi, I need access to the RFP Automation system. My email address is: '
              className='btn-secondary'
            >
              Request Access
            </a>
          </div>

          {/* Footer */}
          <div className='unauthorized-footer'>
            <p>RFP Automation System</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
