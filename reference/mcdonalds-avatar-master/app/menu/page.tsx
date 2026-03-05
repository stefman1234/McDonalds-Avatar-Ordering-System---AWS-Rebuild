'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MenuList, CategoryFilter, MenuItem, CustomizationModal } from '@/components/Menu';
import { Input } from '@/components/UI/Input';
import { CartButton, CartDrawer } from '@/components/Cart';
import { useCartStore } from '@/store/cart';

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCustomizationOpen, setIsCustomizationOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const { addItem } = useCartStore();

  // Fetch menu items on mount
  useEffect(() => {
    fetchMenuItems();
  }, []);

  // Filter items when category or search changes
  useEffect(() => {
    filterItems();
  }, [menuItems, selectedCategory, searchQuery]);

  const fetchMenuItems = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/menu');
      const result = await response.json();

      if (result.success) {
        setMenuItems(result.data);
      } else {
        setError(result.error || 'Failed to load menu items');
      }
    } catch (err) {
      setError('Failed to load menu items. Please try again.');
      console.error('Error fetching menu:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = [...menuItems];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.name.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
      );
    }

    setFilteredItems(filtered);
  };

  const handleAddToCart = (item: MenuItem) => {
    // Add item to cart with default settings
    addItem({
      menuItemId: item.id,
      name: item.name,
      basePrice: item.basePrice,
      quantity: 1,
      customizations: [],
      isCombo: false,
    });

    // Show success feedback and open cart
    setIsCartOpen(true);
  };

  const handleCustomize = (item: MenuItem) => {
    setSelectedItem(item);
    setIsCustomizationOpen(true);
  };

  const handleCustomizationAddToCart = (customizedItem: any) => {
    // Add customized item to cart
    addItem({
      menuItemId: customizedItem.menuItemId,
      name: customizedItem.name,
      basePrice: customizedItem.basePrice,
      quantity: customizedItem.quantity,
      selectedSize: customizedItem.selectedSize,
      customizations: customizedItem.customizations,
      specialInstructions: customizedItem.specialInstructions,
      isCombo: false,
    });

    // Close modal and show cart
    setIsCustomizationOpen(false);
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-shrink-0">
              <h1 className="text-3xl font-bold text-gray-900">Our Menu</h1>
              <p className="mt-1 text-sm text-gray-600">
                Browse our delicious selection of items
              </p>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md">
              <Input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Cart Button */}
            <div className="flex-shrink-0 flex items-center gap-3">
              <Link
                href="/order"
                className="text-sm text-mcd-red hover:text-mcd-dark-red font-medium transition-colors"
              >
                ← Back to Order
              </Link>
              <CartButton onClick={() => setIsCartOpen(true)} />
            </div>
          </div>
        </div>
      </header>

      {/* Category Filter */}
      <CategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Menu Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="w-full py-20">
            <div className="flex flex-col items-center justify-center gap-4">
              <span className="text-6xl">⚠️</span>
              <h3 className="text-xl font-bold text-gray-900">Oops! Something went wrong</h3>
              <p className="text-gray-600">{error}</p>
              <button
                onClick={fetchMenuItems}
                className="btn-primary"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <MenuList
            items={filteredItems}
            onAddToCart={handleAddToCart}
            onCustomize={handleCustomize}
            isLoading={isLoading}
          />
        )}
      </main>

      {/* Footer Info */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <p>
              💡 <span className="font-medium">Tip:</span> You can customize any item when adding to your order
            </p>
            <p>
              🕐 Breakfast items available 6:00 AM - 11:00 AM
            </p>
          </div>
        </div>
      </footer>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Customization Modal */}
      {selectedItem && (
        <CustomizationModal
          isOpen={isCustomizationOpen}
          onClose={() => setIsCustomizationOpen(false)}
          item={selectedItem}
          onAddToCart={handleCustomizationAddToCart}
        />
      )}
    </div>
  );
}
