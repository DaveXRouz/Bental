import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  active: boolean;
  display_order: number;
}

export interface ExchangeRate {
  from_currency: string;
  to_currency: string;
  rate: number;
}

export function useCurrency() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [preferredCurrency, setPreferredCurrency] = useState<string>('USD');
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrencies();
    fetchPreference();
    fetchRates();
  }, []);

  const fetchCurrencies = async () => {
    try {
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .eq('active', true)
        .order('display_order');

      if (error) throw error;
      setCurrencies(data || []);
    } catch (error) {
      console.error('Error fetching currencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreference = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_currency_preferences')
        .select('preferred_currency')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) setPreferredCurrency(data.preferred_currency);
    } catch (error) {
      console.error('Error fetching currency preference:', error);
    }
  };

  const fetchRates = async () => {
    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*');

      if (error) throw error;

      const rateMap: Record<string, number> = {};
      data?.forEach((rate: ExchangeRate) => {
        rateMap[`${rate.from_currency}_${rate.to_currency}`] = rate.rate;
      });
      setRates(rateMap);
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    }
  };

  const setPreference = async (currencyCode: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      const { error } = await supabase
        .from('user_currency_preferences')
        .upsert({ user_id: user.id, preferred_currency: currencyCode });

      if (error) throw error;
      setPreferredCurrency(currencyCode);
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const convert = (amount: number, from: string, to: string): number => {
    if (from === to) return amount;
    const rateKey = `${from}_${to}`;
    const rate = rates[rateKey];
    if (!rate) return amount;
    return amount * rate;
  };

  const format = (amount: number, currencyCode: string = preferredCurrency): string => {
    const currency = currencies.find(c => c.code === currencyCode);
    if (!currency) return `$${amount.toLocaleString()}`;
    return `${currency.symbol}${amount.toLocaleString()}`;
  };

  return {
    currencies,
    preferredCurrency,
    loading,
    setPreference,
    convert,
    format,
    refresh: fetchCurrencies,
  };
}
