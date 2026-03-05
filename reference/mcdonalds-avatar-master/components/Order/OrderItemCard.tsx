'use client';

import { Card, CardBody, CardFooter } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { CartItem } from '@/store/cart';

interface OrderItemCardProps {
  item: CartItem;
  onRemove: (id: string) => void;
  onCustomize?: (item: CartItem) => void;
}

// Helper function to get relevant emoji/icon based on item name
const getItemIcon = (itemName: string): string => {
  const name = itemName.toLowerCase();

  // Check specific item names
  if (name.includes('big mac')) return '🍔';
  if (name.includes('filet') || name.includes('fish')) return '🐟';
  if (name.includes('chicken') || name.includes('mcchicken') || name.includes('nugget')) return '🍗';
  if (name.includes('fries') || name.includes('fry')) return '🍟';
  if (name.includes('happy meal')) return '🎉';
  if (name.includes('sundae') || name.includes('ice cream')) return '🍦';
  if (name.includes('mcflurry')) return '🥤';
  if (name.includes('apple') && name.includes('pie')) return '🥧';
  if (name.includes('shake')) return '🥤';
  if (name.includes('salad')) return '🥗';
  if (name.includes('wrap')) return '🌯';
  if (name.includes('milo')) return '☕';
  if (name.includes('coffee') || name.includes('latte') || name.includes('cappuccino')) return '☕';
  if (name.includes('juice')) return '🧃';
  if (name.includes('water')) return '💧';
  if (name.includes('corn')) return '🌽';
  if (name.includes('burger')) return '🍔';
  if (name.includes('coke') || name.includes('sprite') || name.includes('soda')) return '🥤';

  // Default
  return '🍔';
};

export function OrderItemCard({ item, onRemove, onCustomize }: OrderItemCardProps) {
  // Calculate item total
  const calculateTotal = (): number => {
    let total = item.basePrice;

    // Add meal upcharge if it's a combo
    if (item.isCombo) {
      total += 2.50; // Base meal upcharge
      if (item.mealSize === 'large') {
        total += 1.00; // Large meal upcharge
      }
    }

    if (item.selectedSize) {
      total += item.selectedSize.priceModifier;
    }

    item.customizations.forEach(customization => {
      total += customization.priceModifier;
    });

    // Add meal side price modifier
    if (item.mealSide) {
      total += item.mealSide.priceModifier;
    }

    // Add meal drink price modifier
    if (item.mealDrink) {
      total += item.mealDrink.priceModifier;
    }

    return total * item.quantity;
  };

  const itemTotal = calculateTotal();

  return (
    <Card hover className="h-full flex flex-col">
      {/* Image Placeholder */}
      <div className="relative h-48 bg-gradient-to-br from-green-500 to-green-600 rounded-t-lg overflow-hidden">
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-6xl">{getItemIcon(item.name)}</span>
        </div>

        {/* Quantity Badge */}
        <div className="absolute top-2 left-2">
          <span className="bg-mcd-red text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-md">
            Qty: {item.quantity}
          </span>
        </div>

        {/* Combo Badge */}
        {item.isCombo && (
          <div className="absolute top-2 right-2">
            <span className="bg-mcd-yellow text-gray-900 text-xs font-bold px-2 py-1 rounded-full">
              COMBO
            </span>
          </div>
        )}
      </div>

      <CardBody className="flex-grow">
        {/* Item Name */}
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {item.name}
        </h3>

        {/* Size */}
        {item.selectedSize && (
          <div className="mb-2">
            <span className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded">
              {item.selectedSize.name}
            </span>
          </div>
        )}

        {/* Meal Size */}
        {item.isCombo && item.mealSize && (
          <div className="mb-2">
            <span className="text-sm text-gray-700 bg-green-100 px-2 py-1 rounded">
              {item.mealSize === 'medium' ? 'Medium Meal' : 'Large Meal'}
            </span>
          </div>
        )}

        {/* Meal Side */}
        {item.isCombo && item.mealSide && (
          <div className="mb-2">
            <p className="text-xs font-semibold text-gray-700 mb-1">Side:</p>
            <span className="text-sm text-gray-700 bg-gray-50 px-2 py-1 rounded">
              {item.mealSide.name}
            </span>
          </div>
        )}

        {/* Meal Drink */}
        {item.isCombo && item.mealDrink && (
          <div className="mb-2">
            <p className="text-xs font-semibold text-gray-700 mb-1">Drink:</p>
            <span className="text-sm text-gray-700 bg-gray-50 px-2 py-1 rounded">
              {item.mealDrink.name}
              {item.mealDrink.iceLevel && (
                <span className="ml-2 text-xs text-gray-500">
                  ({item.mealDrink.iceLevel === 'none' ? 'No Ice' :
                    item.mealDrink.iceLevel === 'less' ? 'Less Ice' : 'Full Ice'})
                </span>
              )}
            </span>
          </div>
        )}

        {/* Customizations */}
        {item.customizations && item.customizations.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-700 mb-1">Customizations:</p>
            <ul className="text-xs text-gray-600 space-y-0.5">
              {item.customizations.slice(0, 3).map((customization, idx) => (
                <li key={idx} className="flex justify-between">
                  <span>{customization.name}</span>
                  {customization.priceModifier !== 0 && (
                    <span className="text-gray-500">
                      {customization.priceModifier > 0 ? '+' : ''}
                      ${customization.priceModifier.toFixed(2)}
                    </span>
                  )}
                </li>
              ))}
              {item.customizations.length > 3 && (
                <li className="text-gray-500 italic">
                  +{item.customizations.length - 3} more...
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Special Instructions */}
        {item.specialInstructions && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-700 mb-1">Special Instructions:</p>
            <p className="text-xs text-gray-600 italic line-clamp-2">
              {item.specialInstructions}
            </p>
          </div>
        )}

        {/* Price */}
        <div className="mt-auto">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-green-600">
              ${itemTotal.toFixed(2)}
            </span>
            {item.quantity > 1 && (
              <span className="text-xs text-gray-500">
                (${(itemTotal / item.quantity).toFixed(2)} each)
              </span>
            )}
          </div>
        </div>
      </CardBody>

      <CardFooter>
        <div className="space-y-2 w-full">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onCustomize?.(item)}
          >
            Customize
          </Button>
          <Button
            variant="outline"
            className="w-full text-red-600 hover:bg-red-50 border-red-300"
            onClick={() => onRemove(item.id)}
          >
            Remove from Order
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
