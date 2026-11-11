/* API base URL: set VITE_API_BASE to the public Render URL in Vercel.
   localhost is intentionally only the local-development fallback. */
const configuredApiBase = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_BASE_URL;
const API_BASE = (configuredApiBase || (import.meta.env.DEV ? 'http://localhost:9091' : '')).replace(/\/+$/, '');
const API_KEY = import.meta.env.VITE_API_KEY || '';

async function request(path, options = {}) {
  if (!API_BASE) {
    throw new Error('Backend URL is not configured. Set VITE_API_BASE to your public Render service URL in Vercel, then redeploy the frontend.');
  }
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...(API_KEY ? { 'x-api-key': API_KEY } : {}), ...(options.headers || {}) },
    });
  } catch (error) {
    throw new Error(
      `Cannot connect to ${API_BASE}. Confirm the Render service is running, VITE_API_BASE is correct, and APP_ALLOWED_ORIGINS includes this Vercel domain. Browser: ${error?.message || 'Network request failed'}`
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
    throw new Error(`${detail || 'Request failed'} (HTTP ${response.status})${hint ? `. ${hint}` : ''}`);
  }
  return result;
}

export const sendOffer = (formData) => request('/api/send-offer', { method: 'POST', body: formData });
export const saveOffer = (formData) => request('/api/save-offer', { method: 'POST', body: formData });
export const searchOffers = (query) => request(`/api/search-offers?q=${encodeURIComponent(query)}`);
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
