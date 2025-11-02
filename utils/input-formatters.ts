export const formatters = {
  phone: (value: string): string => {
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length === 0) return '';
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  },

  unformatPhone: (value: string): string => {
    return value.replace(/\D/g, '');
  },

  cardNumber: (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g) || [];
    return groups.join(' ').substring(0, 19);
  },

  unformatCard: (value: string): string => {
    return value.replace(/\s/g, '');
  },

  cardExpiry: (value: string): string => {
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length === 0) return '';
    if (cleaned.length <= 2) return cleaned;
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
  },

  unformatExpiry: (value: string): string => {
    return value.replace(/\D/g, '');
  },

  ssn: (value: string): string => {
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length === 0) return '';
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 5) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5, 9)}`;
  },

  unformatSSN: (value: string): string => {
    return value.replace(/\D/g, '');
  },

  currency: (value: string): string => {
    const cleaned = value.replace(/[^\d.]/g, '');
    const parts = cleaned.split('.');

    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }

    if (parts[1] && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].slice(0, 2);
    }

    return cleaned;
  },

  percentage: (value: string): string => {
    const cleaned = value.replace(/[^\d.]/g, '');
    const num = parseFloat(cleaned);

    if (isNaN(num)) return '';
    if (num > 100) return '100';
    if (num < 0) return '0';

    return cleaned;
  },

  zipCode: (value: string): string => {
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length === 0) return '';
    if (cleaned.length <= 5) return cleaned;
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 9)}`;
  },

  routingNumber: (value: string): string => {
    return value.replace(/\D/g, '').slice(0, 9);
  },

  accountNumber: (value: string): string => {
    return value.replace(/\D/g, '').slice(0, 17);
  },
};

export const validators = {
  phone: (value: string): boolean => {
    const cleaned = formatters.unformatPhone(value);
    return cleaned.length === 10 || cleaned.length === 11;
  },

  email: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  cardNumber: (value: string): boolean => {
    const cleaned = formatters.unformatCard(value);
    return cleaned.length >= 13 && cleaned.length <= 19 && luhnCheck(cleaned);
  },

  cardExpiry: (value: string): boolean => {
    const cleaned = formatters.unformatExpiry(value);
    if (cleaned.length !== 4) return false;

    const month = parseInt(cleaned.slice(0, 2));
    const year = parseInt('20' + cleaned.slice(2, 4));
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (month < 1 || month > 12) return false;
    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;

    return true;
  },

  cvv: (value: string): boolean => {
    return /^\d{3,4}$/.test(value);
  },

  ssn: (value: string): boolean => {
    const cleaned = formatters.unformatSSN(value);
    return cleaned.length === 9;
  },

  zipCode: (value: string): boolean => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.length === 5 || cleaned.length === 9;
  },

  routingNumber: (value: string): boolean => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length !== 9) return false;

    let sum = 0;
    for (let i = 0; i < cleaned.length; i += 3) {
      sum += parseInt(cleaned.charAt(i)) * 3;
      sum += parseInt(cleaned.charAt(i + 1)) * 7;
      sum += parseInt(cleaned.charAt(i + 2));
    }

    return sum !== 0 && sum % 10 === 0;
  },
};

function luhnCheck(cardNumber: string): boolean {
  let sum = 0;
  let shouldDouble = false;

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber.charAt(i));

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

export const masks = {
  phone: '(999) 999-9999',
  cardNumber: '9999 9999 9999 9999',
  cardExpiry: '99/99',
  cvv: '999',
  ssn: '999-99-9999',
  zipCode: '99999',
  routingNumber: '999999999',
};

export const placeholders = {
  phone: '(555) 123-4567',
  email: 'your@email.com',
  cardNumber: '1234 5678 9012 3456',
  cardExpiry: 'MM/YY',
  cvv: '123',
  ssn: '123-45-6789',
  zipCode: '12345',
  routingNumber: '123456789',
  accountNumber: '1234567890',
  amount: '0.00',
};
