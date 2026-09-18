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

export function num(n: number, opts: { sign?: boolean } = {}) {
  const abs = Math.abs(n);
  let out: string;
  if (abs >= 1e6) out = `${(abs / 1e6).toFixed(1)}M`;
  else if (abs >= 1e4) out = `${(abs / 1e3).toFixed(0)}k`;
  else if (abs >= 1e3) out = `${(abs / 1e3).toFixed(1)}k`;
  else out = Math.round(abs).toString();
  // sin esto, -4100 se mostraba como "4.1k" y el header decía que ganabas
  // usuarios mientras los perdías
  if (n < 0) return `-${out}`;
  return opts.sign ? `+${out}` : out;
}

export function pct(n: number) {
  return `${Math.round(n)}%`;
}

export function full(n: number) {
  return `$${Math.round(n).toLocaleString("es-AR")}`;
}
