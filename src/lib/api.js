import axios from "axios";

// Match the Appraisal frontend: same-origin /backend proxy and Axios client.
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/backend").replace(/\/+$/, "");
const API_KEY = import.meta.env.VITE_API_KEY || "";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: API_KEY ? { "x-api-key": API_KEY } : {},
});

export const saveOffer = async (formData) => {
  const response = await api.post("/api/save-offer", formData);
  return response.data;
};

export const sendOffer = async (formData) => {
  const response = await api.post("/api/send-offer", formData);
  return response.data;
};

// Appraisal-style route: /api/<resource>/search?q=<term>
export const searchOffers = async (query) => {
  const response = await api.get("/api/offers/search", {
    params: { q: query },
  });
  return response.data;
};

export const listOffers = async () => {
  const response = await api.get("/api/offers");
  return response.data;
};

export const getOffer = async (id) => {
  const response = await api.get(`/api/offers/${encodeURIComponent(id)}`);
  return response.data;
};

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

export { api };
