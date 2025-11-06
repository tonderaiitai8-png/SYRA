import { useState, useCallback } from 'react';

interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  onRetry?: (attempt: number) => void;
}

export function useRetry<T>(
  asyncFunction: () => Promise<T>,
  options: RetryOptions = {}
) {
  const { maxAttempts = 3, delay = 1000, onRetry } = options;
  const [isRetrying, setIsRetrying] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  const execute = useCallback(
    async (currentAttempt = 0): Promise<T> => {
      try {
        setAttemptCount(currentAttempt);
        const result = await asyncFunction();
        setIsRetrying(false);
        setAttemptCount(0);
        return result;
      } catch (error) {
        if (currentAttempt < maxAttempts - 1) {
          setIsRetrying(true);
          if (onRetry) {
            onRetry(currentAttempt + 1);
          }
          await new Promise((resolve) => setTimeout(resolve, delay * (currentAttempt + 1)));
          return execute(currentAttempt + 1);
        } else {
          setIsRetrying(false);
          setAttemptCount(0);
          throw error;
        }
      }
    },
    [asyncFunction, maxAttempts, delay, onRetry]
  );

  return { execute, isRetrying, attemptCount };
}
