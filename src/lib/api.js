/*
 * API routing:
 * - Local Vite development: use /backend and let vite.config.js proxy to localhost:9091.
 * - Production (Vercel): call the Render backend directly, unless VITE_API_BASE_URL overrides it.
 */
const RENDER_BACKEND = 'https://offerletter-backend-ihy7.onrender.com';

function normalizeBaseUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

const API_BASE = import.meta.env.DEV
  ? '/backend'
  : normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL || RENDER_BACKEND);

const API_KEY = import.meta.env.VITE_API_KEY || '';

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
        ...(options.headers || {}),
      },
    });
  } catch (error) {
    const target = import.meta.env.DEV
      ? 'the local backend at http://localhost:9091'
      : `the backend at ${API_BASE}`;
    throw new Error(
      `Cannot reach ${target}. Confirm the backend is running, its URL is correct, and production CORS allows the Vercel frontend. Browser: ${error?.message || 'Network request failed'}`
    );
  }

  const contentType = response.headers.get('content-type') || '';
  let result;
  if (contentType.includes('application/json')) {
    result = await response.json();
  } else {
    const body = await response.text();
    result = body ? { message: body } : {};
  }

  if (!response.ok) {
    const detail = result.error || result.message || response.statusText;
    const hint = response.status === 413
      ? ' The server rejected the PDF because it is too large; check the backend upload limit.'
      : '';
    throw new Error(`${detail || 'Request failed'} (HTTP ${response.status}) at ${API_BASE}${path}${hint}`);
  }
  return result;
}

export const saveOffer = (formData) => request('/api/save-offer', { method: 'POST', body: formData });
export const sendOffer = (formData) => request('/api/send-offer', { method: 'POST', body: formData });
export const searchOffers = (query) => request(`/api/search-offers?name=${encodeURIComponent(query)}`);
export const listOffers = () => request('/api/offers');
export const getOffer = (id) => request(`/api/offers/${encodeURIComponent(id)}`);

export function appendOfferSendFields(formData, values, salary) {
  formData.append('letterDate', values.letterDate);
  formData.append('department', values.department);
  formData.append('workLocation', values.workLocation);
  formData.append('roleDescription', values.roleDesc);
  formData.append('annualCtc', String(values.annualCtc));
  formData.append('noticePeriodDays', String(values.noticePeriodDays));
  formData.append('includeBond', String(values.includeBond));
  formData.append('bondYears', String(values.bondYears));
  formData.append('bondAmount', String(values.bondAmount));
  formData.append('pfIncluded', String(salary.pfIncluded));
  formData.append('employeePf', String(salary.employeePf));
  formData.append('employerPf', String(salary.employerPf));
  formData.append('variablePayIncluded', String(salary.variableIncluded));
  formData.append('variablePayAmount', String(salary.variableAmount));
  formData.append('tdsIncluded', String(salary.tdsIncluded));
  formData.append('tdsAmount', String(salary.tdsAmount));
}
