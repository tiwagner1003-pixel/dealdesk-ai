export function formatMoney(value: number, currency: string) {
  const n = Math.round(value);
  const s = Math.abs(n).toLocaleString("en-US");
  return (n < 0 ? "−" : "") + s + " " + currency + "m";
}

export function formatBillions(value: number) {
  return (value / 1000).toFixed(1) + "B";
}

export function formatMultiple(value: number) {
  return value.toFixed(1) + "x";
}

export function formatPercent(value: number, decimals = 1) {
  return value.toFixed(decimals) + "%";
}
