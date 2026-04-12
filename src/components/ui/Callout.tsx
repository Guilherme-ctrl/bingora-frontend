import type { ReactNode } from 'react';

type Tone = 'error' | 'info';

export function Callout({
  tone,
  title,
  children,
}: {
  tone: Tone;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className={`callout callout--${tone}`} role={tone === 'error' ? 'alert' : undefined}>
      {title ? <p className="callout__title">{title}</p> : null}
      <div className="callout__body">{children}</div>
    </div>
  );
}
