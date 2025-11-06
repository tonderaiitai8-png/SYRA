import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  touched?: boolean;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  pattern?: string;
  autoComplete?: string;
}

export function InputField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  placeholder,
  required,
  maxLength,
  pattern,
  autoComplete,
}: InputFieldProps) {
  const hasError = touched && error;
  const isValid = touched && !error && value.length > 0;

  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className="block text-sm font-semibold text-neutral"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      
      <div className="relative">
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          maxLength={maxLength}
          pattern={pattern}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? `${name}-error` : undefined}
          className={`input-professional pr-10 transition-all duration-200 ${
            hasError
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : isValid
              ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
              : ''
          }`}
        />
        
        {isValid && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <Check className="w-5 h-5 text-green-500" aria-hidden="true" />
          </motion.div>
        )}
      </div>

      {maxLength && (
        <div className="text-xs text-neutral-light text-right">
          {value.length}/{maxLength}
        </div>
      )}

      {hasError && (
        <motion.p
          id={`${name}-error`}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-500"
          role="alert"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
