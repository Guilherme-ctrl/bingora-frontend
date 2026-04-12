import type { TextareaHTMLAttributes } from 'react';

export type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export function TextAreaField({
  label,
  error,
  hint,
  id,
  className = '',
  rows = 3,
  ...rest
}: TextAreaFieldProps) {
  const inputId = id ?? rest.name;
  return (
    <div className={`field ${className}`.trim()}>
      <label className="field__label" htmlFor={inputId}>
        {label}
      </label>
      <textarea
        id={inputId}
        rows={rows}
        className={`field__input field__input--textarea ${error ? 'field__input--error' : ''}`.trim()}
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
