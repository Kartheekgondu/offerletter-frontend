/*
 * Previous-offer API client.
 * The Vercel same-origin /backend proxy targets the existing Render service
 * that owns the offer_sends database. Keep that database unchanged.
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
    throw new Error(`Cannot connect to the Offer Letter backend (${API_BASE}). ${error?.message || ""}`);
  }

  const type = response.headers.get("content-type") || "";
  const raw = type.includes("application/json") ? await response.json() : await response.text();
  const data = typeof raw === "string" ? { message: raw } : (raw || {});
  if (!response.ok) {
    const message = data.error || data.message || response.statusText || "Request failed";
    const error = new Error(message);
    error.status = response.status;
    error.responseBody = data;
    throw error;
  }
  return data;
}

export const saveOffer = (formData) => request("/api/save-offer", { method: "POST", body: formData });
export const sendOffer = (formData) => request("/api/send-offer", { method: "POST", body: formData });

export const normalizeOfferRows = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.offers)) return data.offers;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const matchesOffer = (row, query) => {
  const q = String(query || "").trim().toLocaleLowerCase();
  if (!q) return true;
  const text = [
    row?.id, row?.candidateName, row?.candidate_name,
    row?.jobTitle, row?.job_title, row?.recipientEmail, row?.recipient_email,
    row?.department, row?.workLocation, row?.work_location, row?.status,
  ].filter((v) => v !== null && v !== undefined).join(" ").toLocaleLowerCase();
  return text.includes(q);
};

async function tryRoutes(routes) {
  let lastError;
  for (const route of routes) {
    try { return await request(route); }
    catch (error) {
      lastError = error;
      // A 404 means this older deployment does not have that route; try its alias.
      if (error.status !== 404) throw error;
    }
  }
  throw lastError || new Error("Previous offer-letter API route is unavailable.");
}

// Fetch every saved record from the SAME offer_sends database.
export const listOffers = async () => tryRoutes([
  "/api/offers",
  "/api/offer-letters",
  "/api/offerletters",
  "/api/offer-sends",
]);

// Appraisal-style server search: GET /api/.../search?q=<term>.
// Older deployments without a search endpoint fall back to their list endpoint.
export const searchOffers = async (query) => {
  const term = String(query || "").trim();
  if (!term) return listOffers();
  try {
    return await tryRoutes([
      `/api/offers/search?q=${encodeURIComponent(term)}`,
      `/api/offer-letters/search?q=${encodeURIComponent(term)}`,
      `/api/offerletters/search?q=${encodeURIComponent(term)}`,
      `/api/search-offers?q=${encodeURIComponent(term)}`,
      `/api/search-offers?name=${encodeURIComponent(term)}`,
    ]);
  } catch (error) {
    if (error.status !== 404) throw error;
    const all = await listOffers();
    return { success: true, results: normalizeOfferRows(all).filter((row) => matchesOffer(row, term)) };
  }
};

export const getOffer = (id) => tryRoutes([
  `/api/offers/${encodeURIComponent(id)}`,
  `/api/offer-letters/${encodeURIComponent(id)}`,
  `/api/offerletters/${encodeURIComponent(id)}`,
]);

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
