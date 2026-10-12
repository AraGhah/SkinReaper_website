export function Arrow({ dir = 'right', className = '' }) {
  const rot = { right: 0, left: 180, up: -90, down: 90, upRight: -45 }[dir];
  return (
    <svg className={`icon ${className}`} viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d="M2 8h11M9 4l4 4-4 4" transform={`rotate(${rot} 8 8)`} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}

export function Cross({ className = '' }) {
  return (
    <svg className={`icon ${className}`} viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path d="M3 3l10 10M13 3L3 13" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function Spinner() {
  return (
    <svg className="spinner" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".2" strokeWidth="2" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function Sigil({ className = '' }) {
  return (
    <svg className={`sigil ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0l2.2 9.8L24 12l-9.8 2.2L12 24l-2.2-9.8L0 12l9.8-2.2z" fill="currentColor" />
    </svg>
  );
}

export function Btn({
  href, onClick, children, variant = 'solid', size, block, external, arrow,
  type = 'button', disabled, className = '', ...rest
}) {
  const cls = ['btn', `btn--${variant}`, size && `btn--${size}`, block && 'btn--block', className].filter(Boolean).join(' ');
  const inner = (
    <>
      <span className="btn-roll">
        <span>{children}</span>
        <span aria-hidden="true">{children}</span>
      </span>
      {arrow && <Arrow dir={arrow === true ? 'right' : arrow} className="btn-arrow" />}
    </>
  );
  if (href) {
    const ext = external ? { target: '_blank', rel: 'noopener' } : {};
    return <a className={cls} href={href} onClick={onClick} {...ext} {...rest}>{inner}</a>;
  }
  return <button className={cls} type={type} onClick={onClick} disabled={disabled} {...rest}>{inner}</button>;
}
