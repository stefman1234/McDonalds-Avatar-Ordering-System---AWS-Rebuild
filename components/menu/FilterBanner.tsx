"use client";

interface FilterBannerProps {
  query: string;
  resultCount: number;
  message?: string;
  onClear: () => void;
}

export default function FilterBanner({
  query,
  resultCount,
  message,
  onClear,
}: FilterBannerProps) {
  return (
    <div className="flex items-center justify-between bg-mcdonalds-yellow/20 border border-mcdonalds-yellow rounded-xl px-4 py-2 mb-3">
      <div>
        <p className="text-sm text-gray-900">
          {message || (
            <>
              Showing {resultCount} result{resultCount !== 1 ? "s" : ""} for{" "}
              <span className="font-bold text-mcdonalds-red">
                &quot;{query}&quot;
              </span>
            </>
          )}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          Tap &quot;Show All&quot; to see the full menu
        </p>
      </div>
      <button
        onClick={onClear}
        className="text-mcdonalds-red hover:text-mcdonalds-dark-red text-sm font-semibold ml-3 whitespace-nowrap"
      >
        Show All Items
      </button>
    </div>
  );
}
