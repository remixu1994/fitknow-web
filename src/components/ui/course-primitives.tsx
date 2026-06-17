import type { ReactNode } from 'react';

type TextProps = {
  text: string;
};

type PanelTitleProps = {
  title: string;
  subtitle?: string;
};

type StatProps = {
  value: string | number;
  label: string;
};

type FieldProps = {
  label: string;
  children: ReactNode;
};

export function PageLoading({ text }: TextProps) {
  return (
    <div className="page-loading flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="page-loading-spinner" aria-hidden="true" />
      <p>{text}</p>
    </div>
  );
}

export function PanelTitle({ title, subtitle }: PanelTitleProps) {
  return (
    <div className="panel-title">
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

export function Stat({ value, label }: StatProps) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export function Field({ label, children }: FieldProps) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

export function Empty({ text }: TextProps) {
  return <p className="empty">{text}</p>;
}
