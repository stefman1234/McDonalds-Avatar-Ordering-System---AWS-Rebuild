// Database type definitions (will be expanded as we build)

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  description: string | null;
  base_price: number;
  image_url: string | null;
  calories: number | null;
  available: boolean;
  vegetarian: boolean;
  gluten_free: boolean;
  time_restriction: string | null;
  popular: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItemSize {
  id: string;
  menu_item_id: string;
  size_name: string;
  price_modifier: number;
  calories_modifier: number;
  created_at: string;
}

export interface CustomizationOption {
  id: string;
  name: string;
  category: string;
  price_modifier: number;
  applicable_to: string;
  created_at: string;
}

export interface ComboMeal {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  discount_amount: number;
  includes: any; // JSONB
  image_url: string | null;
  popular: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string | null;
  order_type: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  payment_method: string | null;
  payment_status: string;
  session_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  combo_meal_id: string | null;
  quantity: number;
  size: string | null;
  unit_price: number;
  line_total: number;
  customizations: any; // JSONB
  special_instructions: string | null;
  created_at: string;
}

export interface ConversationSession {
  id: string;
  session_id: string;
  order_id: string | null;
  status: string;
  conversation_history: any; // JSONB
  current_step: string | null;
  context_data: any; // JSONB
  started_at: string;
  last_activity_at: string;
  ended_at: string | null;
}
