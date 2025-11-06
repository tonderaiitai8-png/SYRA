import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface NetworkStatusProps {
  onRetry?: () => void;
}

export function NetworkStatus({ onRetry }: NetworkStatusProps) {
  const { isOnline, wasOffline } = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 glass-professional px-6 py-4 rounded-2xl border border-red-500/30 bg-red-500/10 backdrop-blur-xl shadow-xl"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center gap-4">
            <WifiOff className="w-5 h-5 text-red-500" aria-hidden="true" />
            <div>
              <p className="font-semibold text-red-500">No Internet Connection</p>
              <p className="text-xs text-neutral-light">Some features may be unavailable</p>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="btn-professional ml-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 flex items-center gap-2 active:scale-95"
                aria-label="Retry connection"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            )}
          </div>
        </motion.div>
      )}
      {isOnline && wasOffline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ delay: 0.2 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 glass-professional px-6 py-4 rounded-2xl border border-green-500/30 bg-green-500/10 backdrop-blur-xl shadow-xl"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            <Wifi className="w-5 h-5 text-green-500" aria-hidden="true" />
            <p className="font-semibold text-green-500">Back Online</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
