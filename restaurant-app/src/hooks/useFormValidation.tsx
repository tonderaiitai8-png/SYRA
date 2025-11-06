import { useState, useCallback } from 'react';

interface ValidationRule {
  required?: boolean;
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  custom?: (value: string) => string | null;
}

interface ValidationRules {
  [key: string]: ValidationRule;
}

export function useFormValidation(rules: ValidationRules) {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const validateField = useCallback(
    (name: string, value: string): string | null => {
      const rule = rules[name];
      if (!rule) return null;

      if (rule.required && !value.trim()) {
        return 'This field is required';
      }

      if (rule.minLength && value.length < rule.minLength) {
        return `Minimum ${rule.minLength} characters required`;
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        return `Maximum ${rule.maxLength} characters allowed`;
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        return 'Invalid format';
      }

      if (rule.custom) {
        return rule.custom(value);
      }

      return null;
    },
    [rules]
  );

  const validateAll = useCallback(
    (values: { [key: string]: string }): boolean => {
      const newErrors: { [key: string]: string } = {};
      let isValid = true;

      Object.keys(rules).forEach((name) => {
        const error = validateField(name, values[name] || '');
        if (error) {
          newErrors[name] = error;
          isValid = false;
        }
      });

      setErrors(newErrors);
      return isValid;
    },
    [rules, validateField]
  );

  const handleBlur = useCallback((name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  const handleChange = useCallback(
    (name: string, value: string) => {
      if (touched[name]) {
        const error = validateField(name, value);
        setErrors((prev) => ({
          ...prev,
          [name]: error || '',
        }));
      }
    },
    [touched, validateField]
  );

  const resetValidation = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  return {
    errors,
    touched,
    validateField,
    validateAll,
    handleBlur,
    handleChange,
    resetValidation,
  };
}
