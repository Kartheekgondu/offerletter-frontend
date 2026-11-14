/*
 * Use the same-origin /backend path in both production and local development.
 *
 * Vercel rewrites /backend/* to the Render backend.
 * Vite proxies /backend/* to localhost:9091 during local development.
 *
 * This avoids browser-to-Render cross-origin requests and therefore avoids
 * browser CORS preflight problems for the frontend.
 */
const API_BASE = '/backend';
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
    throw new Error(
      `Cannot reach the Offer Letter backend through ${API_BASE}. ` +
      `Check that the Render backend is running and the Vercel /backend rewrite is deployed. ` +
      `Browser: ${error?.message || 'Network request failed'}`
    );
  }

  const contentType = response.headers.get('content-type') || '';
  let result = {};
  if (contentType.includes('application/json')) {
    result = await response.json();
  } else {
    const body = await response.text();
    result = body ? { message: body } : {};
  }

  if (!response.ok) {
    const detail = result.error || result.message || response.statusText || 'Request failed';
    const hint = response.status === 413
      ? ' The PDF exceeds the server upload limit.'
      : '';
    throw new Error(`${detail} (HTTP ${response.status})${hint}`);
  }

  return result;
}

export const saveOffer = (formData) =>
  request('/api/save-offer', { method: 'POST', body: formData });

export const sendOffer = (formData) =>
  request('/api/send-offer', { method: 'POST', body: formData });

export const searchOffers = (query) =>
  request(`/api/search-offers?name=${encodeURIComponent(query)}`);

export const listOffers = () => request('/api/offers');

export const getOffer = (id) =>
  request(`/api/offers/${encodeURIComponent(id)}`);

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
