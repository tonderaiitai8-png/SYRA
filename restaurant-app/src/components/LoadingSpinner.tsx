import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center gap-3"
    >
      <Loader2 className={`${sizeClasses[size]} text-primary-500 animate-spin`} />
      {text && <p className="text-sm text-neutral-light animate-pulse">{text}</p>}
    </motion.div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card-professional animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="h-4 bg-neutral-300/20 rounded-lg w-3/4 mb-2"></div>
          <div className="h-3 bg-neutral-300/20 rounded-lg w-full mb-1"></div>
          <div className="h-3 bg-neutral-300/20 rounded-lg w-5/6"></div>
        </div>
        <div className="h-6 w-16 bg-neutral-300/20 rounded-lg ml-3"></div>
      </div>
    </div>
  );
}
