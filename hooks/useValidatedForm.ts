import { useState, useCallback } from 'react';
import { z } from 'zod';

export function useValidatedForm<T extends z.ZodType>(schema: T) {
  type FormData = z.infer<T>;

  const [values, setValues] = useState<Partial<FormData>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});

  const validateField = useCallback(
    (name: keyof FormData, value: any) => {
      try {
        schema.parse({ ...values, [name]: value });
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldError = error.errors.find((e) => e.path.includes(name as string));
          if (fieldError) {
            setErrors((prev) => ({
              ...prev,
              [name]: fieldError.message,
            }));
          }
        }
        return false;
      }
    },
    [schema, values]
  );

  const setValue = useCallback((name: keyof FormData, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setFieldValue = useCallback(
    (name: keyof FormData, value: any, shouldValidate = true) => {
      setValue(name, value);
      if (shouldValidate && touched[name]) {
        validateField(name, value);
      }
    },
    [setValue, touched, validateField]
  );

  const setFieldTouched = useCallback((name: keyof FormData, isTouched = true) => {
    setTouched((prev) => ({ ...prev, [name]: isTouched }));
  }, []);

  const handleBlur = useCallback(
    (name: keyof FormData) => {
      setFieldTouched(name, true);
      if (values[name] !== undefined) {
        validateField(name, values[name]);
      }
    },
    [setFieldTouched, validateField, values]
  );

  const validate = useCallback((): boolean => {
    try {
      schema.parse(values);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof FormData, string>> = {};
        error.errors.forEach((err) => {
          const path = err.path[0] as keyof FormData;
          if (path) {
            newErrors[path] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  }, [schema, values]);

  const reset = useCallback(() => {
    setValues({});
    setErrors({});
    setTouched({});
  }, []);

  const getFieldProps = useCallback(
    (name: keyof FormData) => ({
      value: values[name],
      onChangeText: (text: string) => setFieldValue(name, text),
      onBlur: () => handleBlur(name),
      error: touched[name] ? errors[name] : undefined,
    }),
    [values, errors, touched, setFieldValue, handleBlur]
  );

  return {
    values,
    errors,
    touched,
    setFieldValue,
    setFieldTouched,
    handleBlur,
    validate,
    reset,
    getFieldProps,
    isValid: Object.keys(errors).length === 0,
  };
}
