import { useEffect, useRef, useState } from 'react';
import { COMPANY } from '../lib/company.js';
import { getOffer, listOffers, searchOffers } from '../lib/api.js';

export default function SearchHeader({ refreshKey = 0, onViewOffer }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const closeOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setShowResults(false);
    };
    document.addEventListener('mousedown', closeOutside);
    return () => document.removeEventListener('mousedown', closeOutside);
  }, []);

  // Refresh silently after save; do not load/display all records until the user asks.
  useEffect(() => {
    if (refreshKey > 0) setMessage('Offer letter saved. Search to find it in previous records.');
  }, [refreshKey]);

  async function handleSearch(event, overrideQuery = query) {
    event?.preventDefault();
    const term = overrideQuery.trim();
    setLoading(true);
    setMessage('');
    setShowResults(true);
    try {
      const data = term ? await searchOffers(term) : await listOffers();
      const rows = Array.isArray(data?.results) ? data.results : [];
      setResults(rows);
      if (!rows.length) setMessage(term ? `No previous offer letters found for "${term}".` : 'No saved offer letters found.');
    } catch (err) {
      setResults([]);
      setMessage(`Search failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleView(id) {
    setLoading(true);
    setMessage('');
    try {
      const data = await getOffer(id);
      if (!data?.offer) throw new Error('The selected offer letter was not returned by the server.');
      onViewOffer?.(data.offer);
      setShowResults(false);
    } catch (err) {
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
              value={query} onChange={(event) => setQuery(event.target.value)}
              onFocus={() => { if (results.length) setShowResults(true); }}
              aria-label="Search previous offer letters" autoComplete="off"
            />
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Searching...' : 'Search'}</button>
            <button type="button" onClick={() => { setQuery(''); handleSearch(undefined, ''); }} disabled={loading}>All</button>
          </form>
          {showResults && (
            <div className="offer-history-dropdown" role="region" aria-label="Previous offer letters">
              <div className="offer-history-dropdown-heading">
                <strong>Previous Offer Letters</strong>
                <span>{results.length} record{results.length === 1 ? '' : 's'}</span>
              </div>
              {loading && <p className="offer-history-message">Searching saved letters...</p>}
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
