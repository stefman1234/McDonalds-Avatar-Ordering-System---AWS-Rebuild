// API request and response type definitions

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

export interface ParsedOrder {
  items: ParsedItem[];
  intent: 'add_to_order' | 'modify_order' | 'confirm' | 'question';
  clarifications_needed: string[];
  confidence: number;
}

export interface ParsedItem {
  name: string;
  matched_menu_id: string | null;
  quantity: number;
  size?: 'small' | 'medium' | 'large';
  customizations: string[];
}

export interface OrderContext {
  conversationHistory: ConversationMessage[];
  currentCart: CartItem[];
  sessionId: string;
}

export interface ConversationContext {
  cart: CartItem[];
  sessionState: string;
  lastAction: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface CartItem {
  id: string;
  menuItem: {
    id: string;
    name: string;
    base_price: number;
    image_url?: string;
  };
  quantity: number;
  size?: string;
  customizations: Customization[];
  price: number;
  line_total: number;
}

export interface Customization {
  id: string;
  name: string;
  category: 'remove' | 'add' | 'substitute';
  price_modifier: number;
}

export interface CreateOrderRequest {
  customer_name?: string;
  order_type: 'dine_in' | 'takeout';
  items: OrderItemRequest[];
  subtotal: number;
  tax: number;
  total: number;
  payment_method?: string;
  session_id?: string;
  notes?: string;
}

export interface OrderItemRequest {
  menu_item_id?: string;
  combo_meal_id?: string;
  quantity: number;
  size?: string;
  customizations?: any;
  unit_price: number;
  line_total: number;
  special_instructions?: string;
}

export interface CreateOrderResponse {
  id: string;
  order_number: string;
  status: string;
  total: number;
  estimated_time: number;
  created_at: string;
}
