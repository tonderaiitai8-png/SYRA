export interface CartItem {
  type: 'single' | 'meal_deal';
  id: string;
  name: string;
  basePrice: number;
  quantity: number;
  mainItem?: string;
  sideItem?: string;
  drinkItem?: string;
  sideUpgradeCost?: number;
  salad?: string[];
  sauce?: string;
  sauceCost?: number;
  totalPrice: number;
}

export interface CustomerInfo {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  deliveryTime?: string;
  notes?: string;
}

export interface SessionState {
  cart: CartItem[];
  conversationHistory: any[];
  allergyRestrictions: string[];
  dietaryPreferences: string[];
  checkoutMode?: boolean;
  customerInfo?: CustomerInfo;
}
