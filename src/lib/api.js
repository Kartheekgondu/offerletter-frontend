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

// Appraisal-style route: GET /api/offers/search?q=<term>
export const searchOffers = (query) =>
  request(`/api/offers/search?q=${encodeURIComponent(query)}`);

export const listOffers = () => request("/api/offers");

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
