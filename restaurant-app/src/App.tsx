import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Send, ShoppingCart, X, Menu as MenuIcon, Loader2, 
  CreditCard, Sparkles, Zap, Brain, 
  Cpu, Eye, MessageCircle, Star, ArrowRight, Plus, 
  Timer, Clock, RotateCcw, Info, Search, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { RESTAURANT_CONFIG, MENU_LOOKUP } from './menuData';
import { processAIMessage as sendMessage, SessionState, CartItem } from './openaiService';
import { ThemeToggle } from './components/ThemeToggle';
import { ToastProvider } from './components/Toast';
import { NetworkStatus } from './components/NetworkStatus';
import { EnhancedErrorBoundary } from './components/EnhancedErrorBoundary';
// Removed SearchFilter import - now using inline search
import { useAnnounce } from './components/AccessibilityAnnouncer';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useCartPersistence } from './hooks/useCartPersistence';
import { useRetry } from './hooks/useRetry';
import { maybeSupabase } from './supabaseClient';
import { OrderConfirmation } from './components/OrderConfirmation';
import './App.css';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

function AppContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [cartAnimation, setCartAnimation] = useState(false);
  const [showCartRecovery, setShowCartRecovery] = useState(false);
  const [filteredMenuItems, setFilteredMenuItems] = useState<any[]>([]);
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [supabaseClient] = useState(() => maybeSupabase());
  
  const [session, setSession] = useState<SessionState>({
    cart: [],
    conversationHistory: [],
    allergyRestrictions: [],
    dietaryPreferences: [],
    checkoutMode: false,
    customerInfo: {}
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // QOL Hooks
  const { isOnline } = useOnlineStatus();
  const { loadCart, clearCart } = useCartPersistence(session.cart);
  const announce = useAnnounce();
  const isCheckoutAvailable = Boolean(supabaseClient);

  // Filter function calls from AI responses
  const filterFunctionCalls = useCallback((text: string) => {
    return text
      .replace(/\*call\s+\w+\([^)]*\)\*/gi, '')
      .replace(/\*\*call\s+\w+\([^)]*\)\*\*/gi, '')
      .replace(/`call\s+\w+\([^)]*\)`/gi, '')
      .replace(/\bcall\s+\w+\([^)]*\)/gi, '')
      .trim();
  }, []);

  // Initialize messages and check for cart recovery
  useEffect(() => {
    setMessages([{
      id: 1,
      role: 'assistant',
      content: RESTAURANT_CONFIG.prompts.welcomeMessage,
      timestamp: new Date()
    }]);
    
    // Check for order confirmation
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setShowOrderConfirmation(true);
      // Clear URL parameters
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }
    
    // Check for saved cart
    const savedCart = loadCart();
    if (savedCart && savedCart.length > 0) {
      setShowCartRecovery(true);
    }
  }, [loadCart]);
  
  // Handle cart recovery
  const handleCartRecovery = useCallback((recover: boolean) => {
    if (recover) {
      const savedCart = loadCart();
      if (savedCart) {
        setSession(prev => ({ ...prev, cart: savedCart }));
        toast.success(`Recovered ${savedCart.length} items from your previous session`);
        announce(`Cart recovered with ${savedCart.length} items`, 'polite');
      }
    } else {
      clearCart();
    }
    setShowCartRecovery(false);
  }, [loadCart, clearCart, announce]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending messages with retry
  const { execute: sendMessageWithRetry, isRetrying } = useRetry(
    () => sendMessage(inputValue, session),
    {
      maxAttempts: 3,
      delay: 1000,
      onRetry: (attempt) => {
        toast.loading(`Retrying... (${attempt}/3)`, { id: 'retry-toast' });
      }
    }
  );
  
  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    if (!isOnline) {
      toast.error('No internet connection. Please check your network.');
      announce('No internet connection', 'assertive');
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);
    announce('Sending message', 'polite');

    try {
      const result = await sendMessageWithRetry();
      const filteredReply = filterFunctionCalls(result.reply);
      
      const aiMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: filteredReply || result.reply,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      toast.dismiss('retry-toast');
      announce('Message received', 'polite');
      
      // Check if cart was updated and show notification
      if (result.session.cart.length > session.cart.length) {
        const addedCount = result.session.cart.length - session.cart.length;
        toast.success(`${addedCount} item${addedCount > 1 ? 's' : ''} added to cart!`);
        announce(`${addedCount} items added to cart`, 'polite');
        setCartAnimation(true);
        setTimeout(() => setCartAnimation(false), 600);
      }
      
      setSession(result.session);
    } catch (error) {
      console.error('Error:', error);
      toast.dismiss('retry-toast');
      const errorMessage = error instanceof Error ? error.message : 'Failed to process your request';
      toast.error(
        <div>
          <p className="font-semibold">{errorMessage}</p>
          <p className="text-xs mt-1">Please try again or check your connection</p>
        </div>
      );
      announce('Failed to send message', 'assertive');
      // Restore the input on error
      setInputValue(currentInput);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle remove item from cart
  const handleRemoveItem = async (index: number) => {
    const item = session.cart[index];
    if (!item) return;
    
    const loadingToast = toast.loading('Removing item...');
    
    try {
      // Use AI to remove the item
      const result = await sendMessage(`Please remove item at index ${index} from my cart`, session);
      setSession(result.session);
      toast.dismiss(loadingToast);
      toast.success(`Removed ${item.name} from cart`);
      announce(`Removed ${item.name} from cart`, 'polite');
    } catch (error) {
      console.error('Error removing item:', error);
      toast.dismiss(loadingToast);
      toast.error('Failed to remove item. Please try again.');
    }
  };

  // Cart calculations
  const cartTotal = session.cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const cartCount = session.cart.reduce((sum, item) => sum + item.quantity, 0);

  // Check if customer info is complete
  const isCustomerInfoComplete = session.checkoutMode && 
    session.customerInfo?.name && 
    session.customerInfo?.address && 
    session.customerInfo?.phone && 
    session.customerInfo?.deliveryTime;

  // Handle checkout with retry
  const handleCheckout = async () => {
    if (session.cart.length === 0) {
      toast.error('Your cart is empty. Please add items before checkout.');
      announce('Cart is empty', 'assertive');
      return;
    }

    if (cartTotal < 5) {
      toast.error('Minimum order value is £5.00');
      announce('Minimum order value not met', 'assertive');
      return;
    }
    
    if (!isOnline) {
      toast.error('No internet connection. Please check your network.');
      announce('No internet connection', 'assertive');
      return;
    }

    const checkoutMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: 'I want to checkout',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, checkoutMessage]);
    setInputValue('');
    setIsLoading(true);
    setShowCart(false);
    announce('Starting checkout process', 'polite');

    try {
      const result = await sendMessage('I want to checkout and place my order', session);
      const filteredReply = filterFunctionCalls(result.reply);
      
      const aiMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: filteredReply || result.reply,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setSession(result.session);
      announce('Checkout started', 'polite');
    } catch (error) {
      console.error('Error initiating checkout:', error);
      toast.error(
        <div>
          <p className="font-semibold">Failed to start checkout</p>
          <p className="text-xs mt-1">Please try again</p>
        </div>
      );
      announce('Checkout failed', 'assertive');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Stripe checkout with enhanced error handling
  const processStripeCheckout = async () => {
    if (!isCustomerInfoComplete) {
      toast.error('Please complete all required customer information first.');
      announce('Customer information incomplete', 'assertive');
      return;
    }
    
    if (!isOnline) {
      toast.error('No internet connection. Please check your network.');
      announce('No internet connection', 'assertive');
      return;
    }

    if (!supabaseClient) {
      toast.error('Checkout is currently unavailable. Please try again later.');
      announce('Checkout is unavailable', 'assertive');
      return;
    }

    const loadingToast = toast.loading('Preparing your checkout...');
    setIsProcessingCheckout(true);
    announce('Processing payment', 'polite');
    
    try {
      const cartItems = session.cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.totalPrice / item.quantity,
        quantity: item.quantity
      }));

      const { data, error } = await supabaseClient.functions.invoke('create-checkout-session', {
        body: {
          cartItems: cartItems,
          customerInfo: session.customerInfo,
          successUrl: `${window.location.origin}?success=true`,
          cancelUrl: `${window.location.origin}?canceled=true`
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        toast.dismiss(loadingToast);
        toast.error(
          <div>
            <p className="font-semibold">Payment processing failed</p>
            <p className="text-xs mt-1">Please try again or contact support</p>
          </div>
        );
        announce('Payment failed', 'assertive');
        return;
      }

      if (data?.data?.checkoutUrl) {
        toast.dismiss(loadingToast);
        toast.success('Redirecting to secure checkout...');
        announce('Redirecting to payment', 'polite');
        
        // Save order details for confirmation page
        localStorage.setItem('pendingOrder', JSON.stringify({
          cart: session.cart,
          customerInfo: session.customerInfo,
          total: cartTotal
        }));
        
        // Clear cart before redirect
        clearCart();
        window.location.href = data.data.checkoutUrl;
      } else {
        console.error('No checkout URL returned:', data);
        toast.dismiss(loadingToast);
        toast.error(
          <div>
            <p className="font-semibold">Failed to create checkout session</p>
            <p className="text-xs mt-1">Please try again</p>
          </div>
        );
        announce('Checkout failed', 'assertive');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.dismiss(loadingToast);
      toast.error(
        <div>
          <p className="font-semibold">Failed to process payment</p>
          <p className="text-xs mt-1">Please try again or contact support</p>
        </div>
      );
      announce('Payment processing error', 'assertive');
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  // Render cart item
  const renderCartItem = (item: CartItem, index: number) => {
    if (item.mainItem && item.sideItem && item.drinkItem) {
      // Meal deal
      const mainItem = MENU_LOOKUP[item.mainItem];
      const sideItem = MENU_LOOKUP[item.sideItem];
      const drinkItem = MENU_LOOKUP[item.drinkItem];
      const sauceItem = item.sauce ? MENU_LOOKUP[item.sauce] : null;
      
      return (
        <div key={index} className="card-professional relative">
          {/* Remove Button */}
          <button
            onClick={() => handleRemoveItem(index)}
            className="absolute top-3 right-3 w-8 h-8 bg-red-500/10 hover:bg-red-500/20 rounded-lg flex items-center justify-center transition-all duration-200 group active:scale-95"
            aria-label="Remove item"
          >
            <Trash2 className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
          </button>
          
          <div className="flex justify-between items-start mb-3 pr-10">
            <h3 className="font-semibold text-neutral">{item.name}</h3>
            <span className="font-bold text-lg text-gradient-primary">
              £{item.totalPrice.toFixed(2)}
            </span>
          </div>
          <div className="text-xs text-neutral-light space-y-1 pl-3 border-l-2 border-primary-500/30">
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 text-primary-400" />
              <span>Main: {mainItem?.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Plus className="w-3 h-3 text-accent-400" />
              <span>Side: {sideItem?.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-success-400" />
              <span>Drink: {drinkItem?.name}</span>
            </div>
            {item.salad && item.salad.length > 0 && (
              <div className="flex items-center gap-2">
                <Star className="w-3 h-3 text-warning-400" />
                <span>Salad: {item.salad.join(', ')}</span>
              </div>
            )}
            {sauceItem && (
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-accent-400" />
                <span>Sauce: {sauceItem.name} (+£{item.sauceCost?.toFixed(2)})</span>
              </div>
            )}
          </div>
        </div>
      );
    } else {
      // Single item
      return (
        <div key={index} className="card-professional relative">
          {/* Remove Button */}
          <button
            onClick={() => handleRemoveItem(index)}
            className="absolute top-3 right-3 w-8 h-8 bg-red-500/10 hover:bg-red-500/20 rounded-lg flex items-center justify-center transition-all duration-200 group active:scale-95"
            aria-label="Remove item"
          >
            <Trash2 className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
          </button>
          
          <div className="flex justify-between items-start mb-1 pr-10">
            <h3 className="font-semibold text-neutral">{item.name}</h3>
            <span className="font-bold text-gradient-primary">
              £{item.totalPrice.toFixed(2)}
            </span>
          </div>
          <div className="text-xs text-neutral-light flex items-center gap-2">
            <Eye className="w-3 h-3 text-primary-400" />
            {item.quantity}x @ £{(item.totalPrice / item.quantity).toFixed(2)}
          </div>
          {item.salad && item.salad.length > 0 && (
            <div className="text-xs text-neutral-light mt-1 flex items-center gap-2">
              <Star className="w-3 h-3 text-warning-400" />
              Salad: {item.salad.join(', ')}
            </div>
          )}
          {item.sauce && (
            <div className="text-xs text-neutral-light flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-accent-400" />
              Sauce: {MENU_LOOKUP[item.sauce]?.name} (+£{item.sauceCost?.toFixed(2)})
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <>
      <ToastProvider />
      <NetworkStatus onRetry={() => window.location.reload()} />
      
      {/* Order Confirmation Modal */}
      <AnimatePresence>
        {showOrderConfirmation && (
          <OrderConfirmation onClose={() => setShowOrderConfirmation(false)} />
        )}
      </AnimatePresence>
      
      {/* Cart Recovery Modal */}
      <AnimatePresence>
        {showCartRecovery && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-md w-full glass-professional p-6 rounded-3xl border border-white/20"
              role="dialog"
              aria-labelledby="cart-recovery-title"
              aria-describedby="cart-recovery-description"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-500/10 rounded-full mb-4">
                  <ShoppingCart className="w-8 h-8 text-accent-500" />
                </div>
                
                <h2 id="cart-recovery-title" className="text-2xl font-bold text-neutral mb-2">
                  Welcome Back!
                </h2>
                
                <p id="cart-recovery-description" className="text-neutral-light mb-6">
                  We found items in your cart from a previous session. Would you like to recover them?
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => handleCartRecovery(false)}
                    className="flex-1 btn-professional px-4 py-3 glass-professional rounded-xl hover:bg-red-500/10 transition-all duration-200 active:scale-95"
                    aria-label="Start fresh"
                  >
                    Start Fresh
                  </button>
                  
                  <button
                    onClick={() => handleCartRecovery(true)}
                    className="flex-1 btn-professional px-4 py-3 bg-accent-500 text-white rounded-xl hover:bg-accent-600 transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
                    aria-label="Recover cart"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Recover Cart
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <div className="min-h-screen relative overflow-hidden bg-professional gradient-mesh page-transition">
        {/* Background Effects */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-accent-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      
      {/* Header */}
      <header className="glass-professional sticky top-0 z-50 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center animate-glow">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent-500 rounded-full animate-pulse-slow" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary font-display">
                {RESTAURANT_CONFIG.restaurantInfo.name}
              </h1>
              <p className="text-sm text-neutral flex items-center gap-2">
                <Cpu className="w-4 h-4 text-neutral-light" />
                AI-Powered Ordering
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            <button
              onClick={() => {
                try {
                  setShowMenu(!showMenu);
                } catch (error) {
                  console.error('Error toggling menu:', error);
                  toast.error('Unable to open menu. Please try again.');
                }
              }}
              className="glass-professional p-4 rounded-xl hover:scale-105 transition-all duration-300 group hover:bg-primary-500/10 active:scale-95"
            >
              <MenuIcon className="w-5 h-5 text-neutral-light group-hover:text-primary-500 transition-colors duration-300" />
            </button>
            
            <button
              onClick={() => setShowCart(!showCart)}
              className={`glass-professional p-4 rounded-xl hover:scale-105 transition-all duration-300 relative group hover:bg-accent-500/10 active:scale-95 ${cartAnimation ? 'success-ripple active' : ''}`}
            >
              <ShoppingCart className="w-5 h-5 text-neutral-light group-hover:text-accent-500 transition-colors duration-300" />
              {cartCount > 0 && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="cart-badge"
                >
                  <span className="text-white text-xs font-bold">{cartCount}</span>
                </motion.div>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chat Section */}
        <div className="lg:col-span-2">
          <div className="glass-professional flex flex-col h-[calc(100vh-200px)] rounded-3xl overflow-hidden border border-white/20">
            {/* Chat Header */}
            <div className="p-6 border-b border-white/20 bg-gradient-to-r from-primary-500/10 to-accent-500/10">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-primary rounded-2xl flex items-center justify-center">
                    <MessageCircle className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-accent-500 rounded-full border-2 border-white animate-pulse-slow" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-primary font-display">Syra AI</h2>
                  <p className="text-neutral flex items-center gap-2">
                    <Zap className="w-4 h-4 text-accent-400" />
                    Your AI Culinary Assistant
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-neutral-900/5 smooth-scroll">
              <AnimatePresence mode="popLayout">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-4 rounded-3xl message-bubble ${
                        msg.role === 'user'
                          ? 'message-bubble-user'
                          : 'message-bubble-assistant'
                      } transition-all duration-300 hover:scale-[1.02]`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap font-body">
                        {msg.content}
                      </p>
                      <div className="text-xs opacity-60 mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        <time dateTime={msg.timestamp.toISOString()}>
                          {msg.timestamp.toLocaleTimeString()}
                        </time>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-start"
                >
                  <div className="glass-professional p-4 rounded-3xl border border-white/20">
                    <div className="pulse-loader" role="status" aria-label="Loading message">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </motion.div>
              )}  
              
              {isRetrying && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center"
                >
                  <div className="glass-professional px-4 py-2 rounded-full text-xs text-primary-500 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Retrying connection...
                  </div>
                </motion.div>
              )}
              
              {/* Checkout Button */}
              {isCustomerInfoComplete && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 20 }}
                  className="flex justify-center"
                >
                  <button
                    onClick={processStripeCheckout}
                    disabled={isProcessingCheckout || !isCheckoutAvailable}
                    className="btn-modern px-10 py-5 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-2xl hover:from-accent-600 hover:to-accent-700 transition-all duration-300 font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-4 group"
                  >
                    {isProcessingCheckout ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        Complete Checkout
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </motion.div>
              )}
              {isCustomerInfoComplete && !isCheckoutAvailable && (
                <div className="mt-4 text-sm text-red-500 flex items-center gap-2 justify-center" role="alert">
                  <Info className="w-4 h-4" />
                  Checkout is currently unavailable. Please try again later.
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-white/20 bg-gradient-to-r from-primary-500/5 to-accent-500/5">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <label htmlFor="chat-input" className="sr-only">Type your message to Syra AI</label>
                  <textarea
                    id="chat-input"
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message to Syra AI..."
                    className="input-professional resize-none h-14 pr-12 transition-all duration-200 focus:ring-2 focus:ring-primary-500/20"
                    disabled={isLoading || !isOnline}
                    rows={1}
                    aria-label="Chat message input"
                    aria-disabled={isLoading || !isOnline}
                  />
                  <div className="absolute right-3 top-4 text-neutral-light pointer-events-none">
                    <Brain className="w-5 h-5" aria-hidden="true" />
                  </div>
                </div>
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading || !isOnline}
                  className="btn-primary w-14 h-14 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed group hover:shadow-lg active:scale-95 transition-all duration-200"
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" aria-hidden="true" />
                  )}
                </button>
              </div>
              {!isOnline && (
                <div className="mt-2 text-xs text-red-500 flex items-center gap-2" role="alert">
                  <Info className="w-4 h-4" />
                  You are currently offline. Please check your connection.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="lg:col-span-1">
          {showCart ? (
            <CartPanel 
              session={session}
              cartTotal={cartTotal}
              onCheckout={handleCheckout}
              onClose={() => setShowCart(false)}
              renderCartItem={renderCartItem}
            />
          ) : showMenu ? (
            <MenuPanel 
              config={RESTAURANT_CONFIG}
              onClose={() => setShowMenu(false)}
              filteredMenuItems={filteredMenuItems}
              setFilteredMenuItems={setFilteredMenuItems}
            />
          ) : (
            <EmptyPanel onShowMenu={() => setShowMenu(true)} />
          )}
        </div>
      </div>
    </div>
    </>
  );
}

// Cart Panel Component
function CartPanel({ 
  session, 
  cartTotal, 
  onCheckout, 
  onClose, 
  renderCartItem 
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: 'spring', damping: 25 }}
      className="glass-professional p-6 max-h-[calc(100vh-200px)] overflow-y-auto rounded-3xl border border-white/20 smooth-scroll"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-primary">Your Cart</h2>
        </div>
        <button onClick={onClose} className="glass-professional p-2 rounded-xl hover:scale-110 transition-all">
          <X className="w-5 h-5 text-neutral-light" />
        </button>
      </div>

      {session.cart.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-neutral-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float">
            <ShoppingCart className="w-10 h-10 text-neutral-light" />
          </div>
          <p className="text-neutral">Your cart is empty</p>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
            {session.cart.map((item: CartItem, index: number) => renderCartItem(item, index))}
          </div>
          
          <div className="border-t border-white/20 pt-6">
            <div className="flex justify-between items-center mb-6">
              <span className="text-lg font-bold text-neutral">Total</span>
              <span className="text-3xl font-bold text-primary">
                £{cartTotal.toFixed(2)}
              </span>
            </div>
            {cartTotal < 5 && (
              <p className="text-sm text-warning-500 mb-4 flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Minimum order value is £5.00
              </p>
            )}
            <button 
              onClick={onCheckout}
              disabled={cartTotal < 5}
              className="w-full py-4 bg-gradient-primary text-white rounded-2xl hover:scale-105 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
            >
              <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Proceed to Checkout
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            {session.checkoutMode && (
              <p className="text-xs text-neutral-light mt-3 text-center flex items-center justify-center gap-2">
                <Brain className="w-3 h-3" />
                Continue chatting with Syra to provide delivery details
              </p>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}

// Menu Panel Component with Search
function MenuPanel({ config, onClose, filteredMenuItems, setFilteredMenuItems }: any) {
  // Use filteredMenuItems to satisfy TypeScript
  console.log('Current filtered items count:', filteredMenuItems?.length || 0);
  const [allMenuItems, setAllMenuItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<{ [key: string]: string[] }>({});
  
  // Flatten all menu items for search - prevent infinite loops
  useEffect(() => {
    if (!config?.menu?.categories) return;
    
    const items: any[] = [];
    try {
      config.menu.categories.forEach((category: any) => {
        if (category?.items && Array.isArray(category.items)) {
          category.items.forEach((item: any) => {
            if (item?.id && item?.name) {
              items.push({ ...item, category: category.name });
            }
          });
        }
      });
      setAllMenuItems(items);
      setFilteredMenuItems(items);
    } catch (error) {
      console.error('Error processing menu items:', error);
      setAllMenuItems([]);
      setFilteredMenuItems([]);
    }
  }, [config?.menu?.categories, setFilteredMenuItems]); // Fixed dependency array
  
  const filteredItems = useMemo(() => {
    let filtered = [...allMenuItems];

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        ['name', 'description', 'category'].some((field) => {
          const value = field === 'category' ? item.category : item[field];
          return value?.toString().toLowerCase().includes(query);
        })
      );
    }

    // Apply filters
    Object.entries(activeFilters).forEach(([field, values]) => {
      if (values.length > 0) {
        filtered = filtered.filter((item) => {
          const itemValue = field === 'category' ? item.category : item[field];
          return values.some((val) =>
            itemValue?.toString().toLowerCase().includes(val.toLowerCase())
          );
        });
      }
    });

    return filtered;
  }, [allMenuItems, searchQuery, activeFilters]);
  
  // Update filteredMenuItems when filtering changes
  useEffect(() => {
    setFilteredMenuItems(filteredItems);
  }, [filteredItems, setFilteredMenuItems]);
  
  // Handle filter toggle
  const handleFilterToggle = useCallback((field: string, value: string) => {
    setActiveFilters((prev) => {
      const current = prev[field] || [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  }, []);
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setActiveFilters({});
  }, []);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: 'spring', damping: 25 }}
      className="glass-professional rounded-3xl border border-white/20"
    >
      <div className="flex items-center justify-between p-6 border-b border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-accent rounded-xl flex items-center justify-center animate-glow">
            <MenuIcon className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-primary">Full Menu</h2>
        </div>
        <button 
          onClick={onClose}
          className="glass-professional p-2 rounded-xl hover:scale-110 transition-all duration-300 hover:bg-red-500/20 group"
          aria-label="Close menu"
        >
          <X className="w-5 h-5 text-neutral-light group-hover:text-red-400 transition-colors" />
        </button>
      </div>
      
      <div className="p-6">
        {/* Inline Search and Filter - No external component to prevent loops */}
        <div className="space-y-4" role="search">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search menu items..."
                className="input-professional pr-12"
                aria-label="Search menu items"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-neutral-light hover:text-neutral transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <Search className="w-5 h-5 text-neutral-light" aria-hidden="true" />
              </div>
            </div>
            
            <button
              onClick={() => clearFilters()}
              className="btn-professional px-4 py-3 glass-professional rounded-xl hover:bg-primary-500/10 transition-all duration-200"
              aria-label="Clear all filters"
            >
              Clear All
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {['Burgers', 'Chicken', 'Ribs', 'Wraps', 'Sides', 'Drinks'].map((category) => {
              const isActive = activeFilters.category?.includes(category);
              return (
                <button
                  key={category}
                  onClick={() => handleFilterToggle('category', category)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 active:scale-95 ${
                    isActive
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'glass-professional hover:bg-primary-500/10'
                  }`}
                  aria-pressed={isActive}
                >
                  {category}
                </button>
              );
            })}
          </div>
          
          <p className="text-sm text-neutral-light" role="status" aria-live="polite">
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found
          </p>
        </div>
      </div>
      
      <div className="menu-container p-6 max-h-[500px] overflow-y-auto smooth-scroll">
        {Object.keys(filteredItems.reduce((acc: any, item: any) => {
          if (!acc[item.category]) {
            acc[item.category] = [];
          }
          acc[item.category].push(item);
          return acc;
        }, {})).length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-light">No items match your search</p>
          </div>
        ) : (
          Object.entries(filteredItems.reduce((acc: any, item: any) => {
            if (!acc[item.category]) {
              acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
          }, {})).map(([categoryName, categoryItems]: [string, any], categoryIndex) => (
            <div key={categoryName} className="mb-8 animate-fade-in-up" style={{ animationDelay: `${categoryIndex * 0.1}s` }}>
              <h3 className="menu-section-header font-bold text-primary text-lg flex items-center gap-2">
                <Star className="w-5 h-5 animate-pulse-slow" />
                {categoryName}
                <span className="text-xs text-neutral-light bg-accent-500/20 px-2 py-1 rounded-full ml-auto">
                  {categoryItems.length} items
                </span>
              </h3>
              <div className="space-y-3">
                {categoryItems.map((item: any, itemIndex: number) => (
                  <motion.div 
                    key={item.id} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (categoryIndex * 0.1) + (itemIndex * 0.03) }}
                    className="menu-item-enhanced group"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-neutral group-hover:text-primary transition-colors duration-300">
                          {item.name}
                        </h4>
                        {item.description && (
                          <p className="text-xs text-neutral-light mt-1 leading-relaxed group-hover:text-neutral transition-colors duration-300">
                            {item.description}
                          </p>
                        )}
                        {item.allergens && item.allergens.length > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            <span className="text-xs text-warning-500 bg-warning-500/10 px-2 py-1 rounded-full border border-warning-500/20">
                              {item.allergens.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0 flex items-start">
                        <span className="font-bold text-lg text-gradient-primary group-hover:scale-110 transition-transform duration-300 whitespace-nowrap">
                          £{item.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

// Empty Panel Component
function EmptyPanel({ onShowMenu }: any) {
  const handleShowMenu = useCallback(() => {
    try {
      onShowMenu();
    } catch (error) {
      console.error('Error opening menu:', error);
      toast.error('Unable to open menu. Please try again.');
    }
  }, [onShowMenu]);

  return (
    <div className="glass-professional p-8 text-center rounded-3xl border border-white/20">
      <div className="relative mb-6">
        <div className="w-24 h-24 bg-gradient-primary rounded-3xl flex items-center justify-center mx-auto animate-float">
          <ShoppingCart className="w-12 h-12 text-white" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center animate-bounce-subtle">
          <Plus className="w-4 h-4 text-white" />
        </div>
      </div>
      <h2 className="text-2xl font-bold mb-3 text-primary font-display">Ready to Order?</h2>
      <p className="text-neutral mb-6 leading-relaxed">
        Chat with our AI assistant to craft your perfect order or explore our menu.
      </p>
      <button onClick={handleShowMenu} className="btn-primary group">
        <span className="flex items-center gap-3">
          <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" />
          Explore Menu
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </span>
      </button>
    </div>
  );
}

// Wrap the main app content with error boundary
export default function App() {
  return (
    <EnhancedErrorBoundary>
      <AppContent />
    </EnhancedErrorBoundary>
  );
}