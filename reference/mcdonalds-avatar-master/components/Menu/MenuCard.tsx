'use client';

import { useState } from 'react';
import { Card, CardBody, CardFooter } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  subcategory?: string | null;
  description?: string | null;
  basePrice: number;
  imageUrl?: string | null;
  calories?: number | null;
  available: boolean;
  vegetarian?: boolean | null;
  glutenFree?: boolean | null;
  timeRestriction?: string | null;
  popular?: boolean | null;
  sizes?: {
    id: string;
    name: string;
    priceModifier: number;
    caloriesModifier?: number | null;
  }[];
}

interface MenuCardProps {
  item: MenuItem;
  onAddToCart?: (item: MenuItem) => void;
  onCustomize?: (item: MenuItem) => void;
}

// Helper function to get relevant emoji/icon based on item name or category
const getItemIcon = (item: MenuItem): string => {
  const name = item.name.toLowerCase();
  const category = item.category.toLowerCase();

  // Check specific item names first
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

  // Check by category
  if (category === 'burger') return '🍔';
  if (category === 'chicken') return '🍗';
  if (category === 'sides') return '🍟';
  if (category === 'drinks') return '🥤';
  if (category === 'desserts') return '🍨';
  if (category === 'happy_meal') return '🎉';

  // Default
  return '🍔';
};

export function MenuCard({ item, onAddToCart, onCustomize }: MenuCardProps) {
  const [imageError, setImageError] = useState(false);

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(item);
    }
  };

  const handleCustomize = () => {
    if (onCustomize) {
      onCustomize(item);
    }
  };

  return (
    <Card hover className="h-full flex flex-col">
      {/* Image Placeholder */}
      <div className="relative h-48 bg-gradient-to-br from-mcd-yellow to-mcd-light-yellow rounded-t-lg overflow-hidden">
        {item.imageUrl && !imageError ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl">{getItemIcon(item)}</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {item.popular && (
            <span className="bg-mcd-red text-white text-xs font-bold px-2 py-1 rounded-full">
              POPULAR
            </span>
          )}
          {item.vegetarian && (
            <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              🌱 VEGETARIAN
            </span>
          )}
          {item.glutenFree && (
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              GLUTEN-FREE
            </span>
          )}
        </div>
      </div>

      <CardBody className="flex-grow">
        {/* Item Name */}
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {item.name}
        </h3>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {item.description}
          </p>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          {item.calories && (
            <span className="flex items-center gap-1">
              <span>🔥</span>
              <span>{item.calories} cal</span>
            </span>
          )}
          {item.sizes && item.sizes.length > 0 && (
            <span className="flex items-center gap-1">
              <span>📏</span>
              <span>{item.sizes.length} sizes</span>
            </span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-2xl font-bold text-mcd-red">
            ${item.basePrice.toFixed(2)}
          </span>
          {item.sizes && item.sizes.length > 0 && (
            <span className="text-xs text-gray-500">starting at</span>
          )}
        </div>
      </CardBody>

      <CardFooter>
        <div className="space-y-2 w-full">
          {item.available && onCustomize && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCustomize}
            >
              Customize
            </Button>
          )}
          <Button
            variant="primary"
            className="w-full"
            onClick={handleAddToCart}
            disabled={!item.available}
          >
            {item.available ? 'Add to Order' : 'Unavailable'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
