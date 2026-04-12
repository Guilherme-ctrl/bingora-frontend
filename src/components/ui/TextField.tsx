import type { InputHTMLAttributes } from 'react';

export type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export function TextField({
  label,
  error,
  hint,
  id,
  className = '',
  ...rest
}: TextFieldProps) {
  const inputId = id ?? rest.name;
  return (
    <div className={`field ${className}`.trim()}>
      <label className="field__label" htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        className={`field__input ${error ? 'field__input--error' : ''}`.trim()}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined
        }
        {...rest}
      />
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
