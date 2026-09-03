export function money(n: number, opts: { sign?: boolean } = {}) {
  const abs = Math.abs(n);
  let out: string;
  if (abs >= 1e9) out = `$${(abs / 1e9).toFixed(abs >= 1e10 ? 0 : 1)}B`;
  else if (abs >= 1e6) out = `$${(abs / 1e6).toFixed(abs >= 1e7 ? 0 : 1)}M`;
  else if (abs >= 1e4) out = `$${(abs / 1e3).toFixed(0)}k`;
  else if (abs >= 1e3) out = `$${(abs / 1e3).toFixed(1)}k`;
  else out = `$${Math.round(abs)}`;
  if (n < 0) return `-${out}`;
  return opts.sign ? `+${out}` : out;
}

export function num(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1e6) return `${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e4) return `${(abs / 1e3).toFixed(0)}k`;
  if (abs >= 1e3) return `${(abs / 1e3).toFixed(1)}k`;
  return Math.round(n).toString();
}

export function pct(n: number) {
  return `${Math.round(n)}%`;
}

export function full(n: number) {
  return `$${Math.round(n).toLocaleString("es-AR")}`;
}
