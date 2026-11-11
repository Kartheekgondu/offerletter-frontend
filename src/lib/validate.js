/* Form validation helpers */

const REQUIRED_IN_ORDER = [
  'empName', 'doj', 'letterDate', 'jobTitle', 'department', 'annualCtc', 'noticePeriod',
];

const ONLY_NUMBERS_OR_SYMBOLS_MESSAGE =
  'This field cannot contain only numbers or only special characters — please enter a valid value.';

function isOnlyNumbersOrOnlySpecialChars(value) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /^[0-9]+$/.test(trimmed) || /^[^A-Za-z0-9]+$/.test(trimmed);
}

/** Returns [fieldId, message] for the first problem, or null when valid. */
export function findFirstError(form) {
  for (const id of REQUIRED_IN_ORDER) {
    const value = String(form[id] ?? '').trim();
    if (!value) return [id, 'Please fill this field'];
    if ((id === 'jobTitle' || id === 'department') && isOnlyNumbersOrOnlySpecialChars(value)) {
      return [id, ONLY_NUMBERS_OR_ONLY_SPECIAL_CHARS_MESSAGE];
    }
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.doj) || Number.isNaN(Date.parse(`${form.doj}T00:00:00`))) {
    return ['doj', 'Enter a valid date of joining'];
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.letterDate) || Number.isNaN(Date.parse(`${form.letterDate}T00:00:00`))) {
    return ['letterDate', 'Enter a valid letter date'];
  }
  if (!(Number(form.annualCtc) > 0) || !Number.isSafeInteger(Number(form.annualCtc))) {
    return ['annualCtc', 'Enter a valid Annual CTC greater than 0'];
  }
  if (!(Number(form.noticePeriod) > 0)) return ['noticePeriod', 'Notice period must be greater than 0'];
  if (form.workLocation === '__custom' && !String(form.customLocation ?? '').trim()) {
    return ['customLocation', 'Please enter a custom work location'];
  }
  if (form.variablePay === 'yes' && !(Number(form.variablePayAmount) >= 0)) {
    return ['variablePayAmount', 'Enter a valid variable pay amount'];
  }
  if (form.tds === 'yes' && !(Number(form.tdsAmount) >= 0)) {
    return ['tdsAmount', 'Enter a valid TDS amount'];
  }
  if (form.includeBond) {
    if (!(Number(form.bondYears) > 0)) return ['bondYears', 'Bond duration must be greater than 0'];
    if (!(Number(form.bondAmount) > 0)) return ['bondAmount', 'Bond amount must be greater than 0'];
  }
  return null;
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '').trim());
}
