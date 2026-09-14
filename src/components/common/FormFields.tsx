import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cx } from '@/lib/utils';

function FieldWrap({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-[13px] font-bold text-neutral-600 dark:text-neutral-300">
        {label}
        {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-neutral-400">{hint}</span>}
    </label>
  );
}

const baseInputClass =
  'h-11 w-full rounded-2xl border border-neutral-200 bg-white px-3.5 text-[15px] font-medium text-neutral-800 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-neutral-50 disabled:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:ring-brand-900/30';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string };
export function TextField({ label, hint, required, className, ...rest }: TextFieldProps) {
  return (
    <FieldWrap label={label} hint={hint} required={required}>
      <input className={cx(baseInputClass, className)} required={required} {...rest} />
    </FieldWrap>
  );
}

type NumberFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
};
export function NumberField({ label, hint, required, value, onChange, suffix, className, ...rest }: NumberFieldProps) {
  return (
    <FieldWrap label={label} hint={hint} required={required}>
      <div className="relative">
        <input
          type="number"
          inputMode="numeric"
          className={cx(baseInputClass, suffix && 'pr-10', className)}
          value={Number.isNaN(value) ? '' : value}
          onFocus={(e) => e.target.select()}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          required={required}
          {...rest}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-400">
            {suffix}
          </span>
        )}
      </div>
    </FieldWrap>
  );
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: string };
export function SelectField({ label, hint, required, className, children, ...rest }: SelectFieldProps) {
  return (
    <FieldWrap label={label} hint={hint} required={required}>
      <select className={cx(baseInputClass, 'appearance-none', className)} required={required} {...rest}>
        {children}
      </select>
    </FieldWrap>
  );
}

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string };
export function TextAreaField({ label, hint, required, className, ...rest }: TextAreaFieldProps) {
  return (
    <FieldWrap label={label} hint={hint} required={required}>
      <textarea className={cx(baseInputClass, 'h-24 resize-none py-2.5')} required={required} {...rest} />
    </FieldWrap>
  );
}
