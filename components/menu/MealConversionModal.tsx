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
  const extraCost = comboPrice - itemPrice;

  return (
    <Modal open={open} onClose={onClose} title="Make it a Meal?" size="sm">
      <div className="text-center py-4">
        <div className="w-20 h-20 bg-mcdonalds-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">🍔🍟🥤</span>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {combo.name}
        </h3>

        <p className="text-gray-600 text-sm mb-4">
          Upgrade your {itemName} to a meal with fries and a drink
          {extraCost > 0 ? ` for just $${extraCost.toFixed(2)} more!` : "!"}
        </p>

        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Meal price</span>
            <span className="font-bold text-green-700">${comboPrice.toFixed(2)}</span>
          </div>
          {combo.discount > 0 && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-green-600">You save</span>
              <span className="font-bold text-green-600">${combo.discount.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <button
            onClick={onAccept}
            className="w-full btn-primary py-3 text-lg"
          >
            Make it a Meal - ${comboPrice.toFixed(2)}
          </button>
          <button
            onClick={onDecline}
            className="w-full btn-outline py-3"
          >
            Just the {itemName}
          </button>
        </div>
      </div>
    </Modal>
  );
}
