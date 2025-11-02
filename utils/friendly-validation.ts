import { z } from 'zod';

export const friendlyValidation = {
  amount: (options?: { min?: number; max?: number; field?: string }) => {
    const fieldName = options?.field || 'amount';
    const min = options?.min || 0;
    const max = options?.max || 1000000;

    return z
      .string({
        required_error: `How much would you like to ${fieldName === 'depositAmount' ? 'deposit' : 'transfer'}?`,
      })
      .min(1, `Please enter an ${fieldName}`)
      .refine((val) => !isNaN(Number(val)), `Please enter a valid ${fieldName}`)
      .refine(
        (val) => Number(val) > min,
        min > 0
          ? `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least $${min}`
          : `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be greater than $0`
      )
      .refine(
        (val) => Number(val) <= max,
        `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} cannot exceed $${max.toLocaleString()}`
      );
  },

  email: () =>
    z
      .string({
        required_error: "We'll need your email address",
      })
      .email("That doesn't look like a valid email address"),

  phone: () =>
    z
      .string({
        required_error: 'Please enter your phone number',
      })
      .min(10, 'Phone number should be at least 10 digits')
      .refine(
        (val) => /^[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4}$/.test(val.replace(/\s/g, '')),
        'Please enter a valid phone number'
      ),

  optionalPhone: () =>
    z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val.length === 0) return true;
          return /^[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4}$/.test(val.replace(/\s/g, ''));
        },
        'Please enter a valid phone number'
      ),

  password: (options?: { minLength?: number }) => {
    const minLength = options?.minLength || 8;
    return z
      .string({
        required_error: 'Password is required to secure your account',
      })
      .min(minLength, `Password should be at least ${minLength} characters for security`)
      .refine(
        (val) => /[A-Z]/.test(val),
        'Password should include at least one uppercase letter'
      )
      .refine(
        (val) => /[a-z]/.test(val),
        'Password should include at least one lowercase letter'
      )
      .refine((val) => /[0-9]/.test(val), 'Password should include at least one number');
  },

  confirmPassword: (passwordField: string = 'password') =>
    z.string({
      required_error: 'Please confirm your password',
    }),

  name: (fieldName: string = 'name') =>
    z
      .string({
        required_error: `Please enter your ${fieldName}`,
      })
      .min(2, `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} should be at least 2 characters`)
      .refine((val) => val.trim().length > 0, `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} cannot be empty`),

  cardNumber: () =>
    z
      .string({
        required_error: 'Please enter your card number',
      })
      .min(13, 'Card number is too short')
      .max(19, 'Card number is too long')
      .refine((val) => {
        const cleaned = val.replace(/\s/g, '');
        return /^\d+$/.test(cleaned);
      }, 'Card number should only contain digits'),

  cardExpiry: () =>
    z
      .string({
        required_error: 'Please enter the card expiry date',
      })
      .refine((val) => {
        const cleaned = val.replace(/\D/g, '');
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
      }, 'Card has expired or expiry date is invalid'),

  cvv: () =>
    z
      .string({
        required_error: 'Please enter the CVV',
      })
      .length(3, 'CVV should be 3 digits')
      .refine((val) => /^\d{3,4}$/.test(val), 'CVV should only contain digits'),

  ssn: () =>
    z
      .string({
        required_error: 'Social Security Number is required',
      })
      .refine((val) => {
        const cleaned = val.replace(/\D/g, '');
        return cleaned.length === 9;
      }, 'SSN should be 9 digits'),

  zipCode: () =>
    z
      .string({
        required_error: 'Please enter your ZIP code',
      })
      .refine((val) => {
        const cleaned = val.replace(/\D/g, '');
        return cleaned.length === 5 || cleaned.length === 9;
      }, 'ZIP code should be 5 or 9 digits'),

  accountNumber: (fieldName: string = 'account number') =>
    z
      .string({
        required_error: `Please enter the ${fieldName}`,
      })
      .min(4, `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is too short`)
      .max(17, `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is too long`),

  routingNumber: () =>
    z
      .string({
        required_error: 'Please enter the routing number',
      })
      .length(9, 'Routing number should be exactly 9 digits')
      .refine((val) => /^\d{9}$/.test(val), 'Routing number should only contain digits'),

  selection: (fieldName: string) =>
    z.string({
      required_error: `Please select ${fieldName}`,
    }).min(1, `Please select ${fieldName}`),

  agreement: (agreementName: string) =>
    z.boolean({
      required_error: `Please agree to the ${agreementName}`,
    }).refine((val) => val === true, `You must agree to the ${agreementName} to continue`),

  quantity: (options?: { min?: number; max?: number }) => {
    const min = options?.min || 1;
    const max = options?.max || 1000000;

    return z
      .string({
        required_error: 'Please enter a quantity',
      })
      .refine((val) => !isNaN(Number(val)), 'Quantity must be a number')
      .refine((val) => Number.isInteger(Number(val)), 'Quantity must be a whole number')
      .refine((val) => Number(val) >= min, `Quantity must be at least ${min}`)
      .refine((val) => Number(val) <= max, `Quantity cannot exceed ${max.toLocaleString()}`);
  },

  percentage: () =>
    z
      .string({
        required_error: 'Please enter a percentage',
      })
      .refine((val) => !isNaN(Number(val)), 'Percentage must be a number')
      .refine((val) => Number(val) >= 0 && Number(val) <= 100, 'Percentage must be between 0 and 100'),

  url: (fieldName: string = 'URL') =>
    z
      .string({
        required_error: `Please enter a ${fieldName}`,
      })
      .url(`Please enter a valid ${fieldName}`),
};

export function createDepositSchema(options?: { minAmount?: number; maxAmount?: number }) {
  return z.object({
    amount: friendlyValidation.amount({
      min: options?.minAmount || 10,
      max: options?.maxAmount || 1000000,
      field: 'deposit amount',
    }),
    method: friendlyValidation.selection('a deposit method'),
  });
}

export function createWithdrawSchema(
  availableBalance: number,
  options?: { minAmount?: number }
) {
  const minAmount = options?.minAmount || 10;

  return z.object({
    amount: friendlyValidation
      .amount({ min: minAmount, field: 'withdrawal amount' })
      .refine(
        (val) => Number(val) <= availableBalance,
        `You don't have enough funds (available: $${availableBalance.toLocaleString()})`
      ),
  });
}

export function createTradeSchema(buyingPower: number) {
  return z.object({
    symbol: z.string().min(1, 'Please enter a stock symbol'),
    quantity: friendlyValidation.quantity({ min: 1 }),
    orderType: friendlyValidation.selection('an order type'),
    side: friendlyValidation.selection('buy or sell'),
    limitPrice: z.string().optional(),
  }).refine(
    (data) => {
      if (data.orderType === 'limit' && !data.limitPrice) {
        return false;
      }
      return true;
    },
    {
      message: 'Limit orders require a limit price',
      path: ['limitPrice'],
    }
  ).refine(
    (data) => {
      if (data.side === 'buy') {
        const estimatedCost =
          Number(data.quantity) * (Number(data.limitPrice) || 0);
        return estimatedCost <= buyingPower;
      }
      return true;
    },
    {
      message: `Insufficient buying power (available: $${buyingPower.toLocaleString()})`,
      path: ['quantity'],
    }
  );
}

export function createProfileSchema() {
  return z.object({
    fullName: friendlyValidation.name('full name'),
    email: friendlyValidation.email(),
    phone: friendlyValidation.optionalPhone(),
  });
}

export function createSignupSchema() {
  return z
    .object({
      fullName: friendlyValidation.name('full name'),
      email: friendlyValidation.email(),
      phone: friendlyValidation.optionalPhone(),
      password: friendlyValidation.password({ minLength: 8 }),
      confirmPassword: friendlyValidation.confirmPassword(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    });
}

export function createBankAccountSchema() {
  return z.object({
    routingNumber: friendlyValidation.routingNumber(),
    accountNumber: friendlyValidation.accountNumber(),
    accountType: friendlyValidation.selection('an account type'),
  });
}

export function createCardSchema() {
  return z.object({
    cardNumber: friendlyValidation.cardNumber(),
    expiry: friendlyValidation.cardExpiry(),
    cvv: friendlyValidation.cvv(),
  });
}
