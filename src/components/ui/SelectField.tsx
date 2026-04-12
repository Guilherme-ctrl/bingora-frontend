import type { SelectHTMLAttributes } from 'react';

export type SelectOption = { value: string; label: string };

export type SelectFieldProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'children'
> & {
  label: string;
  options: SelectOption[];
  error?: string;
  hint?: string;
};

export function SelectField({
  label,
  options,
  error,
  hint,
  id,
  className = '',
  ...rest
}: SelectFieldProps) {
  const inputId = id ?? rest.name;
  return (
    <div className={`field ${className}`.trim()}>
      <label className="field__label" htmlFor={inputId}>
        {label}
      </label>
      <select
        id={inputId}
        className={`field__input field__input--select ${error ? 'field__input--error' : ''}`.trim()}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined
        }
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && !error ? (
        <p id={`${inputId}-hint`} className="field__hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${inputId}-err`} className="field__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
