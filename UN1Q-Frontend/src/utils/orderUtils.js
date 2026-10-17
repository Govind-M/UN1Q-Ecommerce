export const PLACEHOLDER = "https://placehold.co/80x100/f0ede8/888?text=UN1Q";

export const effectivePrice = (price, discount = "0%") =>
  Math.round(price * (1 - parseInt(discount, 10) / 100));

export const formatDate = (isoString) => {
  if (!isoString) return "";
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const STATUS_CONFIG = {
  Delivered:   { color: "#16a34a", dot: "#22c55e" },
  "In Transit":{ color: "#b45309", dot: "#f59e0b" },
  Processing:  { color: "#1d4ed8", dot: "#60a5fa" },
  Cancelled:   { color: "#dc2626", dot: "#f87171" },
};