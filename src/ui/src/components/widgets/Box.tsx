import './Box.css';

export function Box({ children }: { children: any }) {
  return <div className="Box">{children}</div>;
}

export function SpanBox({ children, className = 'SpanBox' }: { children: any; className: string }) {
  return <span className={className}>{children}</span>;
}
