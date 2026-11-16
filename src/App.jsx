import { useEffect, useMemo, useRef, useState } from 'react';
import SearchHeader from './components/SearchHeader.jsx';
import OfferForm from './components/OfferForm.jsx';
import Letter from './components/Letter.jsx';
import { calculateSalaryBreakdown } from './lib/salary.js';
import { addDaysISO, formatDateMonthFirst, toLocalISO } from './lib/format.js';
import { findFirstError, isValidEmail } from './lib/validate.js';
import { appendOfferSendFields, saveOffer, sendOffer } from './lib/api.js';
import { buildLetterPdfBlob, downloadLetterPdf } from './lib/pdf.js';
import { normalizeSingleSpaces, removeEmailWhitespace, titleCaseWords, limitWords } from './lib/inputText.js';

const todayISO = toLocalISO(new Date());

const initialForm = () => ({
  empName: '',
  doj: addDaysISO(todayISO, 1),
  letterDate: todayISO,
  jobTitle: '',
  department: '',
  roleDesc: '',
  workLocation: 'Hyderabad Corporate Office - WFH',
  customLocation: '',
  annualCtc: '',
  noticePeriod: '90',
  variablePay: 'no',
  variablePayAmount: '',
  pf: 'yes',
  tds: 'no',
  tdsAmount: '',
  includeBond: false,
  bondYears: '1',
  bondAmount: '',
});

/* Input restrictions, applied as the user types */
const digitsOnly = (v) => v.replace(/[^0-9]/g, '');
// Free-text fields accept letters, numbers and ordinary spaces only.
const lettersNumbersSpacesOnly = (v) => v.replace(/[^A-Za-z0-9 ]/g, '');
const TITLE_CASE_FIELDS = new Set(['empName', 'jobTitle', 'department', 'roleDesc', 'customLocation']);
const WORD_LIMITS = { empName: 50, jobTitle: 50, department: 50, customLocation: 50, roleDesc: 300 };

const SANITIZERS = {
  // "john doe" -> "John Doe"
  empName: lettersNumbersSpacesOnly,
  jobTitle: lettersNumbersSpacesOnly,
  department: lettersNumbersSpacesOnly,
  roleDesc: lettersNumbersSpacesOnly,
  customLocation: lettersNumbersSpacesOnly,
  annualCtc: digitsOnly,
  noticePeriod: digitsOnly,
  variablePayAmount: digitsOnly,
  tdsAmount: digitsOnly,
  bondYears: digitsOnly,
  bondAmount: digitsOnly,
};

function toSalaryInput(form) {
  return {
    annualCtc: Number(form.annualCtc) || 0,
    doj: form.doj,
    pfIncluded: form.pf === 'yes',
    variableIncluded: form.variablePay === 'yes',
    variableAmount: Number(form.variablePayAmount) || 0,
    tdsIncluded: form.tds === 'yes',
    tdsAmount: Number(form.tdsAmount) || 0,
  };
}

function toLetterValues(form) {
  const parsedNotice = Number.parseInt(form.noticePeriod, 10);
  return {
    name: form.empName.trim(),
    doj: form.doj,
    letterDate: form.letterDate,
    jobTitle: form.jobTitle.trim(),
    department: form.department.trim(),
    workLocation: form.workLocation === '__custom' ? form.customLocation.trim() : form.workLocation,
    roleDesc: form.roleDesc.trim(),
    annualCtc: Number(form.annualCtc) || 0,
    noticePeriodDays: Number.isNaN(parsedNotice) ? 90 : parsedNotice,
    includeBond: form.includeBond,
    bondYears: Number.parseInt(form.bondYears, 10) || 1,
    bondAmount: Number.parseFloat(form.bondAmount) || 0,
  };
}

export default function App() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [letter, setLetter] = useState(null); // { values, salary } snapshot taken on Generate
  const [generation, setGeneration] = useState(0);
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState({ pdf: false, email: false });
  const [historyVersion, setHistoryVersion] = useState(0);

  const letterRef = useRef(null);
  const savedGeneration = useRef(0);

  // Live figures for the read-only PF fields
  const previewSalary = useMemo(() => calculateSalaryBreakdown(toSalaryInput(form)), [form]);

  const getPageEls = () => Array.from(letterRef.current?.querySelectorAll('.page') ?? []);

  function setField(name, raw) {
    let normalized = typeof raw === 'string' ? normalizeSingleSpaces(raw) : raw;
    const sanitized = SANITIZERS[name] ? SANITIZERS[name](normalized) : normalized;
    const titleCased = typeof sanitized === 'string' && TITLE_CASE_FIELDS.has(name)
      ? titleCaseWords(sanitized)
      : sanitized;
    const value = typeof titleCased === 'string' && WORD_LIMITS[name]
      ? limitWords(titleCased, WORD_LIMITS[name])
      : titleCased;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => (current[name] ? { ...current, [name]: '' } : current));
  }

  function handleGenerate() {
    const problem = findFirstError(form);
    if (problem) {
      const [fieldId, message] = problem;
      setErrors({ [fieldId]: message });
      document.getElementById(fieldId)?.focus();
      return;
    }
    setErrors({});
    setLetter({ values: toLetterValues(form), salary: calculateSalaryBreakdown(toSalaryInput(form)) });
    setEditing(false);
    setStatus('Generated ✓ — saving...');
    setGeneration((g) => g + 1);
  }

  // Auto-save right after each Generate, once the letter pages are in the DOM.
  useEffect(() => {
    if (generation === 0 || savedGeneration.current === generation || !letter) return;
    savedGeneration.current = generation;

    (async () => {
      try {
        const { values, salary } = letter;
        const pdfBlob = await buildLetterPdfBlob(getPageEls());
        const formData = new FormData();
        formData.append('candidateName', values.name || 'Candidate');
        formData.append('jobTitle', values.jobTitle || 'the offered role');
        if (email.trim()) formData.append('recipientEmail', email.trim());
        if (values.doj) formData.append('doj', values.doj);
        appendOfferSendFields(formData, values, salary);
        formData.append('pdf', pdfBlob, `${(values.name || 'Candidate').replace(/[^A-Za-z0-9_-]+/g, '_')}_Offer_Letter.pdf`);
        const result = await saveOffer(formData);
        // The server answers 200 with a `warning` when the PDF uploaded but the
        // offer_sends row could not be written (e.g. a missing column).
        setStatus(result.warning ? `Generated ✓ — ${result.warning}` : `Generated ✓ — saved successfully (Record #${result.id})`);
        setHistoryVersion((version) => version + 1);
      } catch (err) {
        console.error('Auto-save failed:', err);
        setStatus(`Generated ✓ — save failed: ${err?.message || 'Unknown error'}. Your PDF is still available with Download as PDF; retry Generate after checking the backend upload limit.`);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generation]);

  async function handlePrint() {
    if (!letter) return alert('Generate the offer letter first.');
    setBusy((b) => ({ ...b, pdf: true }));
    try {
      const fileName = `${(letter.values.name || 'Offer_Letter').replace(/[^A-Za-z0-9_-]+/g, '_')}_Offer_Letter.pdf`;
      await downloadLetterPdf(getPageEls(), fileName);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert(`Something went wrong generating the PDF.\n\nDetails: ${err?.message ?? err}`);
    } finally {
      setBusy((b) => ({ ...b, pdf: false }));
    }
  }

  async function handleEmail() {
    if (!letter) return alert('Generate the offer letter first.');

    const recipient = email.trim();
    if (!isValidEmail(recipient)) {
      alert('Enter a valid recipient email address.');
      document.getElementById('emailInput')?.focus();
      return;
    }

    const { values } = letter;
    setBusy((b) => ({ ...b, email: true }));
    setStatus('Preparing offer letter email...');

    try {
      const pdfBlob = await buildLetterPdfBlob(getPageEls());
      const formData = new FormData();
      formData.append('recipient', recipient);
      formData.append('candidateName', values.name || 'Candidate');
      formData.append('jobTitle', values.jobTitle || 'the offered role');
      formData.append('dojDisplay', formatDateMonthFirst(values.doj));
      formData.append('workLocation', values.workLocation || '');
      formData.append(
        'pdf',
        pdfBlob,
        `${(values.name || 'Candidate').replace(/[^A-Za-z0-9_-]+/g, '_')}_Offer_Letter.pdf`
      );

      const result = await sendOffer(formData);
      setStatus(result.message || `Offer letter email sent successfully to ${recipient}.`);
      alert(`Offer letter email sent successfully to ${recipient}.`);
    } catch (err) {
      console.error('Email send failed:', err);
      const statusCode = err?.status;
      const serverMessage = err?.responseBody?.error || err?.responseBody?.message;
      const technicalMessage = serverMessage || err?.message || 'Unknown email delivery error.';
      // Show the actual backend diagnostic in the page instead of hiding it
      // behind a generic message. Do not show credentials or request headers.
      setStatus(
        `Email was not sent${statusCode ? ` (HTTP ${statusCode})` : ''}: ${technicalMessage}`
      );
      console.error('Email delivery diagnostic:', {
        status: statusCode,
        message: technicalMessage,
        response: err?.responseBody
      });
    } finally {
      setBusy((b) => ({ ...b, email: false }));
    }
  }

  return (
    <>
      <SearchHeader
        refreshKey={historyVersion}
        onViewOffer={(saved) => {
          const standardLocations = ['Hyderabad Corporate Office - WFH', 'Hyderabad Corporate Office'];
          const isStandardLocation = standardLocations.includes(saved.workLocation);
          const nextForm = {
            ...initialForm(),
            empName: titleCaseWords(saved.candidateName || ''),
            doj: saved.dateOfJoining || '',
            letterDate: saved.letterDate || '',
            jobTitle: titleCaseWords(saved.jobTitle || ''),
            department: titleCaseWords(saved.department || ''),
            roleDesc: titleCaseWords(saved.roleDescription || ''),
            workLocation: isStandardLocation ? saved.workLocation : '__custom',
            customLocation: isStandardLocation ? '' : titleCaseWords(saved.workLocation || ''),
            annualCtc: String(saved.annualCtc ?? ''),
            noticePeriod: String(saved.noticePeriodDays ?? 90),
            variablePay: saved.variablePayIncluded ? 'yes' : 'no',
            variablePayAmount: String(saved.variablePayAmount ?? ''),
            pf: saved.pfIncluded ? 'yes' : 'no',
            tds: saved.tdsIncluded ? 'yes' : 'no',
            tdsAmount: String(saved.tdsAmount ?? ''),
            includeBond: Boolean(saved.includeBond),
            bondYears: String(saved.bondYears ?? 1),
            bondAmount: String(saved.bondAmount ?? ''),
          };
          setForm(nextForm);
          setLetter({
            values: toLetterValues(nextForm),
            salary: calculateSalaryBreakdown(toSalaryInput(nextForm)),
          });
          setEditing(false);
          setStatus(`Loaded saved offer letter #${saved.id}`);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <OfferForm form={form} errors={errors} onChange={setField} pf={previewSalary}>
        <div className="button-row">
          <button type="button" className="btn-primary btn-wide" onClick={handleGenerate}>
            Generate Offer Letter
          </button>
        </div>

        <div className="secondary-buttons">
          <button type="button" onClick={handlePrint} disabled={busy.pdf}>
            {busy.pdf ? 'Preparing PDF...' : 'Download as PDF'}
          </button>

        </div>

        <div className="email-row">
          <input
            id="emailInput"
            type="email"
            placeholder="Recipient's email address"
            value={email}
            onChange={(e) => setEmail(removeEmailWhitespace(e.target.value))}
            onBlur={(e) => setEmail(removeEmailWhitespace(e.target.value).trim())}
          />
          <button id="emailBtn" type="button" className="icon-btn" onClick={handleEmail} disabled={!letter || busy.email}>
            {busy.email ? 'Sending Email...' : '✉ Send Mail'}
          </button>
        </div>
        <p className="email-help">The offer-letter PDF will be attached automatically and sent to the recipient email address.</p>
      </OfferForm>

      <p id="previewStatus">{status}</p>
      {!letter && (
        <p id="letterEmpty">No letter generated yet. Fill in the form and click "Generate Offer Letter".</p>
      )}
      <p id="editHint" className={editing ? 'show' : ''}>
        Editing on — click directly into the letter text to make changes, then click "Done Editing" to lock them in.
      </p>

      <div id="letterOutput" ref={letterRef} className={`${letter ? 'show' : ''}${editing ? ' editing' : ''}`}>
        {letter && <Letter values={letter.values} salary={letter.salary} editing={editing} />}
      </div>
    </>
  );
}
