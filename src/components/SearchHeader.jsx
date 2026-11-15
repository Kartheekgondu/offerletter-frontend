import { useEffect, useRef, useState } from 'react';
import { COMPANY } from '../lib/company.js';
import { getOffer, listOffers, normalizeOfferRows, searchOffers } from '../lib/api.js';

export default function SearchHeader({ refreshKey = 0, onViewOffer }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(true);
  const searchRef = useRef(null);
  const requestSequence = useRef(0);

  useEffect(() => {
    const closeOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setShowResults(false);
    };
    document.addEventListener('mousedown', closeOutside);
    return () => document.removeEventListener('mousedown', closeOutside);
  }, []);

  async function loadHistory(term = '') {
    const sequence = ++requestSequence.current;
    setLoading(true);
    setMessage('');
    setShowResults(true);
    try {
      const data = term ? await searchOffers(term) : await listOffers();
      if (sequence !== requestSequence.current) return;
      const rows = normalizeOfferRows(data);
      setResults(rows);
      if (!rows.length) setMessage(term ? `No previous offer letters found for "${term}".` : 'No saved offer letters were returned by the database.');
    } catch (err) {
      if (sequence !== requestSequence.current) return;
      setResults([]);
      console.error('Could not fetch previous offer letters:', err);
      setMessage(`Could not connect to saved offer letters. ${err?.message || 'Check the Render API URL and database connection.'}`);
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }

  // Fetch existing database records as soon as the frontend opens.
  useEffect(() => {
    loadHistory('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh the history after the current letter has been saved.
  useEffect(() => {
    if (refreshKey > 0) loadHistory(query.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  async function handleSearch(event) {
    event?.preventDefault();
    await loadHistory(query.trim());
  }

  async function handleView(id) {
    setLoading(true);
    setMessage('');
    try {
      const data = await getOffer(id);
      const offer = data?.offer || data?.data || data;
      if (!offer || (!offer.id && !offer.candidateName && !offer.candidate_name)) {
        throw new Error('The selected offer letter was not returned by the server.');
      }
      onViewOffer?.(offer);
      setShowResults(false);
    } catch (err) {
      console.error('Could not open saved offer letter:', err);
      setMessage(`Could not open this offer letter: ${err.message}`);
      setShowResults(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <header className="page-header">
      <div className="page-header-top-row">
        <img className="page-header-logo" src={COMPANY.logoImage} alt="UX Interfacely" />
        <div className="history-search-block" ref={searchRef}>
          <p className="history-search-label">Find a Previously Generated Letter</p>
          <form className="history-search-row" onSubmit={handleSearch}>
            <input
              id="searchName" type="search"
              placeholder="Search name, email, job title, department or ID"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setShowResults(true)}
              aria-label="Search previous offer letters"
              autoComplete="off"
            />
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Loading...' : 'Search'}</button>
            <button type="button" onClick={() => { setQuery(''); loadHistory(''); }} disabled={loading}>All</button>
          </form>
          {showResults && (
            <div className="offer-history-dropdown" role="region" aria-label="Previous offer letters">
              <div className="offer-history-dropdown-heading">
                <strong>Previous Offer Letters</strong>
                <span>{results.length} record{results.length === 1 ? '' : 's'}</span>
              </div>
              {loading && <p className="offer-history-message">Loading saved offer letters...</p>}
              {!loading && message && <p className="offer-history-message">{message}</p>}
              {!loading && !message && results.map((row) => (
                <div className="offer-history-item" key={row.id}>
                  <button type="button" className="offer-history-select" onClick={() => handleView(row.id)} disabled={loading}>
                    <strong>{row.candidateName || row.candidate_name || 'Unknown employee'}</strong>
                    <span>{row.jobTitle || row.job_title || 'Job title not provided'}</span>
                    <small>
                      {[row.recipientEmail || row.recipient_email, row.department, (row.dateOfJoining || row.date_of_joining) ? `Joining: ${row.dateOfJoining || row.date_of_joining}` : '', row.status].filter(Boolean).join(' · ')}
                    </small>
                  </button>
                  {(row.pdfUrl || row.pdf_url) && <a className="offer-history-pdf" href={row.pdfUrl || row.pdf_url} target="_blank" rel="noopener noreferrer">PDF</a>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <h1 className="gradient-title">Offer Letter Generator</h1>
      <p className="page-subtitle">Generate, store and send employee offer letters</p>
    </header>
  );
}
