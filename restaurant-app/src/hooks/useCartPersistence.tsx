import { useEffect, useCallback } from 'react';
import { CartItem } from '../openaiService';

const CART_STORAGE_KEY = 'syra_cart_backup';
const CART_TIMESTAMP_KEY = 'syra_cart_timestamp';
const CART_EXPIRY_HOURS = 24;

export function useCartPersistence(cart: CartItem[]) {
  // Save cart to localStorage
  const saveCart = useCallback(() => {
    try {
      if (cart.length > 0) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        localStorage.setItem(CART_TIMESTAMP_KEY, new Date().toISOString());
      } else {
        localStorage.removeItem(CART_STORAGE_KEY);
        localStorage.removeItem(CART_TIMESTAMP_KEY);
      }
    } catch (error) {
      console.error('Failed to save cart:', error);
    }
  }, [cart]);

  // Load cart from localStorage
  const loadCart = useCallback((): CartItem[] | null => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      const timestamp = localStorage.getItem(CART_TIMESTAMP_KEY);

      if (!savedCart || !timestamp) return null;

      // Check if cart has expired
      const savedTime = new Date(timestamp);
      const now = new Date();
      const hoursDiff = (now.getTime() - savedTime.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > CART_EXPIRY_HOURS) {
        localStorage.removeItem(CART_STORAGE_KEY);
        localStorage.removeItem(CART_TIMESTAMP_KEY);
        return null;
      }

      return JSON.parse(savedCart);
    } catch (error) {
      console.error('Failed to load cart:', error);
      return null;
    }
  }, []);

  // Clear cart from storage
  const clearCart = useCallback(() => {
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(CART_TIMESTAMP_KEY);
  }, []);

  // Auto-save cart when it changes
  useEffect(() => {
    saveCart();
  }, [saveCart]);

  return { loadCart, clearCart, saveCart };
}
