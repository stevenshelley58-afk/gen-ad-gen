import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const defaultBrandSections = [
  { key: "value_propositions", title: "Value Propositions", type: "items" },
  { key: "target_audience", title: "Target Audience", type: "content" },
  { key: "positioning", title: "Positioning", type: "content" },
  { key: "key_features", title: "Key Features", type: "items" },
];

export function generateBrandCard(brand = {}) {
  const sections = defaultBrandSections.map((section) => {
    const value = brand[section.key];

    if (section.type === "items") {
      return {
        title: section.title,
        items: Array.isArray(value) ? value : [],
      };
    }

    return {
      title: section.title,
      content: typeof value === "string" ? value : "",
    };
  });

  return {
    type: "brand",
    title: brand.name || "",
    tagline: brand.tagline || "",
    domain: brand.domain || "",
    category: brand.category || "",
    confidence: typeof brand.confidence_0_1 === "number" ? brand.confidence_0_1 : null,
    sections,
  };
}

export function formatDuration(ms) {
  if (typeof ms !== "number" || Number.isNaN(ms)) {
    return null;
  }

  if (ms < 1000) {
    return `${Math.round(ms)} ms`;
  }

  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(seconds < 10 ? 1 : 0)} s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export function formatTimestamp(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString();
}
