import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AuthService from '../../services/authService';
import SearchService from '../../services/searchService';
import { Sidebar, ProfileMenu, WarningModal } from '../../components';
import { useProfile } from '../../hooks';
import './search.scss';

const Search = React.memo(() => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [searchType, setSearchType] = useState('hybrid');
  const [searchError, setSearchError] = useState('');
  const [topK, setTopK] = useState(10);
  const [alpha, setAlpha] = useState(0.6);
  const { userName } = useProfile();

  // Modal state
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
  });

  const handleSearch = useCallback(
    async e => {
      e.preventDefault();

      // Clear previous error
      setSearchError('');

      // Validate search query
      if (!searchQuery.trim()) {
        setSearchError('Please enter a search query');
        return;
      }

      // Validate query using SearchService
      const validation = SearchService.validateQuery(searchQuery);
      if (!validation.isValid) {
        setSearchError(validation.errors[0]);
        return;
      }

      setIsSearching(true);

      try {
        // Prepare search parameters
        const searchParams = {
          query: searchQuery.trim(),
          type: searchType.toLowerCase(),
          topK,
        };

        // Add alpha parameter for hybrid search
        if (searchType.toLowerCase() === 'hybrid' && alpha !== undefined) {
          searchParams.alpha = alpha;
        }

        // Call SearchService
        const result = await SearchService.search(searchParams);

        // Transform results for display
        const transformedResults = SearchService.transformSearchResults(
          result.results || []
        );

        // Add category inference to results
        const resultsWithCategories = transformedResults.map(result => ({
          ...result,
          category: SearchService.inferCategory(result.fullAnswer),
        }));

        setSearchResults(resultsWithCategories);

        console.log('Search completed:', {
          query: result.query,
          resultsCount: result.resultsCount,
          responseTime: result.responseTimeMs,
          searchType: result.searchType,
        });
      } catch (error) {
        console.error('Search error:', error);
        setSearchError(error.message || 'Search failed. Please try again.');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [searchQuery, searchType, topK, alpha]
  );

  const showModal = useCallback((title, message, type = 'warning') => {
    setModalState({
      isOpen: true,
      title,
      message,
      type,
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleCopyAnswer = useCallback(
    text => {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          showModal('Success', 'Text copied to clipboard!', 'success');
        })
        .catch(err => {
          console.error('Failed to copy:', err);
          showModal('Error', 'Failed to copy text to clipboard', 'error');
        });
    },
    [showModal]
  );

  const handleClearSearch = useCallback(() => {
    setSearchResults([]);
    setSearchQuery('');
  }, []);

  const handleViewFullAnswer = useCallback(result => {
    setSelectedResult(result);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedResult(null);
  }, []);

  const handleCopyFullAnswer = useCallback(() => {
    if (selectedResult?.fullAnswer) {
      navigator.clipboard
        .writeText(selectedResult.fullAnswer)
        .then(() => {
          showModal('Success', 'Full answer copied to clipboard!', 'success');
        })
        .catch(err => {
          console.error('Failed to copy:', err);
          showModal('Error', 'Failed to copy text to clipboard', 'error');
        });
    }
  }, [selectedResult, showModal]);

  const getRelevanceColor = useCallback(relevance => {
    if (relevance >= 90) return 'high';
    if (relevance >= 80) return 'medium';
    return 'low';
  }, []);

  // Memoize search types to prevent unnecessary re-renders
  const searchTypes = useMemo(() => SearchService.getSearchTypes(), []);

  // Clean up URL after OAuth redirect
  useEffect(() => {
    // Handle OAuth redirect if present
    AuthService.handleAuthRedirect();

    // Clean up URL after OAuth redirect
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('auth')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <div className='search-page'>
      {/* Sidebar */}
      <Sidebar />

      {/* Header */}
      <header className='search-header'>
        <div className='header-spacer'></div>
        <ProfileMenu />
      </header>

      {/* Main Content */}
      <main className='search-content'>
        {/* Welcome Message */}
        <div className='welcome-section'>
          <h1 className='welcome-title'>Welcome, {userName}!</h1>
          <p className='welcome-subtitle'>You can start asking questions now</p>
        </div>

        {/* Search Type Selection */}
        <div className='search-type-section'>
          <div className='search-type-options'>
            {searchTypes.map(type => (
              <button
                key={type.value}
                className={`search-type-btn ${searchType === type.value ? 'active' : ''}`}
                onClick={() => setSearchType(type.value)}
                type='button'
                title={type.description}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Search Filters */}
          <div className='search-filters'>
            <div className='filter-group'>
              <select
                id='topK'
                value={topK}
                onChange={e => setTopK(parseInt(e.target.value))}
                className='filter-select'
                disabled={isSearching}
              >
                <option value={5}>5 results</option>
                <option value={10}>10 results</option>
                <option value={20}>20 results</option>
                <option value={50}>50 results</option>
              </select>
            </div>

            {searchType === 'hybrid' && (
              <div className='filter-group'>
                <select
                  id='alpha'
                  value={alpha}
                  onChange={e => setAlpha(parseFloat(e.target.value))}
                  className='filter-select'
                  disabled={isSearching}
                >
                  <option value={0.2}>
                    Semantic Weight: More Keyword (0.2)
                  </option>
                  <option value={0.4}>Semantic Weight: Balanced (0.4)</option>
                  <option value={0.6}>Semantic Weight: Default (0.6)</option>
                  <option value={0.8}>
                    Semantic Weight: More Semantic (0.8)
                  </option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className='search-section'>
          <form onSubmit={handleSearch} className='search-form'>
            <div className='search-input-wrapper'>
              <svg
                className='search-icon'
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
              >
                <circle
                  cx='11'
                  cy='11'
                  r='7'
                  stroke='currentColor'
                  strokeWidth='2'
                />
                <path
                  d='M16 16 L21 21'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                />
              </svg>
              <input
                type='text'
                className='search-input'
                placeholder='Search for answers, guides, or topics...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                disabled={isSearching}
              />
              <button
                type='submit'
                className='search-btn'
                disabled={isSearching || !searchQuery.trim()}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {/* Search Error */}
          {searchError && (
            <div className='search-error'>
              <svg
                width='16'
                height='16'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
              >
                <circle cx='12' cy='12' r='10' />
                <line x1='15' y1='9' x2='9' y2='15' />
                <line x1='9' y1='9' x2='15' y2='15' />
              </svg>
              {searchError}
            </div>
          )}
        </div>

        {/* Loading State */}
        {isSearching && (
          <div className='loading-section'>
            <div className='loading-spinner'></div>
            <p>Searching through your documents...</p>
          </div>
        )}

        {/* Search Results */}
        {!isSearching && searchResults.length > 0 && (
          <div className='results-section'>
            <div className='results-header'>
              <h2>Found {searchResults.length} results</h2>
              <button className='clear-all-btn' onClick={handleClearSearch}>
                <svg
                  width='20'
                  height='20'
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
                Clear All
              </button>
            </div>

            <div className='results-grid'>
              {searchResults.map(result => (
                <div key={result.id} className='result-tile'>
                  <div className='tile-header'>
                    <div className='title-section'>
                      <h3 className='result-title'>{result.title}</h3>
                      <div
                        className={`relevance-badge relevance-${getRelevanceColor(result.relevance)}`}
                      >
                        {result.relevance}% match
                      </div>
                    </div>
                    <button
                      className='copy-tile-btn'
                      onClick={() => handleCopyAnswer(result.snippet)}
                      title='Copy snippet'
                    >
                      <svg
                        width='18'
                        height='18'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                      >
                        <rect
                          x='9'
                          y='9'
                          width='13'
                          height='13'
                          rx='2'
                          ry='2'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        />
                        <path
                          d='M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        />
                      </svg>
                    </button>
                  </div>

                  <p className='result-snippet'>{result.snippet}</p>

                  <div className='tile-footer'>
                    <div className='metadata'>
                      <div className='meta-item'>
                        <svg
                          width='14'
                          height='14'
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
                        <span className='source-name' title={result.source}>
                          {result.source}
                        </span>
                      </div>
                      <div className='meta-item'>
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
                          />
                          <path
                            d='M16 2v4M8 2v4M3 10h18'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          />
                        </svg>
                        <span>
                          {new Date(result.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                    <button
                      className='view-document-btn'
                      onClick={() => handleViewFullAnswer(result)}
                    >
                      <span>See Full Answer</span>
                      <svg
                        width='16'
                        height='16'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                      >
                        <path
                          d='M9 18l6-6-6-6'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full Answer Modal */}
        {selectedResult && (
          <div className='answer-modal-overlay' onClick={handleCloseModal}>
            <div className='answer-modal' onClick={e => e.stopPropagation()}>
              <div className='modal-header'>
                <div className='modal-title-section'>
                  <h2>{selectedResult.title}</h2>
                  <div
                    className={`relevance-badge relevance-${getRelevanceColor(selectedResult.relevance)}`}
                  >
                    {selectedResult.relevance}% match
                  </div>
                </div>
                <button
                  className='modal-close-btn'
                  onClick={handleCloseModal}
                  title='Close'
                >
                  <svg
                    width='24'
                    height='24'
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

              <div className='modal-metadata'>
                <div className='meta-item'>
                  <svg
                    width='14'
                    height='14'
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
                  <span className='source-name'>{selectedResult.source}</span>
                </div>
                <div className='meta-item'>
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
                    />
                    <path
                      d='M16 2v4M8 2v4M3 10h18'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                  <span>
                    {new Date(selectedResult.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              <div className='modal-content'>
                <h3>Full Answer</h3>
                <p>{selectedResult.fullAnswer}</p>
              </div>

              <div className='modal-footer'>
                <button
                  className='copy-full-answer-btn'
                  onClick={handleCopyFullAnswer}
                >
                  <svg
                    width='20'
                    height='20'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                  >
                    <rect
                      x='9'
                      y='9'
                      width='13'
                      height='13'
                      rx='2'
                      ry='2'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                    <path
                      d='M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                  <span>Copy Full Answer</span>
                </button>
                <button className='close-modal-btn' onClick={handleCloseModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
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

Search.displayName = 'Search';

export default Search;
