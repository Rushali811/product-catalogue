import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../api/client';

interface Props {
  productId: number;
  productTitle: string;
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

interface FormState {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const initial: FormState = { name: '', email: '', phone: '', message: '' };

export function EnquiryForm({ productId, productTitle }: Props) {
  const [form, setForm] = useState<FormState>(initial);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage(null);
    try {
      await api.submitEnquiry({
        productId,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        message: form.message.trim(),
      });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        err instanceof ApiError
          ? err.message
          : 'Something went wrong. Please try again.',
      );
    }
  }

  if (status === 'success') {
    return (
      <div
        role="status"
        className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"
      >
        <h3 className="text-lg font-semibold">Thank you!</h3>
        <p className="mt-1 text-sm">
          Your enquiry about <span className="font-medium">{productTitle}</span> has been sent.
          We&apos;ll be in touch shortly.
        </p>
      </div>
    );
  }

  const disabled = status === 'submitting';

  return (
    <form onSubmit={onSubmit} aria-label="Enquiry form" className="space-y-3">
      <Field
        id="enquiry-name"
        label="Your name"
        value={form.name}
        onChange={(v) => setForm({ ...form, name: v })}
        required
        maxLength={120}
        disabled={disabled}
      />
      <Field
        id="enquiry-email"
        label="Email"
        type="email"
        value={form.email}
        onChange={(v) => setForm({ ...form, email: v })}
        required
        maxLength={254}
        disabled={disabled}
      />
      <Field
        id="enquiry-phone"
        label="Phone (optional)"
        value={form.phone}
        onChange={(v) => setForm({ ...form, phone: v })}
        maxLength={40}
        disabled={disabled}
      />
      <div>
        <label htmlFor="enquiry-message" className="mb-1 block text-sm font-medium text-slate-800">
          Message
        </label>
        <textarea
          id="enquiry-message"
          required
          minLength={1}
          maxLength={2000}
          rows={4}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          disabled={disabled}
          className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
        />
      </div>
      {status === 'error' && (
        <p role="alert" className="text-sm text-red-700">
          {errorMessage}
        </p>
      )}
      <button
        type="submit"
        disabled={disabled}
        className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
      >
        {disabled ? 'Sending...' : 'Send enquiry'}
      </button>
    </form>
  );
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  maxLength?: number;
  disabled?: boolean;
}

function Field({ id, label, value, onChange, type = 'text', required, maxLength, disabled }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-800">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        maxLength={maxLength}
        disabled={disabled}
        className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
      />
    </div>
  );
}
