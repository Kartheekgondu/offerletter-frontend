/*
 * Offer Letter API client.
 * Uses same-origin /backend, matching the Appraisal project's proxy pattern.
 * Native fetch is used so no extra axios dependency is required.
 */
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/backend").replace(/\/+$/, "");
const API_KEY = import.meta.env.VITE_API_KEY || "";

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(API_KEY ? { "x-api-key": API_KEY } : {}),
        ...(options.headers || {}),
      },
    });
  } catch (error) {
    throw new Error(
      `Cannot reach backend via ${API_BASE}. Check the Render service and Vercel rewrite. ${error?.message || ""}`
    );
  }

  const contentType = response.headers.get("content-type") || "";
  let data = {};
  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const body = await response.text();
    data = body ? { message: body } : {};
  }

  if (!response.ok) {
    const detail = data?.message || data?.error || response.statusText || "Request failed";
    throw new Error(`${detail} (HTTP ${response.status})`);
  }
  return data;
}

export const saveOffer = (formData) =>
  request("/api/save-offer", { method: "POST", body: formData });

export const sendOffer = (formData) =>
  request("/api/send-offer", { method: "POST", body: formData });

// Search saved letters. Prefer the server-side search endpoint (same pattern as
// the Appraisal app). Older backend deployments may not yet expose that route;
// in that case fall back to the existing list endpoint and filter locally.
export const listOffers = () => request("/api/offers");

const normalizeRows = (data) =>
  Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);

const matchesOffer = (row, term) => {
  const needle = String(term || "").trim().toLocaleLowerCase();
  if (!needle) return true;
  const haystack = [
    row?.id,
    row?.candidateName, row?.candidate_name,
    row?.jobTitle, row?.job_title,
    row?.recipientEmail, row?.recipient_email,
    row?.department,
    row?.workLocation, row?.work_location,
    row?.status,
  ].filter((value) => value !== null && value !== undefined)
    .join(" ")
    .toLocaleLowerCase();
  return haystack.includes(needle);
};

export const searchOffers = async (query) => {
  const term = String(query || "").trim();
  if (!term) return listOffers();

  try {
    return await request(`/api/offers/search?q=${encodeURIComponent(term)}`);
  } catch (error) {
    // Compatibility with older Render deployments which only have GET /api/offers.
    if (!String(error?.message || error).includes("HTTP 404")) throw error;
    const data = await listOffers();
    return { success: true, results: normalizeRows(data).filter((row) => matchesOffer(row, term)) };
  }
};

export const getOffer = (id) => request(`/api/offers/${encodeURIComponent(id)}`);

export function appendOfferSendFields(formData, values, salary) {
  formData.append("letterDate", values.letterDate);
  formData.append("department", values.department);
  formData.append("workLocation", values.workLocation);
  formData.append("roleDescription", values.roleDesc);
  formData.append("annualCtc", String(values.annualCtc));
  formData.append("noticePeriodDays", String(values.noticePeriodDays));
  formData.append("includeBond", String(values.includeBond));
  formData.append("bondYears", String(values.bondYears));
  formData.append("bondAmount", String(values.bondAmount));
  formData.append("pfIncluded", String(salary.pfIncluded));
  formData.append("employeePf", String(salary.employeePf));
  formData.append("employerPf", String(salary.employerPf));
  formData.append("variablePayIncluded", String(salary.variableIncluded));
  formData.append("variablePayAmount", String(salary.variableAmount));
  formData.append("tdsIncluded", String(salary.tdsIncluded));
  formData.append("tdsAmount", String(salary.tdsAmount));
}
