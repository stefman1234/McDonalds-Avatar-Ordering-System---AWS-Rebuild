"use client";

import { useClarificationStore } from "@/stores/clarificationStore";

interface ClarificationBannerProps {
  onSelectItem: (itemId: number) => void;
}

export default function ClarificationBanner({ onSelectItem }: ClarificationBannerProps) {
  const { active, type, originalQuery, candidates, dismiss } = useClarificationStore();

  if (!active) return null;

  return (
    <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 mb-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          {type === "not_found" && (
            <p className="text-sm text-gray-900">
              I couldn&apos;t find &quot;{originalQuery}&quot; on our menu. Could you try again?
            </p>
          )}

          {type === "ambiguous" && (
            <>
              <p className="text-sm text-gray-900 mb-2">
                Did you mean one of these?
              </p>
              <div className="flex flex-wrap gap-2">
                {candidates.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectItem(item.id);
                      dismiss();
                    }}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-900 hover:bg-mcdonalds-yellow/20 hover:border-mcdonalds-yellow transition-colors"
                  >
                    {item.name} - ${item.price.toFixed(2)}
                  </button>
                ))}
              </div>
            </>
          )}

          {type === "size_needed" && (
            <>
              <p className="text-sm text-gray-900 mb-2">
                What size would you like for your {originalQuery}?
              </p>
              <div className="flex gap-2">
                {["Small", "Medium", "Large"].map((size) => (
                  <button
                    key={size}
                    onClick={() => dismiss()}
                    className="px-4 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-900 hover:bg-mcdonalds-yellow/20 hover:border-mcdonalds-yellow transition-colors"
                  >
                    {size}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          onClick={dismiss}
          className="text-gray-400 hover:text-gray-600 text-sm font-medium whitespace-nowrap"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
