'use client';

import { CartItem as CartItemType } from '@/store/cart';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  getItemTotal: (item: CartItemType) => number;
}

export function CartItem({ item, onUpdateQuantity, onRemove, getItemTotal }: CartItemProps) {
  const itemTotal = getItemTotal(item);

  return (
    <div className="flex gap-4 py-4 border-b border-gray-200">
      {/* Item Details */}
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900">{item.name}</h4>

        {/* Size */}
        {item.selectedSize && (
          <p className="text-sm text-gray-600 mt-1">
            Size: {item.selectedSize.name}
            {item.selectedSize.priceModifier > 0 && (
              <span className="text-mcd-red ml-1">
                (+${item.selectedSize.priceModifier.toFixed(2)})
              </span>
            )}
          </p>
        )}

        {/* Customizations */}
        {item.customizations && item.customizations.length > 0 && (
          <div className="mt-2 space-y-1">
            {item.customizations.map((custom, index) => (
              <p key={index} className="text-sm text-gray-600">
                • {custom.name}
                {custom.priceModifier !== 0 && (
                  <span className="text-mcd-red ml-1">
                    ({custom.priceModifier > 0 ? '+' : ''}${custom.priceModifier.toFixed(2)})
                  </span>
                )}
              </p>
            ))}
          </div>
        )}

        {/* Special Instructions */}
        {item.specialInstructions && (
          <p className="text-sm text-gray-500 italic mt-2">
            Note: {item.specialInstructions}
          </p>
        )}

        {/* Price */}
        <p className="text-lg font-bold text-mcd-red mt-2">
          ${itemTotal.toFixed(2)}
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg">
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-200 rounded-l-lg transition-colors"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-8 text-center font-semibold text-gray-900">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-200 rounded-r-lg transition-colors"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <button
          onClick={() => onRemove(item.id)}
          className="text-sm text-red-600 hover:text-red-700 transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
