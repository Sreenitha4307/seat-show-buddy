export const formatPrice = (cents: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(cents / 100);

export const formatShowTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};

export const seatLabel = (row: number, col: number) => `${String.fromCharCode(65 + row)}${col + 1}`;
