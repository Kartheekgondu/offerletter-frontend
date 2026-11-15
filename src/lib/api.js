/*
 * Offer Letter API client. Uses the Vercel /backend rewrite, like the Appraisal app.
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
    const error = new Error(`${detail} (HTTP ${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export const saveOffer = (formData) =>
  request("/api/save-offer", { method: "POST", body: formData });

export const sendOffer = (formData) =>
  request("/api/send-offer", { method: "POST", body: formData });

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

// The primary route follows the Appraisal app's /search?q= convention.
// Older backend versions may expose only the list route; filter those results locally.
export const listOffers = async () => {
  const routes = ["/api/offers", "/api/offer-letters", "/api/offerletters"];
  let lastError;
  for (const route of routes) {
    try {
      return await request(route);
    } catch (error) {
      lastError = error;
      if (error.status !== 404) throw error;
    }
  }
  throw lastError || new Error("Previous offer letters endpoint is unavailable.");
};

export const searchOffers = async (query) => {
  const term = String(query || "").trim();
  if (!term) return listOffers();

  const routes = [
    `/api/offers/search?q=${encodeURIComponent(term)}`,
    `/api/offer-letters/search?q=${encodeURIComponent(term)}`,
    `/api/search-offers?name=${encodeURIComponent(term)}`,
  ];
  let lastError;
  for (const route of routes) {
    try {
      return await request(route);
    } catch (error) {
      lastError = error;
      if (error.status !== 404) throw error;
    }
  }

  // If an older backend has no search route, use its list endpoint and filter locally.
  const all = await listOffers();
  return { success: true, results: normalizeRows(all).filter((row) => matchesOffer(row, term)) };
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
