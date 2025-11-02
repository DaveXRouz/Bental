import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

interface UseSmartFormOptions<T> {
  schema?: z.ZodSchema<T>;
  initialValues?: Partial<T>;
  persistKey?: string;
  persistDuration?: number;
  smartDefaults?: SmartDefaults<T>;
  onValidationChange?: (isValid: boolean, errors: Record<string, string>) => void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

type SmartDefaults<T> = {
  [K in keyof T]?: () => T[K] | Promise<T[K]>;
};

interface FormState<T> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

export function useSmartForm<T extends Record<string, any>>(
  options: UseSmartFormOptions<T>
) {
  const {
    schema,
    initialValues = {} as T,
    persistKey,
    persistDuration = 3600000,
    smartDefaults,
    onValidationChange,
    validateOnChange = true,
    validateOnBlur = true,
  } = options;

  const [state, setState] = useState<FormState<T>>({
    values: initialValues as T,
    errors: {} as Record<keyof T, string>,
    touched: {} as Record<keyof T, boolean>,
    isSubmitting: false,
    isValid: false,
    isDirty: false,
  });

  const initialValuesRef = useRef(initialValues);
  const submitHandlerRef = useRef<((values: T) => Promise<void>) | null>(null);

  useEffect(() => {
    loadPersistedData();
    applySmartDefaults();
  }, []);

  useEffect(() => {
    if (persistKey && state.isDirty) {
      persistData();
    }
  }, [state.values, persistKey]);

  useEffect(() => {
    if (validateOnChange) {
      const isValid = validateForm();
      onValidationChange?.(isValid, state.errors);
    }
  }, [state.values]);

  const loadPersistedData = async () => {
    if (!persistKey) return;

    try {
      const stored = await AsyncStorage.getItem(`form_${persistKey}`);
      if (!stored) return;

      const { data, timestamp } = JSON.parse(stored);
      const now = Date.now();

      if (now - timestamp < persistDuration) {
        setState((prev) => ({
          ...prev,
          values: { ...initialValues, ...data },
          isDirty: true,
        }));
      } else {
        await AsyncStorage.removeItem(`form_${persistKey}`);
      }
    } catch (error) {
      console.error('Error loading persisted form data:', error);
    }
  };

  const persistData = async () => {
    if (!persistKey) return;

    try {
      const dataToStore = {
        data: state.values,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(`form_${persistKey}`, JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Error persisting form data:', error);
    }
  };

  const clearPersistedData = async () => {
    if (!persistKey) return;

    try {
      await AsyncStorage.removeItem(`form_${persistKey}`);
    } catch (error) {
      console.error('Error clearing persisted data:', error);
    }
  };

  const applySmartDefaults = async () => {
    if (!smartDefaults) return;

    const defaultValues: Partial<T> = {};

    for (const key in smartDefaults) {
      const defaultFn = smartDefaults[key];
      if (defaultFn && !state.values[key]) {
        try {
          defaultValues[key] = await defaultFn();
        } catch (error) {
          console.error(`Error applying smart default for ${key}:`, error);
        }
      }
    }

    if (Object.keys(defaultValues).length > 0) {
      setState((prev) => ({
        ...prev,
        values: { ...prev.values, ...defaultValues },
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!schema) return true;

    try {
      schema.parse(state.values);
      setState((prev) => ({
        ...prev,
        errors: {} as Record<keyof T, string>,
        isValid: true,
      }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setState((prev) => ({
          ...prev,
          errors: errors as Record<keyof T, string>,
          isValid: false,
        }));
      }
      return false;
    }
  };

  const validateField = (field: keyof T): boolean => {
    if (!schema) return true;

    const fieldSchema = schema.shape ? (schema.shape as any)[field] : null;
    if (!fieldSchema) return true;

    try {
      fieldSchema.parse(state.values[field]);
      setState((prev) => ({
        ...prev,
        errors: { ...prev.errors, [field]: '' },
      }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setState((prev) => ({
          ...prev,
          errors: {
            ...prev.errors,
            [field]: error.errors[0]?.message || 'Invalid value',
          },
        }));
      }
      return false;
    }
  };

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setState((prev) => {
      const newValues = { ...prev.values, [field]: value };
      const isDirty = JSON.stringify(newValues) !== JSON.stringify(initialValuesRef.current);

      return {
        ...prev,
        values: newValues,
        isDirty,
      };
    });
  }, []);

  const setFieldTouched = useCallback((field: keyof T, touched = true) => {
    setState((prev) => ({
      ...prev,
      touched: { ...prev.touched, [field]: touched },
    }));

    if (validateOnBlur && touched) {
      setTimeout(() => validateField(field), 0);
    }
  }, [validateOnBlur]);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setState((prev) => ({
      ...prev,
      errors: { ...prev.errors, [field]: error },
    }));
  }, []);

  const handleBlur = useCallback((field: keyof T) => {
    setFieldTouched(field, true);
  }, [setFieldTouched]);

  const handleSubmit = useCallback((handler: (values: T) => Promise<void>) => {
    return async () => {
      setState((prev) => ({ ...prev, isSubmitting: true }));

      const isValid = validateForm();

      if (!isValid) {
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          touched: Object.keys(prev.values).reduce(
            (acc, key) => ({ ...acc, [key]: true }),
            {} as Record<keyof T, boolean>
          ),
        }));
        return;
      }

      try {
        await handler(state.values);
        await clearPersistedData();
        setState((prev) => ({ ...prev, isSubmitting: false }));
      } catch (error) {
        setState((prev) => ({ ...prev, isSubmitting: false }));
        throw error;
      }
    };
  }, [state.values]);

  const reset = useCallback((values?: Partial<T>) => {
    const newValues = values || initialValuesRef.current;
    setState({
      values: newValues as T,
      errors: {} as Record<keyof T, string>,
      touched: {} as Record<keyof T, boolean>,
      isSubmitting: false,
      isValid: false,
      isDirty: false,
    });
    clearPersistedData();
  }, []);

  const setValues = useCallback((values: Partial<T>) => {
    setState((prev) => ({
      ...prev,
      values: { ...prev.values, ...values },
      isDirty: true,
    }));
  }, []);

  return {
    values: state.values,
    errors: state.errors,
    touched: state.touched,
    isSubmitting: state.isSubmitting,
    isValid: state.isValid,
    isDirty: state.isDirty,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    setValues,
    handleBlur,
    handleSubmit,
    validateForm,
    validateField,
    reset,
    clearPersistedData,
  };
}

export function getSmartDefaults() {
  return {
    currentDate: () => new Date().toISOString().split('T')[0],
    currentTime: () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    timestamp: () => Date.now(),
    userTimezone: () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    userLocale: () => Intl.DateTimeFormat().resolvedOptions().locale,
    userCurrency: () => {
      const locale = Intl.DateTimeFormat().resolvedOptions().locale;
      if (locale.startsWith('en-US')) return 'USD';
      if (locale.startsWith('en-CA')) return 'CAD';
      if (locale.startsWith('en-GB')) return 'GBP';
      if (locale.startsWith('en-AU')) return 'AUD';
      return 'USD';
    },
  };
}
