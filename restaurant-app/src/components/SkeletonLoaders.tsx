import { motion } from 'framer-motion';

export function SkeletonMenuCard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="card-professional animate-pulse"
      role="status"
      aria-label="Loading menu item"
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-neutral-300/20 rounded-lg w-3/4"></div>
          <div className="h-4 bg-neutral-300/20 rounded-lg w-full"></div>
          <div className="h-4 bg-neutral-300/20 rounded-lg w-5/6"></div>
          <div className="flex gap-2 mt-2">
            <div className="h-6 w-20 bg-neutral-300/20 rounded-full"></div>
            <div className="h-6 w-20 bg-neutral-300/20 rounded-full"></div>
          </div>
        </div>
        <div className="h-8 w-20 bg-neutral-300/20 rounded-lg"></div>
      </div>
    </motion.div>
  );
}

export function SkeletonCartItem() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="card-professional animate-pulse"
      role="status"
      aria-label="Loading cart item"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="h-5 bg-neutral-300/20 rounded-lg w-1/2"></div>
        <div className="h-6 bg-neutral-300/20 rounded-lg w-20"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-neutral-300/20 rounded-lg w-3/4"></div>
        <div className="h-4 bg-neutral-300/20 rounded-lg w-1/2"></div>
      </div>
    </motion.div>
  );
}

export function SkeletonMessage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
      role="status"
      aria-label="Loading message"
    >
      <div className="max-w-[85%] glass-professional p-4 rounded-3xl border border-white/20 animate-pulse">
        <div className="space-y-2">
          <div className="h-4 bg-neutral-300/20 rounded w-48"></div>
          <div className="h-4 bg-neutral-300/20 rounded w-40"></div>
          <div className="h-4 bg-neutral-300/20 rounded w-32"></div>
        </div>
      </div>
    </motion.div>
  );
}

export function SkeletonProgress({ progress }: { progress: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-2 bg-neutral-300/20 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary-500 to-accent-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <p className="text-xs text-neutral-light text-center mt-2">{progress}% complete</p>
    </motion.div>
  );
}
