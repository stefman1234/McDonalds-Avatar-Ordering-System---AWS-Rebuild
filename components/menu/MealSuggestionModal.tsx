"use client";

import Modal from "@/components/ui/Modal";
import type { MealDealSuggestion } from "@/lib/types";

interface MealSuggestionModalProps {
  open: boolean;
  onClose: () => void;
  suggestion: MealDealSuggestion | null;
  onConvert: () => void;
  onKeepSeparate: () => void;
}

export default function MealSuggestionModal({
  open,
  onClose,
  suggestion,
  onConvert,
  onKeepSeparate,
}: MealSuggestionModalProps) {
  if (!suggestion) return null;

  return (
    <Modal open={open} onClose={onClose} title="Save with a Meal Deal!" size="sm">
      <div className="text-center py-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">💰</span>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {suggestion.combo.name}
        </h3>

        <p className="text-gray-600 text-sm mb-4">
          Your current items could be combined into a meal deal!
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Current total</span>
            <span className="text-gray-500 line-through">${suggestion.currentTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-bold text-gray-900">Meal deal price</span>
            <span className="font-bold text-mcdonalds-red">${suggestion.comboPrice.toFixed(2)}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between">
            <span className="font-bold text-green-600">You save</span>
            <span className="font-bold text-green-600">${suggestion.savings.toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <button onClick={onConvert} className="w-full btn-primary py-3 text-lg">
            Convert to Meal - Save ${suggestion.savings.toFixed(2)}
          </button>
          <button onClick={onKeepSeparate} className="w-full btn-outline py-3">
            Keep Items Separate
          </button>
        </div>
      </div>
    </Modal>
  );
}
