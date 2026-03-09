export interface MenuItemDTO {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  available: boolean;
  categoryId: number;
  categoryName: string;
  aliases: string[];
  customizations: CustomizationDTO[];
  popular?: boolean;
}

export interface CustomizationDTO {
  id: number;
  name: string;
  priceExtra: number;
}

export interface CategoryDTO {
  id: number;
  name: string;
  sortOrder: number;
  items: MenuItemDTO[];
}

export interface MealSideOption {
  id: string;
  name: string;
  priceModifier: number;
}

export interface MealDrinkOption {
  id: string;
  name: string;
  priceModifier: number;
  iceLevel?: "none" | "less" | "full";
}

export interface CartItemCustomization {
  id: string;
  name: string;
  category: string;
  priceModifier: number;
}

export interface CartItem {
  id: string; // unique cart line ID
  menuItemId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  customizations: string[];
  imageUrl: string | null;
  // Meal composition fields (optional — only set via CustomizationModal or voice meal flow)
  isCombo?: boolean;
  mealSize?: "medium" | "large" | null;
  mealSide?: MealSideOption | null;
  mealDrink?: MealDrinkOption | null;
  selectedSize?: { id: string; name: string; priceModifier: number } | null;
  specialInstructions?: string;
  richCustomizations?: CartItemCustomization[];
}

export interface NLPOrderIntent {
  action: "add" | "remove" | "modify" | "modify_size" | "undo" | "clear" | "checkout" | "meal_response" | "info" | "unknown";
  items: NLPOrderItem[];
  clarificationNeeded?: string;
  response: string;
  fuzzyCandidates?: { id: number; name: string; price: number; score: number; categoryName: string }[];
}

export interface NLPOrderItem {
  name: string;
  quantity: number;
  customizations: string[];
  matchedMenuItemId?: number;
  confidence: number;
  unitPrice?: number;
  categoryName?: string;
  originalName?: string; // for modify actions
  newSize?: string; // for modify_size actions
  newQuantity?: number; // for quantity corrections
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
}

export interface ComboMealDTO {
  id: number;
  name: string;
  description: string | null;
  basePrice: number;
  discount: number;
  mainItemId: number;
  defaultSideId: number | null;
  defaultDrinkId: number | null;
  available: boolean;
  popular: boolean;
  aliases: string[];
}

export interface MealDealSuggestion {
  combo: ComboMealDTO;
  currentTotal: number;
  comboPrice: number;
  savings: number;
  matchedItemIds: string[];
}

export interface PendingItem {
  id: string;
  menuItem: MenuItemDTO;
  quantity: number;
  customizations: string[];
  status: "confirming" | "customizing" | "meal_offer" | "ready";
  comboOffer?: ComboMealDTO;
}

export type ClarificationType = "not_found" | "ambiguous" | "size_needed";

export type VoiceCheckoutStep = "idle" | "readback" | "order_type" | "payment" | "processing";
