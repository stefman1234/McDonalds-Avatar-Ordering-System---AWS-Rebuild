"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import type { MenuItemDTO } from "@/lib/types";

interface CustomizationModalProps {
  item: MenuItemDTO | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (item: MenuItemDTO, customizations: string[]) => void;
}

export default function CustomizationModal({
  item,
  open,
  onClose,
  onConfirm,
}: CustomizationModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (!item) return null;

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function handleConfirm() {
    onConfirm(item!, Array.from(selected));
    setSelected(new Set());
    onClose();
  }

  const extraCost = item.customizations
    .filter((c) => selected.has(c.name))
    .reduce((sum, c) => sum + c.priceExtra, 0);

  return (
    <Modal open={open} onClose={onClose} title={`Customize ${item.name}`}>
      <div className="space-y-3">
        {item.customizations.map((c) => (
          <button
            key={c.id}
            onClick={() => toggle(c.name)}
            className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors border ${
              selected.has(c.name)
                ? "bg-mcdonalds-yellow/10 border-mcdonalds-yellow"
                : "bg-gray-50 border-gray-200 hover:bg-gray-100"
            }`}
          >
            <span className="text-gray-900 text-sm font-medium">
              {c.name}
            </span>
            <span className="text-gray-500 text-sm">
              {c.priceExtra > 0 ? `+$${c.priceExtra.toFixed(2)}` : "Free"}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-200">
        <div>
          <p className="text-sm text-gray-500">Total</p>
          <span className="text-2xl font-bold text-mcdonalds-red">
            ${(item.price + extraCost).toFixed(2)}
          </span>
        </div>
        <button onClick={handleConfirm} className="btn-primary">
          Add to Order
        </button>
      </div>
    </Modal>
  );
}
