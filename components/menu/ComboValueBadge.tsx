"use client";

interface ComboValueBadgeProps {
  savings: number;
}

export default function ComboValueBadge({ savings }: ComboValueBadgeProps) {
  if (savings <= 0) return null;

  return (
    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
      Save ${savings.toFixed(2)} as meal
    </span>
  );
}
