// OpenAI Service for Syra AI - Enhanced with Safety-First Allergy Management & Contextual Intelligence
import { RESTAURANT_CONFIG, MENU_LOOKUP, ALL_ALLERGENS, getMenuForAI } from '../../shared/menuData.ts';
import type { CartItem, SessionState } from '../../shared/aiTypes.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not configured');
}

// Helper functions for contextual awareness
function getTimeOfDay(): { period: string; greeting: string; suggestion: string } {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 11) {
    return {
      period: 'early_morning',
      greeting: 'Good morning',
      suggestion: 'lighter meals, drinks, or snacks (breakfast items not available before 11 AM)'
    };
  } else if (hour >= 11 && hour < 14) {
    return {
      period: 'lunch',
      greeting: 'Good afternoon',
      suggestion: 'lunch specials, meal deals, or hearty meals'
    };
  } else if (hour >= 14 && hour < 17) {
    return {
      period: 'afternoon',
      greeting: 'Good afternoon',
      suggestion: 'snacks, sides, or lighter meals'
    };
  } else if (hour >= 17 && hour < 21) {
    return {
      period: 'evening',
      greeting: 'Good evening',
      suggestion: 'dinner platters, family meals, or combo meals'
    };
  } else {
    return {
      period: 'night',
      greeting: 'Welcome',
      suggestion: 'late-night snacks, comfort food, or satisfying meals'
    };
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const { session, userMessage } = await req.json();

    if (!session || typeof userMessage !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid request payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const result = await processAIMessage(userMessage, session as SessionState);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('AI chat function error:', error);
    return new Response(
      JSON.stringify({
        error: error?.message || 'Failed to process AI request'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function getDayOfWeek(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
}

function isWeekend(): boolean {
  const day = new Date().getDay();
  return day === 0 || day === 6;
}

// Smart pairing suggestions based on cart content
function getSmartPairings(cart: CartItem[], allergens: string[]): string[] {
  const suggestions: string[] = [];
  
  // Check what's missing from a complete meal
  const hasDrink = cart.some(item => 
    item.name.toLowerCase().includes('coke') || 
    item.name.toLowerCase().includes('drink') ||
    item.name.toLowerCase().includes('water') ||
    item.name.toLowerCase().includes('pepsi')
  );
  
  const hasSide = cart.some(item => 
    item.name.toLowerCase().includes('fries') || 
    item.name.toLowerCase().includes('chips')
  );
  
  const hasDessert = cart.some(item => 
    item.name.toLowerCase().includes('cake') || 
    item.name.toLowerCase().includes('ice cream') ||
    item.name.toLowerCase().includes('dessert')
  );
  
  // Check for specific items for smart upsells
  const hasCheesyItem = cart.some(item => 
    item.name.toLowerCase().includes('cheese')
  );
  
  const hasBurger = cart.some(item => 
    item.name.toLowerCase().includes('burger')
  );
  
  const hasChicken = cart.some(item => 
    item.name.toLowerCase().includes('chicken')
  );
  
  const hasSpicyItem = cart.some(item => 
    item.name.toLowerCase().includes('peri') ||
    item.name.toLowerCase().includes('spicy')
  );
  
  // Smart specific pairing suggestions
  if (hasCheesyItem && !hasSide) {
    suggestions.push('SMART UPSELL: Getting something cheesy? Add Cheesy Chips for just £2 more to complete your cheese feast!');
  }
  
  if (hasBurger && !hasSide && !hasCheesyItem) {
    suggestions.push('SMART PAIRING: Burgers and Peri Chips are a perfect match! Want to add some for £3?');
  }
  
  if (hasSpicyItem && !hasDrink) {
    suggestions.push('SMART TIP: Spicy items pair great with a cold drink! How about a refreshing Coke or Pepsi?');
  }
  
  if (hasChicken && !hasSide) {
    suggestions.push('UPGRADE OPPORTUNITY: Make it a combo! Add fries and a drink to create a complete meal deal.');
  }
  
  // General meal completion suggestions
  if (!hasDrink && cart.length > 0) {
    suggestions.push('Complete your meal with a refreshing drink! We have Coke, Pepsi, Tango Orange, and more.');
  }
  
  if (cart.length > 0 && !hasSide) {
    suggestions.push('How about some crispy fries or peri chips on the side? They go perfectly with any meal!');
  }
  
  if (cart.length > 1 && !hasDessert) {
    suggestions.push('Sweet finish? Our Chocolate Fudge Cake is a customer favorite for just £3.50!');
  }
  
  // Check for allergen-safe suggestions
  if (allergens.length === 0 || !allergens.includes('Dairy')) {
    if (hasBurger && !hasCheesyItem) {
      suggestions.push('CHEESE UPGRADE: Want to add cheese to your burger? Makes it even more delicious!');
    }
  }
  
  return suggestions;
}

// Validate item against allergies
function isItemSafe(itemId: string, allergens: string[]): boolean {
  const item = MENU_LOOKUP[itemId];
  if (!item || allergens.length === 0) return true;
  
  return !item.allergens?.some((allergen) => 
    allergens.some((userAllergen) => 
      allergen.toLowerCase().includes(userAllergen.toLowerCase()) ||
      userAllergen.toLowerCase().includes(allergen.toLowerCase())
    )
  );
}

// Get safe alternatives for items with allergens (exported for potential future use)
export function getSafeAlternatives(itemId: string, allergens: string[]): string {
  const item = MENU_LOOKUP[itemId];
  if (!item) return '';
  
  const category = item.category;
  const alternatives: string[] = [];
  
  // Find similar items without allergens
  RESTAURANT_CONFIG.menu.categories.forEach(cat => {
    if (cat.name === category) {
      cat.items.forEach(candidateItem => {
        if (isItemSafe(candidateItem.id, allergens) && candidateItem.id !== itemId) {
          alternatives.push(candidateItem.name);
        }
      });
    }
  });
  
  return alternatives.length > 0 
    ? `Safe alternatives: ${alternatives.slice(0, 3).join(', ')}` 
    : 'Unfortunately, we don\'t have allergen-free alternatives in this category.';
}

// New cart item interface for meal deal bundling
// Using shared CartItem and SessionState interfaces

const functions = [
  {
    name: 'add_to_cart',
    description: "Add a SINGLE item (not part of a meal deal) to the customer's cart. Use this for standalone items only. For meal deals, use create_meal_deal instead.",
    parameters: {
      type: 'object',
      properties: {
        item_id: { type: 'string', description: 'The ID of the menu item to add' },
        quantity: { type: 'number', description: 'The quantity to add (default 1)' }
      },
      required: ['item_id']
    }
  },
  {
    name: 'create_meal_deal',
    description: 'Create a complete meal deal with main item, side, and drink. Use after customer confirms meal upgrade. This creates a BUNDLED cart item.',
    parameters: {
      type: 'object',
      properties: {
        main_item_id: { 
          type: 'string', 
          description: 'The main item (burger, chicken, wrap, ribs, etc.)' 
        },
        side_item_id: { 
          type: 'string', 
          description: 'Side selection: fries, peri_chips, cheesy_chips, or curly_fries' 
        },
        drink_item_id: { 
          type: 'string', 
          description: 'Drink selection (e.g., drink_coke, drink_pepsi, drink_tango_orange)' 
        },
        salad: { 
          type: 'array', 
          items: { type: 'string' },
          description: "Optional salad options: ['lettuce', 'tomato', 'onion', 'cucumber']" 
        },
        sauce_item_id: { 
          type: 'string', 
          description: 'Optional sauce/dip item_id from Dips menu (adds £0.50)' 
        }
      },
      required: ['main_item_id', 'side_item_id', 'drink_item_id']
    }
  },
  {
    name: 'add_customizations',
    description: 'Add salad and sauce customizations to the most recent cart item (meal deal or single item)',
    parameters: {
      type: 'object',
      properties: {
        cart_item_index: { 
          type: 'number', 
          description: 'Index of cart item to customize (0 for most recent)' 
        },
        salad: { 
          type: 'array', 
          items: { type: 'string' },
          description: "Salad options: ['lettuce', 'tomato', 'onion', 'cucumber']" 
        },
        sauce_item_id: { 
          type: 'string', 
          description: 'Dip item_id (adds £0.50 if not already included)' 
        }
      },
      required: ['cart_item_index']
    }
  },
  {
    name: 'remove_from_cart',
    description: "Remove an item from the customer's cart by index.",
    parameters: {
      type: 'object',
      properties: {
        cart_item_index: { 
          type: 'number', 
          description: 'Index of the item to remove (0 for most recent)' 
        }
      },
      required: ['cart_item_index']
    }
  },
  {
    name: 'clear_cart',
    description: 'Clear the entire cart.',
    parameters: { type: 'object', properties: {} }
  },
  {
    name: 'search_menu',
    description: 'Search the menu for items matching criteria.',
    parameters: {
      type: 'object',
      properties: {
        exclude_allergens: { type: 'array', items: { type: 'string' } },
        dietary_tags: { type: 'array', items: { type: 'string' } },
        max_price: { type: 'number' }
      }
    }
  },
  {
    name: 'set_dietary_restrictions',
    description: "Record customer's allergy or dietary restrictions.",
    parameters: {
      type: 'object',
      properties: {
        allergens: { type: 'array', items: { type: 'string' } },
        dietary_prefs: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  {
    name: 'initiate_checkout',
    description: 'Start the checkout process to collect customer delivery information. Only call this when user explicitly wants to checkout.',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'collect_customer_info',
    description: 'Store customer delivery information during checkout. Validate that all required fields are present.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Customer full name' },
        address: { type: 'string', description: 'Full delivery address (street, city, postcode)' },
        phone: { type: 'string', description: 'Contact phone number' },
        email: { type: 'string', description: 'Customer email (optional)' },
        deliveryTime: { type: 'string', description: 'Preferred delivery time' },
        notes: { type: 'string', description: 'Special instructions or notes (optional)' }
      },
      required: ['name', 'address', 'phone', 'deliveryTime']
    }
  },
  {
    name: 'parse_and_collect_customer_info',
    description: 'Parse customer information from natural language input and store it. Use this when customer provides all info in one message.',
    parameters: {
      type: 'object',
      properties: {
        rawText: { type: 'string', description: 'Raw customer input containing name, address, phone, and delivery time' }
      },
      required: ['rawText']
    }
  }
];

// Side upgrade cost calculation
function getSideUpgradeCost(sideItemId: string): number {
  const baseFriesPrice = 2.50;
  const sideItem = MENU_LOOKUP[sideItemId];
  if (!sideItem) return 0;
  
  if (sideItemId === 'fries') return 0; // Classic fries included
  
  // Calculate upgrade cost
  const upgradeCost = sideItem.price - baseFriesPrice;
  return Math.max(0, upgradeCost);
}

// Customer info parsing function
function parseCustomerInfoFromText(text: string): {
  isValid: boolean;
  customerInfo?: {
    name: string;
    address: string;
    phone: string;
    email?: string;
    deliveryTime: string;
    notes?: string;
  };
  parsedFields?: string[];
  errors?: string[];
} {
  const errors: string[] = [];
  const parsedFields: string[] = [];
  
  let name = '';
  let address = '';
  let phone = '';
  let deliveryTime = '';
  
  // Parse name (first word, or first two words if first looks like part of name)
  const nameMatch = text.match(/^([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/);
  if (nameMatch) {
    name = nameMatch[1].trim();
    parsedFields.push('name');
  }
  
  // Parse phone number (various formats)
  const phoneMatch = text.match(/(\+?44|0)?[\s\-]?(\d{11}|\d{10}|\d{4}\s?\d{6}|\d{4}[\s\-]?\d{3}[\s\-]?\d{3})/);
  if (phoneMatch) {
    phone = phoneMatch[0].replace(/[\s\-]/g, '');
    if (phone.startsWith('0')) {
      phone = phone.replace(/^0/, '44');
    }
    if (!phone.startsWith('44')) {
      phone = '44' + phone;
    }
    parsedFields.push('phone');
  }
  
  // Parse delivery time (various formats like 330pm, 3:30pm, 3pm, etc)
  const timePatternsForParsing = [
    /(\d{1,2}:\d{2}\s*(?:am|pm))/i,        // 3:30pm, 15:30
    /(\d{1,2}\.\d{2}\s*(?:am|pm))/i,       // 3.30pm
    /(\d{1,4}\s*(?:am|pm))/i,              // 330pm, 3pm, 3am
    /(\d{1,2}:\d{2})/                      // 15:30, 3:30 (24-hour)
  ];

  for (const pattern of timePatternsForParsing) {
    const match = text.match(pattern);
    if (match) {
      let timeStr = match[1].toLowerCase().replace(/\s+/g, '');
      let hours = 0;
      let minutes = 0;
      const isPM = timeStr.includes('pm');
      const isAM = timeStr.includes('am');
      
      if (timeStr.includes(':') || timeStr.includes('.')) {
        // Handle 3:30pm, 3.30pm format
        const separator = timeStr.includes(':') ? ':' : '.';
        const [h, m] = timeStr.split(separator);
        hours = parseInt(h);
        minutes = parseInt(m) || 0;
      } else {
        // Handle 330pm, 3pm, 3am format
        const numericPart = timeStr.replace(/(am|pm)/, '');
        if (numericPart.length === 3 && /^\d{3}$/.test(numericPart)) {
          // 330pm -> 3:30pm (handle 3-digit numbers as HHMM format)
          const num = parseInt(numericPart);
          if (num >= 100 && num <= 1259) {
            // 330 -> 3:30, 1230 -> 12:30, etc.
            hours = Math.floor(num / 100);
            minutes = num % 100;
          }
        } else if (numericPart.length === 4 && /^\d{4}$/.test(numericPart)) {
          // 1530pm -> 15:30pm (4-digit 24-hour format)
          hours = parseInt(numericPart.substring(0, 2));
          minutes = parseInt(numericPart.substring(2));
        } else {
          // 3pm -> 3:00pm
          hours = parseInt(numericPart);
          minutes = 0;
        }
      }
      
      // Convert to 24-hour format
      if (isPM && hours < 12) {
        hours += 12;
      } else if (isAM && hours === 12) {
        hours = 0;
      } else if (!isPM && !isAM && hours <= 24) {
        // Assume 24-hour format if no am/pm
        hours = hours;
      }
      
      deliveryTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      parsedFields.push('deliveryTime');
      break; // Found valid time, stop trying other patterns
    }
  }
  
  // Parse address (everything that's not name, phone, or time)
  let remainingText = text;
  if (name) {
    // Remove name (both first name and full name) more precisely
    remainingText = remainingText.replace(new RegExp('^' + name.replace(/\s+/g, '\\s+') + '[, ]*', 'i'), '');
  }
  if (phone) remainingText = remainingText.replace(new RegExp(phone.replace(/^44/, '0').replace(/[\s\-]/g, ''), 'i'), '');
  
  // Remove various time formats from the text more aggressively
  const timePatternsForRemoval = [
    /(\d{1,2}:\d{2}\s*(?:am|pm)?)/gi,
    /(\d{1,2}\.\d{2}\s*(?:am|pm)?)/gi,
    /(\d{1,4}\s*(?:am|pm))/gi,
    /(\d{1,2}:\d{2})/g
  ];
  timePatternsForRemoval.forEach(pattern => {
    remainingText = remainingText.replace(pattern, '');
  });
  
  // Clean up and extract address with proper formatting
  address = remainingText.trim()
    .replace(/[,]+/g, ', ')
    .replace(/\s+/g, ' ')
    .replace(/\s,\s/g, ', ')
    .replace(/,\s*$/, '')
    .replace(/^\d{1,2}$/, '') // Remove standalone numbers that might be time remnants
    .trim();
  
  // Capitalize properly - but don't over-capitalize postcodes
  address = address.split(' ').map((word) => {
    // Keep postcodes like "SP10" as uppercase
    if (/^[A-Z]\d{1,2}[A-Z]?$/.test(word.toUpperCase()) || /^[A-Z]{1,3}\d[A-Z]{1,3}$/.test(word.toUpperCase())) {
      return word.toUpperCase();
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
  
  if (address) parsedFields.push('address');
  
  // Validation
  if (!name) errors.push('Name not found');
  if (!address) errors.push('Address not found');
  if (!phone) errors.push('Phone number not found');
  if (!deliveryTime) errors.push('Delivery time not found');
  
  const isValid = !!(name && address && phone && deliveryTime);
  
  return {
    isValid,
    customerInfo: isValid ? { name, address, phone, deliveryTime } : undefined,
    parsedFields,
    errors: errors.length > 0 ? errors : undefined
  };
}

function executeFunctionCall(functionName: string, args: any, session: SessionState) {
  const updatedSession = { ...session, cart: [...session.cart] };

  switch (functionName) {
    case 'add_to_cart': {
      const { item_id, quantity = 1 } = args;
      const item = MENU_LOOKUP[item_id];
      
      if (!item) {
        return { result: { error: 'Item not found' }, session };
      }

      // Create single cart item
      const cartItem: CartItem = {
        type: 'single',
        id: item_id,
        name: item.name,
        basePrice: item.price,
        quantity,
        totalPrice: item.price * quantity
      };

      updatedSession.cart.push(cartItem);
      
      return {
        result: {
          success: true,
          item: item.name,
          quantity,
          price: item.price,
          total: cartItem.totalPrice
        },
        session: updatedSession
      };
    }

    case 'create_meal_deal': {
      const { main_item_id, side_item_id, drink_item_id, salad, sauce_item_id } = args;
      
      const mainItem = MENU_LOOKUP[main_item_id];
      const sideItem = MENU_LOOKUP[side_item_id];
      const drinkItem = MENU_LOOKUP[drink_item_id];
      
      if (!mainItem || !sideItem || !drinkItem) {
        return { result: { error: 'One or more items not found' }, session };
      }

      const sideUpgradeCost = getSideUpgradeCost(side_item_id);
      const sauceCost = sauce_item_id ? 0.50 : 0;
      
      // Calculate meal deal price: main + drink (£1.50) + side upgrade + sauce
      const basePrice = mainItem.price + 1.50;
      const totalPrice = basePrice + sideUpgradeCost + sauceCost;

      const mealDeal: CartItem = {
        type: 'meal_deal',
        id: `meal_${Date.now()}`,
        name: `${mainItem.name} Meal`,
        basePrice,
        quantity: 1,
        mainItem: main_item_id,
        sideItem: side_item_id,
        drinkItem: drink_item_id,
        sideUpgradeCost,
        salad: salad || [],
        sauce: sauce_item_id,
        sauceCost,
        totalPrice
      };

      updatedSession.cart.push(mealDeal);

      return {
        result: {
          success: true,
          mealName: mealDeal.name,
          main: mainItem.name,
          side: sideItem.name,
          drink: drinkItem.name,
          sideUpgrade: sideUpgradeCost > 0 ? `+£${sideUpgradeCost.toFixed(2)}` : 'included',
          salad: salad || [],
          sauce: sauce_item_id ? MENU_LOOKUP[sauce_item_id]?.name : null,
          totalPrice
        },
        session: updatedSession
      };
    }

    case 'add_customizations': {
      const { cart_item_index, salad, sauce_item_id } = args;
      
      if (cart_item_index < 0 || cart_item_index >= updatedSession.cart.length) {
        return { result: { error: 'Invalid cart item index' }, session };
      }

      const cartItem = updatedSession.cart[cart_item_index];
      
      if (salad && salad.length > 0) {
        cartItem.salad = salad;
      }
      
      if (sauce_item_id) {
        const sauceItem = MENU_LOOKUP[sauce_item_id];
        if (sauceItem) {
          cartItem.sauce = sauce_item_id;
          cartItem.sauceCost = 0.50;
          cartItem.totalPrice += 0.50;
        }
      }

      return {
        result: {
          success: true,
          itemName: cartItem.name,
          salad: cartItem.salad,
          sauce: cartItem.sauce ? MENU_LOOKUP[cartItem.sauce]?.name : null
        },
        session: updatedSession
      };
    }

    case 'remove_from_cart': {
      const { cart_item_index } = args;
      
      if (cart_item_index < 0 || cart_item_index >= updatedSession.cart.length) {
        return { result: { error: 'Invalid cart item index' }, session };
      }

      const removedItem = updatedSession.cart.splice(cart_item_index, 1)[0];

      return {
        result: { success: true, removedItem: removedItem.name },
        session: updatedSession
      };
    }

    case 'clear_cart': {
      updatedSession.cart = [];
      return {
        result: { success: true, message: 'Cart cleared' },
        session: updatedSession
      };
    }

    case 'search_menu': {
      const { exclude_allergens = [], dietary_tags = [], max_price } = args;
      const results: any[] = [];
      
      RESTAURANT_CONFIG.menu.categories.forEach((cat) => {
        cat.items.forEach((item) => {
          if (exclude_allergens.length > 0) {
            const hasAllergen = item.allergens?.some((a: string) => 
              exclude_allergens.some((ea: string) => a.toLowerCase().includes(ea.toLowerCase()))
            );
            if (hasAllergen) return;
          }

          if (dietary_tags.length > 0) {
            const hasTags = dietary_tags.every((tag: string) =>
              item.tags?.some((t: string) => t.toLowerCase() === tag.toLowerCase())
            );
            if (!hasTags) return;
          }

          if (max_price !== undefined && item.price > max_price) return;

          results.push({
            id: item.id,
            name: item.name,
            price: item.price,
            description: item.description
          });
        });
      });

      return {
        result: { items: results.slice(0, 10), count: results.length },
        session: updatedSession
      };
    }

    case 'set_dietary_restrictions': {
      const { allergens = [], dietary_prefs = [] } = args;
      updatedSession.allergyRestrictions = allergens;
      updatedSession.dietaryPreferences = dietary_prefs;

      return {
        result: {
          success: true,
          allergens: updatedSession.allergyRestrictions,
          dietary_prefs: updatedSession.dietaryPreferences
        },
        session: updatedSession
      };
    }

    case 'initiate_checkout': {
      updatedSession.checkoutMode = true;
      updatedSession.customerInfo = {};

      return {
        result: {
          success: true,
          message: 'Checkout mode activated. Ready to collect customer information.',
          cartItemCount: updatedSession.cart.length
        },
        session: updatedSession
      };
    }

    case 'collect_customer_info': {
      const { name, address, phone, email, deliveryTime, notes } = args;

      // Validate required fields
      if (!name || !address || !phone || !deliveryTime) {
        return {
          result: {
            error: 'Missing required information. Please provide name, address, phone, and delivery time.',
            missingFields: {
              name: !name,
              address: !address,
              phone: !phone,
              deliveryTime: !deliveryTime
            }
          },
          session: updatedSession
        };
      }

      // Enable checkout mode and store customer info
      updatedSession.checkoutMode = true;
      updatedSession.customerInfo = {
        name,
        address,
        phone,
        email: email || '',
        deliveryTime,
        notes: notes || ''
      };

      return {
        result: {
          success: true,
          message: 'Customer information collected successfully',
          customerInfo: updatedSession.customerInfo
        },
        session: updatedSession
      };
    }

    case 'parse_and_collect_customer_info': {
      // New function to parse natural language customer info
      const { rawText } = args;
      
      if (!rawText) {
        return {
          result: { error: 'No text provided to parse' },
          session
        };
      }

      // Simple parsing logic for customer information
      const parsedInfo = parseCustomerInfoFromText(rawText);
      
      if (!parsedInfo.isValid) {
        return {
          result: {
            error: 'Could not parse customer information. Please provide: name, full address with postcode, phone number, and delivery time clearly.',
            parsedInfo
          },
          session
        };
      }

      // Enable checkout mode and store customer info
      updatedSession.checkoutMode = true;
      updatedSession.customerInfo = parsedInfo.customerInfo;

      return {
        result: {
          success: true,
          message: 'Customer information parsed and collected successfully',
          customerInfo: updatedSession.customerInfo,
          parsedFields: parsedInfo.parsedFields
        },
        session: updatedSession
      };
    }

    default:
      return { result: { error: 'Unknown function' }, session };
  }
}

export async function processAIMessage(
  userMessage: string,
  session: SessionState
): Promise<{ reply: string; session: SessionState }> {
  
  const timeContext = getTimeOfDay();
  const dayInfo = getDayOfWeek();
  const isWeekendDay = isWeekend();
  const smartPairings = getSmartPairings(session.cart, session.allergyRestrictions);
  
  const systemPrompt = `You are Syra, ${RESTAURANT_CONFIG.prompts.systemPrompt.replace('You are Syra, ', '')}

=== CONTEXTUAL AWARENESS ===
Current time: ${timeContext.period} (${timeContext.greeting})
Day: ${dayInfo}${isWeekendDay ? ' (Weekend - great time for family platters!)' : ''}
Time-appropriate suggestions: ${timeContext.suggestion}

${smartPairings.length > 0 ? `\n=== SMART PAIRING OPPORTUNITIES ===\n${smartPairings.join('\n')}\n` : ''}

=== CRITICAL SAFETY-FIRST RULES ===
1. ALLERGY SAFETY IS PARAMOUNT:
   - If customer hasn't mentioned allergies yet, ask: "Before I suggest anything, do you have any food allergies I should know about?"
   - NEVER recommend items without checking allergy compatibility first
   - When customer has allergies, ALWAYS validate every suggestion against their restrictions
   - Provide cross-contamination warnings when relevant
   - Always offer safe alternatives when items contain allergens

2. MENU ACCURACY:
   - You must ONLY recommend items that exist in the menu below
   - NEVER make up items that aren't in the menu
   - Be persuasive but honest about what we offer

3. FUNCTION CALLING:
   - Use function calling for ALL cart operations
   - Validate all recommendations against customer allergies before adding to cart

=== ENHANCED DIETARY INTELLIGENCE ===
When customer has allergies:
- Start by empathizing: "I see you have [allergen] allergy. Let me find safe options for you!"
- Explicitly filter recommendations: "All my suggestions are [allergen]-free"
- Warn about cross-contamination: "Note: Some items may be prepared in areas with [allergen]"
- Offer alternatives: "This item contains [allergen], but try [safe alternative] instead!"
- Explain ingredients when asked: "The [item] contains [ingredients list]"

=== CONTEXTUAL CONVERSATION INTELLIGENCE ===
Time-Based Suggestions:
- CRITICAL: Before 11 AM - DO NOT suggest breakfast items. Recommend lighter meals, drinks, or snacks instead.
- 11 AM - 2 PM (Lunch): Recommend meal deals, sandwiches, wraps, burgers, and combo meals
- 2 PM - 5 PM (Afternoon): Suggest snacks, sides, or lighter meals
- 5 PM - 9 PM (Evening): Push family platters, dinner combos, larger portions
- 9 PM+ (Late Night): Comfort food, satisfying meals, snacks
- Weekend: Family platters, larger orders for gatherings

Smart Upselling & Pairing:
- CHEESY ITEMS: If customer orders anything with cheese → suggest "Cheesy Chips to match!"
- BURGERS: If customer orders burger → suggest "Make it a combo with fries and a drink!"
- SPICY ITEMS: If customer orders peri/spicy → suggest "A cold drink pairs perfectly with spicy food!"
- CHICKEN: If customer orders chicken → suggest "Upgrade to a meal deal for better value!"
- NO SIDES: Always suggest fries, peri chips, or cheesy chips as additions
- NO DRINKS: Suggest Coke, Pepsi, or other drinks to complete the meal

Smart Discovery Responses:
- "Show me healthy options" -> Filter by gluten-free, salad items, grilled chicken
- "What's under £10?" -> Filter by price with max_price parameter
- "Something spicy" -> Recommend peri peri items, hot wings, chilli items
- "What do you have for kids?" -> Kids meals section
- "Vegetarian options?" -> Veggie meals, salads, sides

Customer Engagement:
- Notice patterns: "I see you like chicken! Have you tried our peri peri strips?"
- Acknowledge good choices: "Excellent choice! That's one of our popular items."
- Create urgency for specials: "Perfect timing! This is a customer favorite."
- Celebrate completion: "Great selection! Your meal is going to be delicious!"

=== SMART CART AWARENESS ===
Track what's in cart and suggest:
- Missing drink: "Don't forget a drink! Coke, Pepsi, or something else?"
- Missing side: "How about adding fries to make it a complete meal?"
- Up-sell dessert: "Finish with something sweet? Our chocolate fudge cake is amazing!"
- Quantity suggestions: "That's a lot of food! Ordering for multiple people?"
- Meal deal upgrade: "Want to save money? Make it a meal deal with fries and a drink!"

=== INGREDIENT & NUTRITION HELP ===
Answer questions about:
- Ingredients: "What's in the Caesar salad?" -> List main ingredients from description
- Preparation: "How spicy is the buffalo chicken?" -> Explain flavor profile
- Portions: "Is the burger enough for one person?" -> Guide based on item name/price
- Allergens: Always reference the allergens array from menu data

=== CURRENT SESSION CONTEXT ===
Cart Status: ${session.cart.length} items totaling £${session.cart.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}
${session.cart.length > 0 ? `Current Cart Items: ${session.cart.map(item => `${item.name} (£${item.totalPrice.toFixed(2)})`).join(', ')}` : ''}
Allergy Restrictions: ${session.allergyRestrictions.length > 0 ? session.allergyRestrictions.join(', ') : 'None specified - ASK FIRST!'}
Dietary Preferences: ${session.dietaryPreferences.length > 0 ? session.dietaryPreferences.join(', ') : 'None specified'}
Order History This Session: ${session.conversationHistory.length} interactions

${session.allergyRestrictions.length > 0 ? `
⚠️ ACTIVE ALLERGY ALERT ⚠️
Customer is allergic to: ${session.allergyRestrictions.join(', ')}
- Validate EVERY recommendation against these allergens
- Warn about cross-contamination risks
- Offer safe alternatives for any item containing these allergens
- Be extra cautious and thorough
` : ''}

MEAL DEAL BUNDLING PROTOCOL (CRITICAL - FOLLOW EXACTLY):

Step 1: IDENTIFY MAIN ITEMS
When a customer orders ANY standalone main item (burgers, chicken, wraps, ribs), immediately recognize it as a meal opportunity.

Step 2: OFFER MEAL DEAL
Ask: "Would you like to make that a meal? I can add fries and a drink!"
- Be enthusiastic and conversational
- Make it sound like great value

Step 3: SIDE UPGRADE UPSELL (After YES to meal)
Once they agree to meal deal, offer side upgrades:
"Great! For your fries, upgrade to:
- Peri Peri Chips for just +50p
- Cheesy Chips for +£1
- Curly Fries for +£1
Or stick with Classic Fries (included)!"

Step 4: SALAD OPTIONS
After side selection, ask: "Add any salad? Lettuce, tomato, onion, cucumber - all included!"

Step 5: SAUCE UPSELL
After salad, offer: "Want a sauce for 50p? We have:"
- Chilli Sauce (dip_chilli)
- Ketchup (dip_ketchup)
- Mayonnaise (dip_mayo)
- Burger Sauce (dip_burger_sauce)
- Garlic Sauce (dip_garlic)
- BBQ Sauce (dip_bbq)
- Peri Peri Sauce (dip_peri)
- Blue Cheese Sauce (dip_blue_cheese)

Step 6: DRINK SELECTION
Ask: "Which drink? Coke, Diet Coke, Pepsi, 7Up, Dr Pepper, Coke Zero, Tango Orange, Rio, or Water?"

Step 7: CREATE MEAL DEAL
Use create_meal_deal function with all selections to create a SINGLE BUNDLED cart item.

EXAMPLE CONVERSATION:
Customer: "I'd like a Cheese Job"
You: "The Cheese Job is a great choice! Would you like to make that a meal with fries and a drink?"
Customer: "Yes please"
You: "Brilliant! For your fries, upgrade to Peri Peri Chips (+50p), Cheesy Chips (+£1), Curly Fries (+£1), or stick with Classic Fries?"
Customer: "Peri chips please"
You: "Excellent! Add any salad? Lettuce, tomato, onion, cucumber - all included!"
Customer: "Lettuce and tomato"
You: "Perfect! Want a sauce for 50p? BBQ, Garlic, Mayo, Ketchup, Chilli, Peri Peri, Burger Sauce, or Blue Cheese?"
Customer: "BBQ please"
You: "Great choice! Which drink? Coke, Diet Coke, Pepsi, 7Up, Dr Pepper, Coke Zero, Tango Orange, Rio, or Water?"
Customer: "Tango Orange"
You: *call create_meal_deal(main_item_id: "cheese_job", side_item_id: "peri_chips", drink_item_id: "drink_tango_orange", salad: ["lettuce", "tomato"], sauce_item_id: "dip_bbq")* "Perfect! Your Cheese Job Meal with Peri Peri Chips, Tango Orange, salad, and BBQ sauce is ready!"

PRICING REFERENCE FOR MEAL DEALS:
- Base meal: Main item price + £1.50 (drink)
- Side upgrades: Peri chips +£0.50, Cheesy/Curly +£1.00, Classic fries +£0.00
- Salad: FREE (always included)
- Sauce: +£0.50

${session.checkoutMode ? `
CHECKOUT MODE ACTIVE:
You are now collecting customer delivery information conversationally through chat.

SMART COLLECTION STRATEGY:
1. If customer provides ALL info in one message (name + address + phone + time), use parse_and_collect_customer_info function
2. If customer provides info piecemeal, ask for missing fields one at a time
3. Required: name, full address (with postcode), phone, delivery time
4. Optional: email, special instructions
5. After collecting ALL required info, tell user: "Perfect! All set. Click the 'Click to Pay' button below to complete your order."

Current customer information:
- Name: ${session.customerInfo?.name || 'Not collected'}
- Address: ${session.customerInfo?.address || 'Not collected'}
- Phone: ${session.customerInfo?.phone || 'Not collected'}
- Email: ${session.customerInfo?.email || 'Optional - not collected'}
- Delivery Time: ${session.customerInfo?.deliveryTime || 'Not collected'}
- Notes: ${session.customerInfo?.notes || 'Optional - not collected'}

IMPORTANT: If customer provides multiple pieces of info at once (e.g., "Jake, 19 Walled Meadow, Andover, SP10 2RG, 07553410573, 3:30 PM"), use parse_and_collect_customer_info function with their complete message.
` : ''}

Available allergens: ${Array.from(ALL_ALLERGENS).join(', ')}

COMPLETE MENU:
${JSON.stringify(getMenuForAI(), null, 2)}

${session.allergyRestrictions.length > 0 ? `\nCUSTOMER ALLERGENS TO AVOID: ${session.allergyRestrictions.join(', ')}` : ''}
${session.dietaryPreferences.length > 0 ? `\nCUSTOMER DIETARY PREFERENCES: ${session.dietaryPreferences.join(', ')}` : ''}
`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...session.conversationHistory,
    { role: 'user', content: userMessage }
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
        functions,
        function_call: 'auto',
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const choice = data.choices[0];
    
    let assistantReply = '';
    let updatedSession = { ...session, conversationHistory: [...session.conversationHistory] };

    if (choice.message.function_call) {
      const functionName = choice.message.function_call.name;
      const functionArgs = JSON.parse(choice.message.function_call.arguments || '{}');

      const functionResult = executeFunctionCall(functionName, functionArgs, updatedSession);
      updatedSession = functionResult.session;

      updatedSession.conversationHistory.push(
        { role: 'user', content: userMessage },
        { role: 'function', name: functionName, content: JSON.stringify(functionResult.result) }
      );

      // Get natural language response
      const followUpResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            ...updatedSession.conversationHistory
          ],
          temperature: 0.7,
          max_tokens: 300
        })
      });

      if (followUpResponse.ok) {
        const followUpData = await followUpResponse.json();
        assistantReply = followUpData.choices[0].message.content || 'Done!';
      } else {
        assistantReply = 'Done!';
      }
    } else {
      assistantReply = choice.message.content || 'I can help you order from our menu!';
      updatedSession.conversationHistory.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: assistantReply }
      );
    }

    if (updatedSession.conversationHistory.length > 20) {
      updatedSession.conversationHistory = updatedSession.conversationHistory.slice(-20);
    }

    return {
      reply: assistantReply,
      session: updatedSession
    };

  } catch (error: any) {
    console.error('OpenAI Error:', error);
    return {
      reply: "I apologize, I'm having trouble processing that right now. Could you try again?",
      session
    };
  }
}
