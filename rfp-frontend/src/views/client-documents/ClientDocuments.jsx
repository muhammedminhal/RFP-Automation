import { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ProfileMenu, WarningModal } from '../../components';
import useProfile from '../../hooks/useProfile';
import './client-documents.scss';

const ClientDocuments = () => {
  const { clientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  useProfile();

  const client = location.state?.client || {
    id: clientId,
    name: 'Unknown Client',
    documentsCount: 0,
  };

  // Modal state
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
  });

  // Mock documents data for the client
  const mockDocuments = [
    {
      id: 1,
      name: 'RFP_Response_Q1_2024.pdf',
      type: 'pdf',
      size: 2456789,
      uploadDate: '2024-09-28',
      category: 'Proposal',
    },
    {
      id: 2,
      name: 'Technical_Specifications.docx',
      type: 'doc',
      size: 1234567,
      uploadDate: '2024-09-27',
      category: 'Technical',
    },
    {
      id: 3,
      name: 'Budget_Breakdown.pdf',
      type: 'pdf',
      size: 987654,
      uploadDate: '2024-09-26',
      category: 'Financial',
    },
    {
      id: 4,
      name: 'Project_Timeline.docx',
      type: 'doc',
      size: 654321,
      uploadDate: '2024-09-25',
      category: 'Planning',
    },
    {
      id: 5,
      name: 'Compliance_Certificate.pdf',
      type: 'pdf',
      size: 3456789,
      uploadDate: '2024-09-24',
      category: 'Legal',
    },
    {
      id: 6,
      name: 'Team_Qualifications.pdf',
      type: 'pdf',
      size: 2345678,
      uploadDate: '2024-09-23',
      category: 'HR',
    },
    {
      id: 7,
      name: 'Security_Assessment.docx',
      type: 'doc',
      size: 1876543,
      uploadDate: '2024-09-22',
      category: 'Security',
    },
    {
      id: 8,
      name: 'Reference_Cases.pdf',
      type: 'pdf',
      size: 4567890,
      uploadDate: '2024-09-21',
      category: 'Reference',
    },
    {
      id: 9,
      name: 'Service_Agreement.docx',
      type: 'doc',
      size: 876543,
      uploadDate: '2024-09-20',
      category: 'Legal',
    },
    {
      id: 10,
      name: 'Implementation_Plan.pdf',
      type: 'pdf',
      size: 3210987,
      uploadDate: '2024-09-19',
      category: 'Planning',
    },
  ];

  const formatFileSize = bytes => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

  const handleDownload = document => {
    // In a real application, this would trigger an actual file download
    console.log(`Downloading ${document.name}`);
    showModal(
      'Download Started',
      `Downloading: ${document.name}\nSize: ${formatFileSize(document.size)}`,
      'success'
    );

    // TODO: Implement actual file download logic
    // Example:
    // const link = document.createElement('a');
    // link.href = document.url;
    // link.download = document.name;
    // link.click();
  };

  const getFileIcon = type => {
    if (type === 'pdf') {
      return (
        <svg
          width='24'
          height='24'
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
          <path
            d='M10 12h4M10 16h4'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      );
    } else {
      return (
        <svg
          width='24'
          height='24'
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
          <path
            d='M9 15h6M9 18h6M9 12h1'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      );
    }
  };

  return (
    <div className='client-documents-page'>
      <header className='page-header'>
        <div className='header-left'>
          <button
            className='back-btn'
            onClick={() => navigate('/rfp-documents')}
          >
            <svg
              width='20'
              height='20'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
            >
              <path
                d='M15 18l-6-6 6-6'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
            <span>Back to RFP Documents</span>
          </button>
          <div className='app-logo'>
            <svg
              width='32'
              height='32'
              viewBox='0 0 40 40'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <defs>
                <linearGradient
                  id='logoGrad'
                  x1='0%'
                  y1='0%'
                  x2='100%'
                  y2='100%'
                >
                  <stop
                    offset='0%'
                    style={{ stopColor: 'var(--accent-primary)' }}
                  />
                  <stop
                    offset='100%'
                    style={{ stopColor: 'var(--accent-secondary)' }}
                  />
                </linearGradient>
              </defs>
              <rect
                x='5'
                y='5'
                width='30'
                height='30'
                rx='6'
                fill='url(#logoGrad)'
              />
              <path
                d='M12 15 L18 20 L28 12'
                stroke='white'
                strokeWidth='3'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
            <span className='app-name'>RFP Automation</span>
          </div>
        </div>
        <ProfileMenu />
      </header>

      <main className='client-documents-content'>
        <div className='breadcrumb'>
          <button
            onClick={() => navigate('/rfp-documents')}
            className='breadcrumb-link'
          >
            <svg
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
            >
              <path
                d='M19 12H5M12 19l-7-7 7-7'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
            Back to RFP Documents
          </button>
        </div>

        <div className='client-header'>
          <div className='client-info'>
            <div className='client-icon-large'>
              <svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
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
            <div>
              <h1 className='client-title'>
                {client?.name || 'Client Documents'}
              </h1>
              <p className='client-subtitle'>
                {mockDocuments.length} documents available
              </p>
            </div>
          </div>
          <div className='client-stats-summary'>
            <div className='stat-item'>
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
                  d='M14 2v6h6'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
              <span>
                {mockDocuments.filter(d => d.type === 'pdf').length} PDFs
              </span>
            </div>
            <div className='stat-item'>
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
                  d='M14 2v6h6'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
              <span>
                {mockDocuments.filter(d => d.type === 'doc').length} DOCs
              </span>
            </div>
            <div className='stat-item'>
              <svg
                width='20'
                height='20'
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
              <span>Last updated: {client?.lastUpdated || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className='documents-section'>
          <div className='documents-grid'>
            {mockDocuments.map(doc => (
              <div key={doc.id} className='document-card'>
                <div className={`document-icon document-icon-${doc.type}`}>
                  {getFileIcon(doc.type)}
                </div>
                <div className='document-details'>
                  <h3 className='document-name' title={doc.name}>
                    {doc.name}
                  </h3>
                  <div className='document-meta'>
                    <span className='document-category'>{doc.category}</span>
                    <span className='document-separator'>•</span>
                    <span className='document-size'>
                      {formatFileSize(doc.size)}
                    </span>
                  </div>
                  <div className='document-date'>
                    <svg
                      width='14'
                      height='14'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                    >
                      <rect
                        x='3'
                        y='4'
                        width='18'
                        height='18'
                        rx='2'
                        ry='2'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                      <path
                        d='M16 2v4M8 2v4M3 10h18'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                    </svg>
                    <span>{formatDate(doc.uploadDate)}</span>
                  </div>
                </div>
                <button
                  className='download-btn'
                  onClick={() => handleDownload(doc)}
                  title='Download document'
                >
                  <svg
                    width='20'
                    height='20'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                  >
                    <path
                      d='M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                  <span>Download</span>
                </button>
              </div>
            ))}
          </div>
        </div>
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
};

export default ClientDocuments;
