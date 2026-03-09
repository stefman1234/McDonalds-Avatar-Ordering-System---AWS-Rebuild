"use client";

import { useCartStore } from "@/stores/cartStore";

export default function CartSummary() {
  const subtotal = useCartStore((s) => s.subtotal);
  const tax = useCartStore((s) => s.tax);
  const total = useCartStore((s) => s.total);
  const itemCount = useCartStore((s) => s.itemCount);
  const count = itemCount();

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-gray-600">
        <span>
          Subtotal ({count} item{count !== 1 ? "s" : ""})
        </span>
        <span>RM {subtotal().toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-gray-600">
        <span>Tax (8.25%)</span>
        <span>RM {tax().toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
        <span>Total</span>
        <span className="text-mcdonalds-red">RM {total().toFixed(2)}</span>
      </div>
    </div>
  );
}
