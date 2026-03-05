'use client';

import { MenuCard, MenuItem } from './MenuCard';

interface MenuListProps {
  items: MenuItem[];
  onAddToCart?: (item: MenuItem) => void;
  onCustomize?: (item: MenuItem) => void;
  isLoading?: boolean;
}

export function MenuList({ items, onAddToCart, onCustomize, isLoading = false }: MenuListProps) {
  if (isLoading) {
    return (
      <div className="w-full py-20">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 border-4 border-mcd-yellow border-t-mcd-red rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">Loading delicious items...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="w-full py-20">
        <div className="flex flex-col items-center justify-center gap-4">
          <span className="text-6xl">🔍</span>
          <h3 className="text-xl font-bold text-gray-900">No items found</h3>
          <p className="text-gray-600">
            Try selecting a different category or adjusting your filters
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Item Count */}
      <div className="mb-6">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{items.length}</span> items
        </p>
      </div>

      {/* Grid of Menu Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item) => (
          <MenuCard
            key={item.id}
            item={item}
            onAddToCart={onAddToCart}
            onCustomize={onCustomize}
          />
        ))}
      </div>
    </div>
  );
}
