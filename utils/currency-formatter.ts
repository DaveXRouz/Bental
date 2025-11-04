import { useCurrency } from '@/hooks/useCurrency';

/**
 * Global currency formatting utility
 *
 * Usage:
 * import { formatCurrency, convertCurrency } from '@/utils/currency-formatter';
 *
 * // Format in user's preferred currency
 * <Text>{formatCurrency(1000)}</Text> // → $1,000 or €850 based on preference
 *
 * // Convert between currencies
 * const euroAmount = convertCurrency(1000, 'USD', 'EUR');
 */

let globalCurrencyHook: ReturnType<typeof useCurrency> | null = null;

export const initializeCurrencyFormatter = (hook: ReturnType<typeof useCurrency>) => {
  globalCurrencyHook = hook;
};

export const formatCurrency = (
  amount: number,
  currencyCode?: string,
  options?: {
    decimals?: number;
    showSymbol?: boolean;
    showCode?: boolean;
  }
): string => {
  if (!globalCurrencyHook) {
    // Fallback if not initialized
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: options?.decimals ?? 2, maximumFractionDigits: options?.decimals ?? 2 })}`;
  }

  const targetCurrency = currencyCode || globalCurrencyHook.preferredCurrency;
  const currency = globalCurrencyHook.currencies.find(c => c.code === targetCurrency);

  if (!currency) {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: options?.decimals ?? 2, maximumFractionDigits: options?.decimals ?? 2 })}`;
  }

  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: options?.decimals ?? 2,
    maximumFractionDigits: options?.decimals ?? 2,
  });

  let result = '';
  if (options?.showSymbol !== false) {
    result += currency.symbol;
  }
  result += formattedAmount;
  if (options?.showCode) {
    result += ` ${currency.code}`;
  }

  return result;
};

export const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency?: string
): number => {
  if (!globalCurrencyHook) {
    return amount;
  }

  const targetCurrency = toCurrency || globalCurrencyHook.preferredCurrency;
  return globalCurrencyHook.convert(amount, fromCurrency, targetCurrency);
};

export const convertAndFormat = (
  amount: number,
  fromCurrency: string,
  toCurrency?: string,
  options?: {
    decimals?: number;
    showSymbol?: boolean;
    showCode?: boolean;
  }
): string => {
  const converted = convertCurrency(amount, fromCurrency, toCurrency);
  return formatCurrency(converted, toCurrency, options);
};

/**
 * React component wrapper for currency display
 */
export const CurrencyText = ({
  amount,
  currencyCode,
  style,
  ...options
}: {
  amount: number;
  currencyCode?: string;
  style?: any;
  decimals?: number;
  showSymbol?: boolean;
  showCode?: boolean;
}) => {
  const { Text } = require('react-native');
  return <Text style={style}>{formatCurrency(amount, currencyCode, options)}</Text>;
};

/**
 * Hook for currency formatting in components
 */
export const useCurrencyFormatter = () => {
  const currencyHook = useCurrency();

  // Initialize global hook
  if (!globalCurrencyHook) {
    globalCurrencyHook = currencyHook;
  }

  return {
    format: (amount: number, currencyCode?: string) =>
      formatCurrency(amount, currencyCode || currencyHook.preferredCurrency),
    convert: (amount: number, from: string, to?: string) =>
      convertCurrency(amount, from, to || currencyHook.preferredCurrency),
    convertAndFormat: (amount: number, from: string, to?: string) =>
      convertAndFormat(amount, from, to || currencyHook.preferredCurrency),
    preferredCurrency: currencyHook.preferredCurrency,
    currencies: currencyHook.currencies,
    setPreference: currencyHook.setPreference,
  };
};
