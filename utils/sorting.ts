import AsyncStorage from '@react-native-async-storage/async-storage';

export type SortOption = 'value' | 'gainLoss' | 'symbol';

export interface Holding {
  symbol: string;
  market_value: number;
  quantity: number;
  average_cost: number;
  current_price: number;
}

const SORT_PREFERENCE_KEY = 'portfolio_sort_preference';

export async function getSortPreference(): Promise<SortOption> {
  try {
    const pref = await AsyncStorage.getItem(SORT_PREFERENCE_KEY);
    return (pref as SortOption) || 'value';
  } catch (error) {
    console.error('Error getting sort preference:', error);
    return 'value';
  }
}

export async function setSortPreference(option: SortOption): Promise<void> {
  try {
    await AsyncStorage.setItem(SORT_PREFERENCE_KEY, option);
  } catch (error) {
    console.error('Error setting sort preference:', error);
  }
}

export function sortHoldings(holdings: Holding[], sortBy: SortOption): Holding[] {
  const sorted = [...holdings];

  switch (sortBy) {
    case 'value':
      return sorted.sort((a, b) => Number(b.market_value) - Number(a.market_value));

    case 'gainLoss':
      return sorted.sort((a, b) => {
        const gainLossA = Number(a.market_value) - (Number(a.quantity) * Number(a.average_cost));
        const gainLossB = Number(b.market_value) - (Number(b.quantity) * Number(b.average_cost));
        const percentA = (Number(a.quantity) * Number(a.average_cost)) > 0
          ? (gainLossA / (Number(a.quantity) * Number(a.average_cost))) * 100
          : 0;
        const percentB = (Number(b.quantity) * Number(b.average_cost)) > 0
          ? (gainLossB / (Number(b.quantity) * Number(b.average_cost))) * 100
          : 0;
        return percentB - percentA;
      });

    case 'symbol':
      return sorted.sort((a, b) => a.symbol.localeCompare(b.symbol));

    default:
      return sorted;
  }
}

export function getSortLabel(sortBy: SortOption): string {
  switch (sortBy) {
    case 'value':
      return 'Value (High to Low)';
    case 'gainLoss':
      return 'Gain/Loss %';
    case 'symbol':
      return 'Symbol (A-Z)';
    default:
      return 'Sort By';
  }
}
