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

export interface CartItem {
  id: string; // unique cart line ID
  menuItemId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  customizations: string[];
  imageUrl: string | null;
}

export interface NLPOrderIntent {
  action: "add" | "remove" | "modify" | "clear" | "checkout" | "unknown";
  items: NLPOrderItem[];
  clarificationNeeded?: string;
  response: string;
}

export interface NLPOrderItem {
  name: string;
  quantity: number;
  customizations: string[];
  matchedMenuItemId?: number;
  confidence: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
}
