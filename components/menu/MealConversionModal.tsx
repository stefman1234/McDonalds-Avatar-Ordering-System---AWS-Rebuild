"use client";

import Modal from "@/components/ui/Modal";
import type { ComboMealDTO } from "@/lib/types";

interface MealConversionModalProps {
  open: boolean;
  onClose: () => void;
  combo: ComboMealDTO | null;
  itemName: string;
  itemPrice: number;
  onAccept: () => void;
  onDecline: () => void;
}

export default function MealConversionModal({
  open,
  onClose,
  combo,
  itemName,
  itemPrice,
  onAccept,
  onDecline,
}: MealConversionModalProps) {
  if (!combo) return null;

  const comboPrice = combo.basePrice - combo.discount;
  const savings = combo.discount;
  const extraCost = comboPrice - itemPrice;

  return (
    <Modal open={open} onClose={onClose} title="Upgrade to a Meal?" size="sm">
      <div className="text-center py-2">
        {/* Savings hero */}
        {savings > 0 && (
          <div className="bg-green-500 text-white rounded-2xl px-6 py-3 mb-4 mx-auto inline-block">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-90">You save</p>
            <p className="text-4xl font-black leading-none">${savings.toFixed(2)}</p>
          </div>
        )}

        <div className="w-16 h-16 bg-mcdonalds-yellow/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-3xl">🍟🥤</span>
        </div>

        <h3 className="text-base font-bold text-gray-900 mb-1">{combo.name}</h3>

        <p className="text-gray-500 text-sm mb-4">
          Add fries &amp; a drink to your {itemName}
          {extraCost > 0 ? ` for just $${extraCost.toFixed(2)} more` : " at no extra charge"}
        </p>

        <div className="bg-gray-50 rounded-xl p-3 mb-5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Meal total</span>
            <span className="font-bold text-gray-900">${comboPrice.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-gray-500">Item only</span>
            <span className="text-gray-400">${itemPrice.toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={onAccept}
            className="w-full btn-primary py-4 text-base font-bold min-h-[56px]"
          >
            Yes, make it a meal — ${comboPrice.toFixed(2)}
          </button>
          <button
            onClick={onDecline}
            className="w-full btn-outline py-3 min-h-[52px]"
          >
            Just the {itemName}
          </button>
        </div>
      </div>
    </Modal>
  );
}
