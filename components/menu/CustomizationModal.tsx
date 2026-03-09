"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import type { MenuItemDTO, MealSideOption, MealDrinkOption, CartItemCustomization } from "@/lib/types";

type IceLevel = "none" | "less" | "full";
type MealType = "meal" | "alacarte" | null;
type MealSize = "medium" | "large" | null;

interface CustomizationModalProps {
  item: MenuItemDTO | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (item: MenuItemDTO, customizations: string[], extra?: {
    quantity: number;
    isCombo: boolean;
    mealSize: MealSize;
    mealSide: MealSideOption | null;
    mealDrink: (MealDrinkOption & { iceLevel: IceLevel }) | null;
    specialInstructions: string;
    richCustomizations: CartItemCustomization[];
  }) => void;
}

interface DBCustomization {
  id: number;
  name: string;
  priceExtra: number;
}

const SIDES: MealSideOption[] = [
  { id: "fries-m", name: "Medium Fries", priceModifier: 0 },
  { id: "fries-l", name: "Large Fries", priceModifier: 0.5 },
  { id: "corn", name: "Corn Cup", priceModifier: 0 },
  { id: "apple", name: "Apple Slices", priceModifier: 0 },
];

const DRINKS: (MealDrinkOption & { iceLevel?: undefined })[] = [
  { id: "coke", name: "Coca-Cola", priceModifier: 0 },
  { id: "sprite", name: "Sprite", priceModifier: 0 },
  { id: "fanta", name: "Fanta Orange", priceModifier: 0 },
  { id: "milo", name: "Milo", priceModifier: 0 },
  { id: "juice", name: "Orange Juice", priceModifier: 0.5 },
  { id: "water", name: "Bottled Water", priceModifier: 0 },
];

export default function CustomizationModal({
  item,
  open,
  onClose,
  onConfirm,
}: CustomizationModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [mealType, setMealType] = useState<MealType>(null);
  const [mealSize, setMealSize] = useState<MealSize>(null);
  const [selectedSide, setSelectedSide] = useState<MealSideOption | null>(null);
  const [selectedDrink, setSelectedDrink] = useState<MealDrinkOption | null>(null);
  const [iceLevel, setIceLevel] = useState<IceLevel>("full");
  const [isLoading, setIsLoading] = useState(false);
  const [customizations, setCustomizations] = useState<DBCustomization[]>([]);
  const [selectedCustomizations, setSelectedCustomizations] = useState<Set<number>>(new Set());
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Reset state when item changes
  useEffect(() => {
    if (open && item) {
      setCurrentStep(1);
      setMealType(null);
      setMealSize(null);
      setSelectedSide(null);
      setSelectedDrink(null);
      setIceLevel("full");
      setCustomizations([]);
      setSelectedCustomizations(new Set());
      setSpecialInstructions("");
      setQuantity(1);
      setIsLoading(false);
    }
  }, [open, item?.id]);

  // Fetch customizations when reaching customization step
  useEffect(() => {
    const custStep = mealType === "meal" ? 5 : 2;
    if (currentStep === custStep && item && customizations.length === 0) {
      setIsLoading(true);
      fetch(`/api/menu/item/${item.id}/customizations`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setCustomizations(data);
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [currentStep, item?.id, mealType]);

  if (!item) return null;

  const isMealFlow = mealType === "meal";
  const totalSteps = isMealFlow ? 5 : 2;
  const isLastStep = currentStep === totalSteps;

  function canProceed(): boolean {
    if (currentStep === 1) return mealType !== null;
    if (isMealFlow) {
      if (currentStep === 2) return mealSize !== null;
      if (currentStep === 3) return selectedSide !== null;
      if (currentStep === 4) return selectedDrink !== null;
    }
    return true;
  }

  function handleNext() {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep((s) => s + 1);
    }
  }

  function handleBack() {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  }

  function handleComplete() {
    const selectedCusts = customizations.filter((c) => selectedCustomizations.has(c.id));
    const richCusts: CartItemCustomization[] = selectedCusts.map((c) => ({
      id: String(c.id),
      name: c.name,
      category: "",
      priceModifier: c.priceExtra,
    }));

    onConfirm(item!, selectedCusts.map((c) => c.name), {
      quantity,
      isCombo: mealType === "meal",
      mealSize: isMealFlow ? mealSize : null,
      mealSide: isMealFlow ? selectedSide : null,
      mealDrink: isMealFlow && selectedDrink ? { ...selectedDrink, iceLevel } : null,
      specialInstructions,
      richCustomizations: richCusts,
    });
    onClose();
  }

  function toggleCustomization(id: number) {
    setSelectedCustomizations((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function calcTotal(): number {
    let price = item!.price;
    if (isMealFlow) {
      price += 2.5;
      if (mealSize === "large") price += 1.0;
      if (selectedSide?.priceModifier) price += selectedSide.priceModifier;
      if (selectedDrink?.priceModifier) price += selectedDrink.priceModifier;
    }
    const selectedCusts = customizations.filter((c) => selectedCustomizations.has(c.id));
    price += selectedCusts.reduce((s, c) => s + c.priceExtra, 0);
    return price * quantity;
  }

  const stepLabels = isMealFlow
    ? ["Type", "Size", "Side", "Drink", "Customize"]
    : ["Type", "Customize"];

  return (
    <Modal open={open} onClose={onClose} title={`Customize ${item.name}`} size="xl">
      <div className="min-h-[450px] flex flex-col">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {stepLabels.map((label, i) => {
            const stepNum = i + 1;
            const isActive = stepNum === currentStep;
            const isPast = stepNum < currentStep;
            return (
              <div key={label} className="flex flex-col items-center gap-1">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isActive
                      ? "w-12 bg-yellow-400"
                      : isPast
                      ? "w-6 bg-yellow-400"
                      : "w-6 bg-gray-200"
                  }`}
                />
                <span className={`text-[10px] ${isActive ? "text-gray-900 font-semibold" : "text-gray-400"}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto">
          {/* Step 1: Meal or A la carte */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-gray-900 text-center">
                How would you like your {item.name}?
              </h4>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <button
                  onClick={() => setMealType("meal")}
                  className={`p-6 rounded-xl border-2 transition-all text-center ${
                    mealType === "meal"
                      ? "border-yellow-400 bg-yellow-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-4xl block mb-2">{"\u{1F354}\u{1F35F}\u{1F964}"}</span>
                  <span className="font-bold text-gray-900 block">Make it a Meal</span>
                  <span className="text-sm text-gray-500 block mt-1">+RM 2.50</span>
                  <span className="text-xs text-gray-400 block mt-0.5">
                    Includes side & drink
                  </span>
                </button>
                <button
                  onClick={() => setMealType("alacarte")}
                  className={`p-6 rounded-xl border-2 transition-all text-center ${
                    mealType === "alacarte"
                      ? "border-yellow-400 bg-yellow-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-4xl block mb-2">{"\u{1F354}"}</span>
                  <span className="font-bold text-gray-900 block">{"\u00C0"} la Carte</span>
                  <span className="text-sm text-gray-500 block mt-1">Just the item</span>
                  <span className="text-xs text-gray-400 block mt-0.5">
                    No side or drink
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2 (meal): Size */}
          {currentStep === 2 && isMealFlow && (
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-gray-900 text-center">
                Choose your meal size
              </h4>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <button
                  onClick={() => setMealSize("medium")}
                  className={`p-6 rounded-xl border-2 transition-all text-center ${
                    mealSize === "medium"
                      ? "border-yellow-400 bg-yellow-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-3xl block mb-2">{"\u{1F35F}"}</span>
                  <span className="font-bold text-gray-900 block">Medium</span>
                  <span className="text-sm text-gray-500 block mt-1">Regular size</span>
                </button>
                <button
                  onClick={() => setMealSize("large")}
                  className={`p-6 rounded-xl border-2 transition-all text-center ${
                    mealSize === "large"
                      ? "border-yellow-400 bg-yellow-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-3xl block mb-2">{"\u{1F35F}"}</span>
                  <span className="font-bold text-gray-900 block">Large</span>
                  <span className="text-sm text-green-600 block mt-1">+RM 1.00</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 3 (meal): Side */}
          {currentStep === 3 && isMealFlow && (
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-gray-900 text-center">
                Pick your side
              </h4>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {SIDES.map((side) => (
                  <button
                    key={side.id}
                    onClick={() => setSelectedSide(side)}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      selectedSide?.id === side.id
                        ? "border-yellow-400 bg-yellow-50 shadow-md"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="font-semibold text-gray-900 block text-sm">{side.name}</span>
                    <span className="text-xs text-gray-500 block mt-1">
                      {side.priceModifier > 0 ? `+RM ${side.priceModifier.toFixed(2)}` : "Included"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4 (meal): Drink + Ice */}
          {currentStep === 4 && isMealFlow && (
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-gray-900 text-center">
                Pick your drink
              </h4>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {DRINKS.map((drink) => (
                  <button
                    key={drink.id}
                    onClick={() => setSelectedDrink(drink)}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      selectedDrink?.id === drink.id
                        ? "border-yellow-400 bg-yellow-50 shadow-md"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="font-semibold text-gray-900 block text-sm">{drink.name}</span>
                    <span className="text-xs text-gray-500 block mt-1">
                      {drink.priceModifier > 0 ? `+RM ${drink.priceModifier.toFixed(2)}` : "Included"}
                    </span>
                  </button>
                ))}
              </div>

              {/* Ice level */}
              {selectedDrink && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">Ice Level</h5>
                  <div className="flex gap-2">
                    {(["full", "less", "none"] as IceLevel[]).map((level) => (
                      <button
                        key={level}
                        onClick={() => setIceLevel(level)}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          iceLevel === level
                            ? "bg-yellow-400 text-gray-900"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {level === "full" ? "Regular Ice" : level === "less" ? "Less Ice" : "No Ice"}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Customization step (step 5 for meal, step 2 for a la carte) */}
          {currentStep === totalSteps && (
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-gray-900 text-center">
                Any customizations?
              </h4>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : customizations.length > 0 ? (
                <div className="space-y-2">
                  {customizations.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => toggleCustomization(c.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors border ${
                        selectedCustomizations.has(c.id)
                          ? "bg-yellow-50 border-yellow-400"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center ${
                            selectedCustomizations.has(c.id)
                              ? "bg-yellow-400"
                              : "border-2 border-gray-300"
                          }`}
                        >
                          {selectedCustomizations.has(c.id) && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-gray-900 text-sm font-medium">{c.name}</span>
                      </div>
                      <span className="text-gray-500 text-sm">
                        {c.priceExtra > 0 ? `+RM ${c.priceExtra.toFixed(2)}` : "Free"}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 text-sm py-4">
                  No customizations available for this item
                </p>
              )}

              {/* Special instructions */}
              <div className="mt-4">
                <label className="text-sm font-semibold text-gray-700 block mb-1">
                  Special Instructions
                </label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g., no onions, extra sauce..."
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  rows={2}
                />
              </div>

              {/* Quantity */}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Quantity</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="text-lg font-bold text-gray-900 w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-8 h-8 rounded-full border-2 border-yellow-400 bg-yellow-400 flex items-center justify-center text-gray-900 hover:bg-yellow-500"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer: Navigation + Price */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
          <div>
            {currentStep > 1 ? (
              <button
                onClick={handleBack}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            ) : (
              <div />
            )}
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-400">Total</p>
            <span className="text-xl font-bold text-mcdonalds-red">
              RM {calcTotal().toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
              canProceed()
                ? "bg-mcdonalds-red text-white hover:bg-[#C41E3A] active:scale-95 shadow-md"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isLastStep ? "Add to Order" : "Next"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
