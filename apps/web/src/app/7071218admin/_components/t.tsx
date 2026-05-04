'use client';

import { type CSSProperties } from 'react';
import { useAdminLang, ADMIN_T, type AdminStrings } from '../_lang';

/**
 * Inline translation: <T tk="settings_account" /> renders the current
 * admin-locale value of the given key. Server pages can drop this in directly
 * without becoming client components themselves; only this component hydrates.
 */
export function T({ tk }: { tk: keyof AdminStrings }) {
  const lang = useAdminLang();
  return <>{ADMIN_T[lang][tk]}</>;
}

/** <th>{T(tk)}</th> shorthand. Forwards width via inline style. */
export function TH({ tk, style }: { tk: keyof AdminStrings; style?: CSSProperties }) {
  const lang = useAdminLang();
  return <th style={style}>{ADMIN_T[lang][tk]}</th>;
}

/**
 * Translated <input placeholder>. Uses defaultValue so server actions still
 * receive the field via FormData.
 */
export function TInput({
  name,
  tkPlaceholder,
  defaultValue,
  className,
  style,
  type = 'text',
}: {
  name: string;
  tkPlaceholder: keyof AdminStrings;
  defaultValue?: string;
  className?: string;
  style?: CSSProperties;
  type?: string;
}) {
  const lang = useAdminLang();
  return (
    <input
      name={name}
      type={type}
      defaultValue={defaultValue}
      placeholder={ADMIN_T[lang][tkPlaceholder]}
      className={className}
      style={style}
    />
  );
}
