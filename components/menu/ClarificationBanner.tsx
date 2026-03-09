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
              <p className="text-sm font-semibold text-gray-900 mb-3">
                Which one did you mean?
              </p>
              <div className="grid grid-cols-2 gap-2">
                {candidates.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectItem(item.id);
                      dismiss();
                    }}
                    className="flex flex-col items-start gap-0.5 bg-white border-2 border-gray-200 rounded-xl px-4 py-3 min-h-[64px] text-left hover:border-mcdonalds-yellow hover:bg-mcdonalds-yellow/10 active:scale-95 transition-all touch-manipulation"
                  >
                    <span className="text-xs text-mcdonalds-red font-bold uppercase tracking-wide">
                      Option {index + 1}
                    </span>
                    <span className="text-sm font-bold text-gray-900 leading-tight">{item.name}</span>
                    <span className="text-sm font-semibold text-mcdonalds-red">${item.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {type === "size_needed" && (
            <>
              <p className="text-sm font-semibold text-gray-900 mb-3">
                What size for your {originalQuery}?
              </p>
              <div className="flex gap-2">
                {["Small", "Medium", "Large"].map((size, index) => (
                  <button
                    key={size}
                    onClick={() => {
                      if (candidates.length > 0) {
                        onSelectItem(candidates[0].id);
                      }
                      dismiss();
                    }}
                    className="flex-1 flex flex-col items-center gap-0.5 bg-white border-2 border-gray-200 rounded-xl py-3 min-h-[64px] hover:border-mcdonalds-yellow hover:bg-mcdonalds-yellow/10 active:scale-95 transition-all touch-manipulation"
                  >
                    <span className="text-xs text-mcdonalds-red font-bold">{index + 1}</span>
                    <span className="text-sm font-bold text-gray-900">{size}</span>
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
