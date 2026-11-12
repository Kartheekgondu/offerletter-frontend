/*
 * Production calls the Render backend directly (CORS is enabled on the backend for the
 * Vercel origin), so it does not depend on Vercel rewrites. Local development uses Vite's
 * /backend proxy to localhost:9091. Override anything with VITE_API_BASE_URL.
 */
const RENDER_BACKEND = 'https://offerletter-backend-y0aa.onrender.com';
const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? RENDER_BACKEND : '/backend')
).replace(/\/+$/, '');
const API_KEY = import.meta.env.VITE_API_KEY || '';

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...(API_KEY ? { 'x-api-key': API_KEY } : {}), ...(options.headers || {}) },
    });
  } catch (error) {
    throw new Error(
      `Cannot reach the Offer Letter backend through ${API_BASE}. Check the Render URL in frontend/vercel.json and confirm the Render service is live. Browser: ${error?.message || 'Network request failed'}`
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
      ? 'The server or hosting proxy rejected the PDF because it is too large. Reduce PDF size and raise the backend/proxy upload limit.'
      : '';
    throw new Error(`${detail || 'Request failed'} (HTTP ${response.status}) at ${API_BASE}${path}${hint ? `. ${hint}` : ''}`);
  }
  return result;
}

export const sendOffer = (formData) => request('/api/send-offer', { method: 'POST', body: formData });
export const saveOffer = (formData) => request('/api/save-offer', { method: 'POST', body: formData });
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
