export const safeNumber = (value: any, defaultValue: number = 0): number => {
  const num = Number(value);
  if (isNaN(num) || !isFinite(num)) {
    return defaultValue;
  }
  return num;
};

export const safePercentage = (value: number | null | undefined, decimals: number = 2): string => {
  const num = safeNumber(value, 0);
  return num.toFixed(decimals);
};

export const calculatePercentage = (
  value: number | null | undefined,
  total: number | null | undefined,
  decimals: number = 2
): string => {
  const val = safeNumber(value, 0);
  const tot = safeNumber(total, 0);

  if (tot === 0) {
    return '0.' + '0'.repeat(decimals);
  }

  const percentage = (val / tot) * 100;
  return safePercentage(percentage, decimals);
};

export const calculateChange = (
  current: number | null | undefined,
  previous: number | null | undefined,
  decimals: number = 2
): string => {
  const curr = safeNumber(current, 0);
  const prev = safeNumber(previous, 0);

  if (prev === 0) {
    return '0.' + '0'.repeat(decimals);
  }

  const change = ((curr - prev) / prev) * 100;
  return safePercentage(change, decimals);
};

export const formatCurrency = (
  value: number | null | undefined,
  decimals: number = 2,
  currency: string = '$'
): string => {
  const num = safeNumber(value, 0);
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${currency}${formatted}`;
};

export const formatNumber = (
  value: number | null | undefined,
  decimals: number = 2
): string => {
  const num = safeNumber(value, 0);
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatCompactNumber = (value: number | null | undefined): string => {
  const num = safeNumber(value, 0);

  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K`;
  }
  return num.toFixed(2);
};

export const formatCompactCurrency = (
  value: number | null | undefined,
  currency: string = '$'
): string => {
  const num = safeNumber(value, 0);
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absNum >= 1_000_000_000) {
    return `${sign}${currency}${(absNum / 1_000_000_000).toFixed(2)}B`;
  }
  if (absNum >= 1_000_000) {
    return `${sign}${currency}${(absNum / 1_000_000).toFixed(2)}M`;
  }
  if (absNum >= 10_000) {
    return `${sign}${currency}${(absNum / 1_000).toFixed(1)}K`;
  }
  if (absNum >= 1_000) {
    return `${sign}${currency}${(absNum / 1_000).toFixed(2)}K`;
  }
  return `${sign}${currency}${absNum.toFixed(2)}`;
};

export const formatSmartCurrency = (
  value: number | null | undefined,
  currency: string = '$'
): string => {
  const num = safeNumber(value, 0);
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absNum >= 1_000_000) {
    return `${sign}${currency}${(absNum / 1_000_000).toFixed(2)}M`;
  }
  if (absNum >= 100_000) {
    return `${sign}${currency}${(absNum / 1_000).toFixed(0)}K`;
  }
  if (absNum >= 10_000) {
    return `${sign}${currency}${(absNum / 1_000).toFixed(1)}K`;
  }
  if (absNum >= 1_000) {
    const formatted = absNum.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${sign}${currency}${formatted}`;
  }
  return `${sign}${currency}${absNum.toFixed(2)}`;
};

export const formatChartValue = (value: number | null | undefined): string => {
  const num = safeNumber(value, 0);
  const absNum = Math.abs(num);

  if (absNum >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (absNum >= 1_000) {
    return `${(num / 1_000).toFixed(0)}K`;
  }
  return num.toFixed(0);
};

export const formatDate = (dateString: string | Date): string => {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

export const formatPercent = (value: number | null | undefined, decimals: number = 2): string => {
  const num = safeNumber(value, 0);
  return `${num.toFixed(decimals)}%`;
};
