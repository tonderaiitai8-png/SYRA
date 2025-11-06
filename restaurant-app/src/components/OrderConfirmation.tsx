import { useEffect, useState } from 'react';
import { CheckCircle, Package, Clock, MapPin, Phone, Mail, ArrowRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';

interface OrderConfirmationProps {
  onClose: () => void;
}

export function OrderConfirmation({ onClose }: OrderConfirmationProps) {
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    // Parse order details from URL parameters or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    
    if (success === 'true') {
      // Get order details from localStorage (saved before redirect)
      const savedOrder = localStorage.getItem('pendingOrder');
      if (savedOrder) {
        setOrderDetails(JSON.parse(savedOrder));
        // Clear the pending order
        localStorage.removeItem('pendingOrder');
      }
    }
  }, []);

  const estimatedDeliveryTime = () => {
    const now = new Date();
    const deliveryTime = new Date(now.getTime() + 45 * 60000); // Add 45 minutes
    return deliveryTime.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25 }}
        className="max-w-2xl w-full glass-professional p-8 rounded-3xl border border-white/20 max-h-[90vh] overflow-y-auto smooth-scroll"
      >
        {/* Success Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', damping: 15 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-accent-500/20 rounded-full mb-4"
          >
            <CheckCircle className="w-12 h-12 text-accent-500" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-primary mb-2"
          >
            Order Confirmed!
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-neutral-light"
          >
            Thank you for your order. Your delicious meal is being prepared!
          </motion.p>
        </div>

        {/* Order Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-6"
        >
          {/* Estimated Delivery */}
          <div className="card-professional">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-primary-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-neutral mb-1">Estimated Delivery</h3>
                <p className="text-2xl font-bold text-primary">{estimatedDeliveryTime()}</p>
                <p className="text-xs text-neutral-light mt-1">Approximately 40-50 minutes</p>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          {orderDetails?.customerInfo && (
            <div className="card-professional space-y-4">
              <h3 className="font-semibold text-neutral flex items-center gap-2">
                <Package className="w-5 h-5 text-primary-500" />
                Delivery Information
              </h3>
              
              <div className="space-y-3 text-sm">
                {orderDetails.customerInfo.name && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-neutral-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-neutral-light">
                        {orderDetails.customerInfo.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-neutral-light text-xs">Name</p>
                      <p className="text-neutral font-medium">{orderDetails.customerInfo.name}</p>
                    </div>
                  </div>
                )}
                
                {orderDetails.customerInfo.address && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-neutral-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-neutral-light" />
                    </div>
                    <div>
                      <p className="text-neutral-light text-xs">Delivery Address</p>
                      <p className="text-neutral font-medium">{orderDetails.customerInfo.address}</p>
                    </div>
                  </div>
                )}
                
                {orderDetails.customerInfo.phone && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-neutral-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 text-neutral-light" />
                    </div>
                    <div>
                      <p className="text-neutral-light text-xs">Phone</p>
                      <p className="text-neutral font-medium">{orderDetails.customerInfo.phone}</p>
                    </div>
                  </div>
                )}
                
                {orderDetails.customerInfo.email && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-neutral-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-neutral-light" />
                    </div>
                    <div>
                      <p className="text-neutral-light text-xs">Email</p>
                      <p className="text-neutral font-medium">{orderDetails.customerInfo.email}</p>
                    </div>
                  </div>
                )}
                
                {orderDetails.customerInfo.notes && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-neutral-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-neutral-light">Note</span>
                    </div>
                    <div>
                      <p className="text-neutral-light text-xs">Special Instructions</p>
                      <p className="text-neutral font-medium">{orderDetails.customerInfo.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Items */}
          {orderDetails?.cart && orderDetails.cart.length > 0 && (
            <div className="card-professional">
              <h3 className="font-semibold text-neutral mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary-500" />
                Your Order
              </h3>
              
              <div className="space-y-2 text-sm">
                {orderDetails.cart.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-start py-2 border-b border-white/10 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-neutral">{item.name}</p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-neutral-light">Quantity: {item.quantity}</p>
                      )}
                    </div>
                    <p className="font-semibold text-primary">
                      £{item.totalPrice.toFixed(2)}
                    </p>
                  </div>
                ))}
                
                <div className="flex justify-between items-center pt-4 border-t-2 border-primary-500/20">
                  <span className="font-bold text-neutral">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    £{orderDetails.cart.reduce((sum: number, item: any) => sum + item.totalPrice, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="card-professional bg-gradient-to-r from-primary-500/10 to-accent-500/10">
            <h3 className="font-semibold text-neutral mb-3">What Happens Next?</h3>
            <ul className="space-y-2 text-sm text-neutral-light">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-accent-500 flex-shrink-0 mt-0.5" />
                <span>You will receive an email confirmation shortly</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-accent-500 flex-shrink-0 mt-0.5" />
                <span>Our kitchen is preparing your order with care</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-accent-500 flex-shrink-0 mt-0.5" />
                <span>Our driver will deliver to your address shortly</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-accent-500 flex-shrink-0 mt-0.5" />
                <span>You can call us if you need any changes</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 btn-primary group flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Back to Home
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
