'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/Button';
import { MenuItem } from './MenuCard';

interface Customization {
  id: string;
  name: string;
  category: string;
  priceModifier: number;
  applicableTo: string;
}

interface SideItem {
  id: string;
  name: string;
  priceModifier: number;
}

interface DrinkItem {
  id: string;
  name: string;
  priceModifier: number;
}

type IceLevel = 'none' | 'less' | 'full';
type MealType = 'meal' | 'alacarte' | null;
type MealSize = 'medium' | 'large' | null;

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
  onAddToCart: (customizedItem: any) => void;
}

export function CustomizationModal({ isOpen, onClose, item, onAddToCart }: CustomizationModalProps) {
  // Step management
  const [currentStep, setCurrentStep] = useState(1);

  // Meal configuration
  const [mealType, setMealType] = useState<MealType>(null);
  const [mealSize, setMealSize] = useState<MealSize>(null);
  const [selectedSide, setSelectedSide] = useState<SideItem | null>(null);
  const [selectedDrink, setSelectedDrink] = useState<DrinkItem | null>(null);
  const [iceLevel, setIceLevel] = useState<IceLevel>('full');

  // Item customization
  const [isLoading, setIsLoading] = useState(false);
  const [customizations, setCustomizations] = useState<Customization[]>([]);
  const [selectedCustomizations, setSelectedCustomizations] = useState<Customization[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Available sides and drinks (these would normally come from API)
  const sides: SideItem[] = [
    { id: 'fries-m', name: 'Medium Fries', priceModifier: 0 },
    { id: 'fries-l', name: 'Large Fries', priceModifier: 0.50 },
    { id: 'corn', name: 'Corn Cup', priceModifier: 0 },
    { id: 'apple', name: 'Apple Slices', priceModifier: 0 },
  ];

  const drinks: DrinkItem[] = [
    { id: 'coke', name: 'Coca-Cola', priceModifier: 0 },
    { id: 'sprite', name: 'Sprite', priceModifier: 0 },
    { id: 'fanta', name: 'Fanta Orange', priceModifier: 0 },
    { id: 'milo', name: 'Milo', priceModifier: 0 },
    { id: 'juice', name: 'Orange Juice', priceModifier: 0.50 },
    { id: 'water', name: 'Bottled Water', priceModifier: 0 },
  ];

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen && item) {
      setCurrentStep(1);
      setMealType(null);
      setMealSize(null);
      setSelectedSide(null);
      setSelectedDrink(null);
      setIceLevel('full');
      setSelectedCustomizations([]);
      setSpecialInstructions('');
      setQuantity(1);
    }
  }, [isOpen, item]);

  // Fetch customizations when needed
  useEffect(() => {
    if (item && isOpen && (currentStep === getCustomizationsStep())) {
      fetchCustomizations(item.id);
    }
  }, [item, isOpen, currentStep]);

  const getCustomizationsStep = () => {
    if (mealType === 'meal') {
      return 5; // Meal -> Size -> Side -> Drink -> Customizations
    } else {
      return 2; // À la carte -> Customizations
    }
  };

  const fetchCustomizations = async (itemId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/menu/${itemId}`);
      const result = await response.json();

      if (result.success && result.data.customizations) {
        setCustomizations(result.data.customizations);
      }
    } catch (error) {
      console.error('Error fetching customizations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCustomization = (customization: Customization) => {
    setSelectedCustomizations(prev => {
      const exists = prev.find(c => c.id === customization.id);
      if (exists) {
        return prev.filter(c => c.id !== customization.id);
      } else {
        return [...prev, customization];
      }
    });
  };

  const calculateTotal = () => {
    let total = item?.basePrice || 0;

    // Add meal pricing if applicable
    if (mealType === 'meal') {
      total += 2.50; // Base meal upcharge
      if (mealSize === 'large') {
        total += 1.00; // Large meal upcharge
      }
      if (selectedSide) {
        total += selectedSide.priceModifier;
      }
      if (selectedDrink) {
        total += selectedDrink.priceModifier;
      }
    }

    // Add customization modifiers
    selectedCustomizations.forEach(custom => {
      total += custom.priceModifier;
    });

    return total * quantity;
  };

  const handleNext = () => {
    if (mealType === 'meal') {
      // Meal flow: Type -> Size -> Side -> Drink -> Customizations
      if (currentStep === 1) setCurrentStep(2); // Meal type -> Size
      else if (currentStep === 2) setCurrentStep(3); // Size -> Side
      else if (currentStep === 3) setCurrentStep(4); // Side -> Drink
      else if (currentStep === 4) setCurrentStep(5); // Drink -> Customizations
    } else if (mealType === 'alacarte') {
      // À la carte flow: Type -> Customizations
      if (currentStep === 1) setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) return mealType !== null;
    if (currentStep === 2 && mealType === 'meal') return mealSize !== null;
    if (currentStep === 3 && mealType === 'meal') return selectedSide !== null;
    if (currentStep === 4 && mealType === 'meal') return selectedDrink !== null;
    return true;
  };

  const handleComplete = () => {
    if (item) {
      const customizedItem = {
        menuItemId: item.id,
        name: item.name,
        basePrice: item.basePrice,
        quantity,
        isCombo: mealType === 'meal',
        mealSize: mealSize,
        mealSide: selectedSide,
        mealDrink: selectedDrink ? { ...selectedDrink, iceLevel } : null,
        customizations: selectedCustomizations.map(c => ({
          id: c.id,
          name: c.name,
          category: c.category,
          priceModifier: c.priceModifier,
        })),
        specialInstructions,
      };

      onAddToCart(customizedItem);
      handleClose();
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setMealType(null);
    setMealSize(null);
    setSelectedSide(null);
    setSelectedDrink(null);
    setIceLevel('full');
    setSelectedCustomizations([]);
    setSpecialInstructions('');
    setQuantity(1);
    onClose();
  };

  if (!item) return null;

  const total = calculateTotal();

  // Step 1: Meal Type Selection
  const renderMealTypeStep = () => (
    <div className="text-center py-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">{item.name}</h2>
      <p className="text-gray-600 mb-8">Would you like this as a meal or à la carte?</p>

      <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
        <button
          onClick={() => {
            setMealType('meal');
          }}
          className={`p-8 border-4 rounded-2xl transition-all ${
            mealType === 'meal'
              ? 'border-mcd-red bg-red-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-6xl mb-4">🍔🍟🥤</div>
          <div className="text-xl font-bold text-gray-900 mb-2">Meal</div>
          <div className="text-sm text-gray-600">With side and drink</div>
        </button>

        <button
          onClick={() => {
            setMealType('alacarte');
          }}
          className={`p-8 border-4 rounded-2xl transition-all ${
            mealType === 'alacarte'
              ? 'border-mcd-red bg-red-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-6xl mb-4">🍔</div>
          <div className="text-xl font-bold text-gray-900 mb-2">À la carte</div>
          <div className="text-sm text-gray-600">Item only</div>
        </button>
      </div>
    </div>
  );

  // Step 2: Meal Size Selection (only for meals)
  const renderMealSizeStep = () => (
    <div className="text-center py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Meal Size</h2>
      <p className="text-gray-600 mb-8">Select medium or large</p>

      <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
        <button
          onClick={() => setMealSize('medium')}
          className={`p-8 border-4 rounded-2xl transition-all ${
            mealSize === 'medium'
              ? 'border-mcd-red bg-red-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-5xl mb-4">📦</div>
          <div className="text-xl font-bold text-gray-900 mb-2">Medium</div>
          <div className="text-sm text-gray-600">Standard size</div>
        </button>

        <button
          onClick={() => setMealSize('large')}
          className={`p-8 border-4 rounded-2xl transition-all ${
            mealSize === 'large'
              ? 'border-mcd-red bg-red-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-5xl mb-4">📦📦</div>
          <div className="text-xl font-bold text-gray-900 mb-2">Large</div>
          <div className="text-sm text-gray-600">+$1.00</div>
        </button>
      </div>
    </div>
  );

  // Step 3: Side Selection
  const renderSideSelectionStep = () => (
    <div className="py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Choose Your Side</h2>
      <p className="text-gray-600 mb-8 text-center">Select one side for your meal</p>

      <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
        {sides.map((side) => (
          <button
            key={side.id}
            onClick={() => setSelectedSide(side)}
            className={`p-6 border-4 rounded-xl transition-all text-left ${
              selectedSide?.id === side.id
                ? 'border-mcd-red bg-red-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-gray-900 mb-1">{side.name}</div>
                {side.priceModifier > 0 && (
                  <div className="text-sm text-mcd-red">+${side.priceModifier.toFixed(2)}</div>
                )}
              </div>
              {selectedSide?.id === side.id && (
                <svg className="w-6 h-6 text-mcd-red" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // Step 4: Drink Selection with Ice Options
  const renderDrinkSelectionStep = () => (
    <div className="py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Choose Your Drink</h2>
      <p className="text-gray-600 mb-8 text-center">Select one drink for your meal</p>

      {/* Drink Selection */}
      <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto mb-8">
        {drinks.map((drink) => (
          <button
            key={drink.id}
            onClick={() => setSelectedDrink(drink)}
            className={`p-6 border-4 rounded-xl transition-all text-left ${
              selectedDrink?.id === drink.id
                ? 'border-mcd-red bg-red-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-gray-900 mb-1">{drink.name}</div>
                {drink.priceModifier > 0 && (
                  <div className="text-sm text-mcd-red">+${drink.priceModifier.toFixed(2)}</div>
                )}
              </div>
              {selectedDrink?.id === drink.id && (
                <svg className="w-6 h-6 text-mcd-red" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Ice Level Selection */}
      {selectedDrink && (
        <div className="max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Ice Level</h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setIceLevel('none')}
              className={`p-4 border-4 rounded-xl transition-all ${
                iceLevel === 'none'
                  ? 'border-mcd-red bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-3xl mb-2">🚫🧊</div>
              <div className="font-bold text-gray-900">No Ice</div>
            </button>

            <button
              onClick={() => setIceLevel('less')}
              className={`p-4 border-4 rounded-xl transition-all ${
                iceLevel === 'less'
                  ? 'border-mcd-red bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-3xl mb-2">🧊</div>
              <div className="font-bold text-gray-900">Less Ice</div>
            </button>

            <button
              onClick={() => setIceLevel('full')}
              className={`p-4 border-4 rounded-xl transition-all ${
                iceLevel === 'full'
                  ? 'border-mcd-red bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-3xl mb-2">🧊🧊🧊</div>
              <div className="font-bold text-gray-900">Full Ice</div>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Step 5 (or 2 for à la carte): Customizations
  const renderCustomizationsStep = () => {
    // Group customizations by category
    const groupedCustomizations = customizations.reduce((acc, custom) => {
      if (!acc[custom.category]) {
        acc[custom.category] = [];
      }
      acc[custom.category]!.push(custom);
      return acc;
    }, {} as Record<string, Customization[]>);

    return (
      <div className="py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Customize Your {item.name}</h2>
        <p className="text-gray-600 mb-8 text-center">Select any modifications</p>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-mcd-yellow border-t-mcd-red rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            {Object.keys(groupedCustomizations).length > 0 ? (
              Object.entries(groupedCustomizations).map(([category, options]) => (
                <div key={category}>
                  <h3 className="font-semibold text-gray-900 mb-3 capitalize">
                    {category.replace('_', ' ')}
                  </h3>
                  <div className="space-y-2">
                    {options.map((custom) => {
                      const isSelected = selectedCustomizations.find(c => c.id === custom.id);
                      return (
                        <button
                          key={custom.id}
                          onClick={() => toggleCustomization(custom)}
                          className={`w-full p-4 border-4 rounded-xl text-left transition-all ${
                            isSelected
                              ? 'border-mcd-red bg-red-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-900">{custom.name}</span>
                            <div className="flex items-center gap-2">
                              {custom.priceModifier !== 0 && (
                                <span className={`text-sm font-semibold ${
                                  custom.priceModifier > 0 ? 'text-mcd-red' : 'text-green-600'
                                }`}>
                                  {custom.priceModifier > 0 ? '+' : ''}${custom.priceModifier.toFixed(2)}
                                </span>
                              )}
                              {isSelected && (
                                <svg className="w-5 h-5 text-mcd-red" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">No customization options available for this item.</p>
            )}

            {/* Special Instructions */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Special Instructions</h3>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Any special requests? (e.g., extra napkins, fresh cooked)"
                className="w-full p-4 border-4 border-gray-200 rounded-xl resize-none focus:border-mcd-red focus:outline-none"
                rows={3}
              />
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <span className="font-semibold text-gray-900">Quantity</span>
              <div className="flex items-center gap-2 bg-white rounded-lg border-2 border-gray-200">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-l-lg transition-colors"
                >
                  −
                </button>
                <span className="w-12 text-center font-semibold text-gray-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-r-lg transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render current step
  const renderCurrentStep = () => {
    if (currentStep === 1) return renderMealTypeStep();

    if (mealType === 'meal') {
      if (currentStep === 2) return renderMealSizeStep();
      if (currentStep === 3) return renderSideSelectionStep();
      if (currentStep === 4) return renderDrinkSelectionStep();
      if (currentStep === 5) return renderCustomizationsStep();
    } else {
      if (currentStep === 2) return renderCustomizationsStep();
    }

    return null;
  };

  const isLastStep = () => {
    if (mealType === 'meal') return currentStep === 5;
    if (mealType === 'alacarte') return currentStep === 2;
    return false;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title=""
      size="xl"
    >
      <div className="min-h-[500px] flex flex-col">
        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: mealType === 'meal' ? 5 : 2 }).map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index + 1 === currentStep
                    ? 'w-12 bg-mcd-red'
                    : index + 1 < currentStep
                    ? 'w-8 bg-mcd-yellow'
                    : 'w-8 bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1">
          {renderCurrentStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="px-6"
              >
                ← Back
              </Button>
            )}

            <div className="flex-1"></div>

            {/* Total Price */}
            <div className="text-right mr-4">
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-2xl font-bold text-mcd-red">${total.toFixed(2)}</div>
            </div>

            {/* Next/Complete Button */}
            {isLastStep() ? (
              <Button
                variant="primary"
                onClick={handleComplete}
                className="px-8"
              >
                Complete Order
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-8"
              >
                Next →
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
