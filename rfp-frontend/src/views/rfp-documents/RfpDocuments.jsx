import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../../services/authService';
import UploadService from '../../services/uploadService';
import { Sidebar, WarningModal } from '../../components';
import './rfp-documents.scss';

const RfpDocuments = React.memo(() => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('user@example.com');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [clientName, setClientName] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [displayedClientsCount, setDisplayedClientsCount] = useState(8);
  const [isUploading, setIsUploading] = useState(false);
  const [, setUploadProgress] = useState(0);
  const navigate = useNavigate();
  const profileRef = useRef(null);

  // Modal state
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
  });
  const fileInputRef = useRef(null);
  const clientInputRef = useRef(null);

  // Mock client list - Replace with actual API call
  const clientList = [
    'Acme Corporation',
    'TechStart Inc.',
    'Global Solutions Ltd.',
    'Innovation Partners',
    'Digital Dynamics',
    'Future Systems',
    'Enterprise Holdings',
    'Smart Technologies',
    'Vision Enterprises',
    'Alpha Industries',
  ];

  // Mock recent clients data
  const recentClients = [
    {
      id: 1,
      name: 'Acme Corporation',
      documentsCount: 24,
      lastUpdated: '2 days ago',
    },
    {
      id: 2,
      name: 'TechStart Inc.',
      documentsCount: 15,
      lastUpdated: '5 days ago',
    },
    {
      id: 3,
      name: 'Global Solutions Ltd.',
      documentsCount: 32,
      lastUpdated: '1 week ago',
    },
    {
      id: 4,
      name: 'Innovation Partners',
      documentsCount: 8,
      lastUpdated: '3 days ago',
    },
    {
      id: 5,
      name: 'Digital Dynamics',
      documentsCount: 19,
      lastUpdated: '1 day ago',
    },
    {
      id: 6,
      name: 'Future Systems',
      documentsCount: 12,
      lastUpdated: '4 days ago',
    },
    {
      id: 7,
      name: 'Enterprise Holdings',
      documentsCount: 28,
      lastUpdated: '3 days ago',
    },
    {
      id: 8,
      name: 'Smart Technologies',
      documentsCount: 16,
      lastUpdated: '1 week ago',
    },
    {
      id: 9,
      name: 'Vision Enterprises',
      documentsCount: 22,
      lastUpdated: '2 days ago',
    },
    {
      id: 10,
      name: 'Alpha Industries',
      documentsCount: 11,
      lastUpdated: '6 days ago',
    },
    {
      id: 11,
      name: 'Beta Systems Inc.',
      documentsCount: 18,
      lastUpdated: '4 days ago',
    },
    {
      id: 12,
      name: 'Gamma Solutions',
      documentsCount: 25,
      lastUpdated: '1 day ago',
    },
    {
      id: 13,
      name: 'Delta Technologies',
      documentsCount: 14,
      lastUpdated: '5 days ago',
    },
    {
      id: 14,
      name: 'Epsilon Corp.',
      documentsCount: 30,
      lastUpdated: '2 weeks ago',
    },
    {
      id: 15,
      name: 'Omega Enterprises',
      documentsCount: 20,
      lastUpdated: '3 days ago',
    },
  ];

  const handleSignOut = async () => {
    await AuthService.logout();
    navigate('/login');
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleDrag = e => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = e => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = e => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = files => {
    const fileArray = Array.from(files);

    try {
      // Validate files using upload service
      UploadService.validateFiles(fileArray);

      // Check if adding these files would exceed the limit
      const remainingSlots = UploadService.getMaxFiles() - selectedFiles.length;
      if (remainingSlots <= 0) {
        showModal(
          'Document Limit',
          `Maximum ${UploadService.getMaxFiles()} documents allowed`,
          'warning'
        );
        return;
      }

      // Take only the files that fit within the limit
      const filesToAdd = fileArray.slice(0, remainingSlots);

      const newFiles = filesToAdd.map(file => ({
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        file: file,
      }));

      setSelectedFiles(prev => [...prev, ...newFiles]);

      // Warn if some files were not added
      if (fileArray.length > remainingSlots) {
        showModal(
          'Document Limit Reached',
          `Only ${remainingSlots} file(s) added. Maximum ${UploadService.getMaxFiles()} documents allowed.`,
          'warning'
        );
      }

      console.log('Files uploaded:', files);
    } catch (error) {
      console.error('File validation error:', error);
      showModal('Invalid Files', error.message, 'error');
    }
  };

  const removeFile = fileId => {
    setSelectedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
  };

  const handleSubmit = async () => {
    if (!clientName.trim()) {
      showModal(
        'Client Required',
        'Please select or enter a client name first',
        'warning'
      );
      clientInputRef.current?.focus();
      return;
    }

    if (selectedFiles.length === 0) {
      showModal(
        'No Files',
        'Please select at least one file to upload',
        'warning'
      );
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Extract actual File objects from selectedFiles
      const files = selectedFiles.map(fileObj => fileObj.file);

      // Upload files
      const result = await UploadService.uploadDocuments(files, clientName);

      // Show success message
      showModal(
        'Upload Successful',
        `Successfully uploaded ${result.documents.length} document(s) for ${clientName}`,
        'success'
      );

      // Clear form
      setSelectedFiles([]);
      setClientName('');

      console.log('Upload successful:', result);
    } catch (error) {
      console.error('Upload failed:', error);
      showModal(
        'Upload Failed',
        error.message || 'Failed to upload documents',
        'error'
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getFileType = fileName => {
    const extension = fileName.split('.').pop().toLowerCase();
    if (extension === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(extension)) return 'doc';
    return 'other';
  };

  const showModal = (title, message, type = 'warning') => {
    setModalState({
      isOpen: true,
      title,
      message,
      type,
    });
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const formatFileSize = bytes => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const onButtonClick = () => {
    if (!clientName.trim()) {
      showModal(
        'Client Required',
        'Please select or enter a client name first',
        'warning'
      );
      clientInputRef.current?.focus();
      return;
    }
    fileInputRef.current.click();
  };

  const handleClientChange = e => {
    setClientName(e.target.value);
    setShowSuggestions(true);
  };

  const selectClient = client => {
    setClientName(client);
    setShowSuggestions(false);
  };

  const filteredClients = clientList.filter(client =>
    client.toLowerCase().includes(clientName.toLowerCase())
  );

  const filteredRecentClients = recentClients.filter(client =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const displayedClients = filteredRecentClients.slice(
    0,
    displayedClientsCount
  );
  const hasMoreClients = filteredRecentClients.length > displayedClientsCount;

  const handleSeeMore = () => {
    setDisplayedClientsCount(prev => prev + 8);
  };

  const handleShowLess = () => {
    setDisplayedClientsCount(8);
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
    <div className='rfp-documents-page'>
      <Sidebar />

      {/* Header */}
      <header className='rfp-header'>
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
      <main className='rfp-content'>
        {/* Hero Section */}
        <section className='hero-section'>
          <h1 className='hero-title'>
            Automate Your RFPS. Simplify Upload Your Documents
          </h1>
        </section>

        {/* Client Selection Section */}
        <section className='client-selection-section'>
          <div className='client-input-container'>
            <label htmlFor='client-name' className='client-label'>
              Select or Enter Client Name <span className='required'>*</span>
            </label>
            <div className='autocomplete-wrapper'>
              <input
                ref={clientInputRef}
                id='client-name'
                type='text'
                className='client-input'
                placeholder='Start typing client name...'
                value={clientName}
                onChange={handleClientChange}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              {showSuggestions && clientName && filteredClients.length > 0 && (
                <div className='suggestions-dropdown'>
                  {filteredClients.map((client, index) => (
                    <div
                      key={index}
                      className='suggestion-item'
                      onClick={() => selectClient(client)}
                    >
                      {client}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Document Upload Section */}
        <section className='upload-section'>
          <div className='upload-container'>
            {/* Upload Box */}
            <div className='upload-box'>
              <h3>Document Upload</h3>
              <p className='upload-subtitle'>
                Supported file types: PDF and DOC
              </p>
              <form
                className={`upload-area ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={onButtonClick}
              >
                <input
                  ref={fileInputRef}
                  type='file'
                  multiple
                  onChange={handleChange}
                  style={{ display: 'none' }}
                  accept='.pdf,.doc,.docx'
                />
                <div className='upload-icon'>
                  <svg
                    width='40'
                    height='40'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                  >
                    <path
                      d='M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                </div>
                <div className='upload-text'>
                  <strong>Drag & drop files here</strong>
                  <span>or click to browse</span>
                </div>
              </form>
            </div>

            {/* Selected Files List - Only show if files are selected */}
            {selectedFiles.length > 0 && (
              <div className='selected-files-box'>
                <div className='selected-header'>
                  <h3>
                    Selected Documents ({selectedFiles.length}/
                    {UploadService.getMaxFiles()})
                  </h3>
                  <button
                    className='clear-all-btn'
                    onClick={clearAllFiles}
                    title='Clear all documents'
                  >
                    Clear All
                  </button>
                </div>
                <div className='files-list'>
                  {selectedFiles.map(file => (
                    <div key={file.id} className='file-item'>
                      <div
                        className={`file-icon file-icon-${getFileType(file.name)}`}
                      >
                        <svg
                          width='18'
                          height='18'
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
                      <div className='file-info'>
                        <div className='file-name' title={file.name}>
                          {file.name}
                        </div>
                        <div className='file-size'>
                          {formatFileSize(file.size)}
                        </div>
                      </div>
                      <button
                        className='remove-btn'
                        onClick={() => removeFile(file.id)}
                        title='Remove file'
                      >
                        <svg
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                        >
                          <path
                            d='M18 6L6 18M6 6l12 12'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  className='upload-btn'
                  disabled={
                    selectedFiles.length === 0 ||
                    !clientName.trim() ||
                    isUploading
                  }
                  onClick={handleSubmit}
                  title={
                    !clientName.trim()
                      ? 'Please select a client first'
                      : selectedFiles.length === 0
                        ? 'Please select files first'
                        : ''
                  }
                >
                  {isUploading ? (
                    <>
                      <svg
                        className='loading-spinner'
                        width='16'
                        height='16'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                      >
                        <path
                          d='M21 12a9 9 0 11-6.219-8.56'
                          strokeWidth='2'
                          strokeLinecap='round'
                        />
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    'Upload Documents'
                  )}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Recent Clients Section */}
        <section className='recent-clients-section'>
          <div className='section-header'>
            <h2 className='section-title'>Your Clients</h2>
            <div className='client-search-box'>
              <svg
                className='search-icon'
                width='16'
                height='16'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
              >
                <circle cx='11' cy='11' r='7' strokeWidth='2' />
                <path d='M16 16 L21 21' strokeWidth='2' strokeLinecap='round' />
              </svg>
              <input
                type='text'
                className='client-search-input'
                placeholder='Search clients...'
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
                onFocus={() => setShowSearchSuggestions(true)}
                onBlur={() =>
                  setTimeout(() => setShowSearchSuggestions(false), 200)
                }
              />
              {showSearchSuggestions &&
                clientSearch &&
                filteredRecentClients.length > 0 && (
                  <div className='search-suggestions-dropdown'>
                    {filteredRecentClients.map(client => (
                      <div
                        key={client.id}
                        className='search-suggestion-item'
                        onClick={() => {
                          setClientSearch(client.name);
                          setShowSearchSuggestions(false);
                        }}
                      >
                        <svg
                          width='14'
                          height='14'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                        >
                          <path
                            d='M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          />
                        </svg>
                        <span>{client.name}</span>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
          <div className='clients-grid'>
            {displayedClients.length > 0 ? (
              displayedClients.map(client => (
                <div key={client.id} className='client-card'>
                  <div className='client-card-header'>
                    <div className='client-icon'>
                      <svg
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                      >
                        <path
                          d='M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        />
                        <path
                          d='M9 22V12h6v10'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        />
                      </svg>
                    </div>
                  </div>
                  <h3 className='client-name'>{client.name}</h3>
                  <div className='client-stats'>
                    <div className='stat'>
                      <svg
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
                      <span>{client.documentsCount} documents</span>
                    </div>
                    <div className='stat'>
                      <svg
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                      >
                        <circle cx='12' cy='12' r='10' strokeWidth='2' />
                        <path
                          d='M12 6v6l4 2'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        />
                      </svg>
                      <span>{client.lastUpdated}</span>
                    </div>
                  </div>
                  <button
                    className='view-client-btn'
                    onClick={() =>
                      navigate(`/client-documents/${client.id}`, {
                        state: { client },
                      })
                    }
                  >
                    <span>View Documents</span>
                    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
                      <path
                        d='M5 12h14M12 5l7 7-7 7'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                    </svg>
                  </button>
                </div>
              ))
            ) : (
              <div className='no-results'>
                <svg
                  width='64'
                  height='64'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                >
                  <circle cx='11' cy='11' r='8' strokeWidth='2' />
                  <path
                    d='M21 21l-4.35-4.35'
                    strokeWidth='2'
                    strokeLinecap='round'
                  />
                </svg>
                <p>No clients found</p>
              </div>
            )}
          </div>

          {/* See More / Show Less Buttons */}
          {filteredRecentClients.length > 8 && (
            <div className='load-more-section'>
              {hasMoreClients ? (
                <button className='see-more-btn' onClick={handleSeeMore}>
                  <span>See More Clients</span>
                  <svg
                    width='16'
                    height='16'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                  >
                    <path
                      d='M19 9l-7 7-7-7'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                </button>
              ) : (
                <button className='see-more-btn' onClick={handleShowLess}>
                  <span>Show Less</span>
                  <svg
                    width='16'
                    height='16'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                  >
                    <path
                      d='M5 15l7-7 7 7'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
        </section>
      </main>

      <WarningModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
      />
    </div>
  );
});

RfpDocuments.displayName = 'RfpDocuments';

export default RfpDocuments;
