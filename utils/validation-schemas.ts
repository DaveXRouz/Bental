import { z } from 'zod';

export const amountSchema = z
  .string()
  .min(1, 'Amount is required')
  .refine((val) => !isNaN(Number(val)), 'Must be a valid number')
  .refine((val) => Number(val) > 0, 'Amount must be greater than 0')
  .refine((val) => Number(val) <= 1000000, 'Amount cannot exceed $1,000,000');

export const depositSchema = z.object({
  amount: amountSchema,
  method: z.enum(['bank', 'card'], {
    message: 'Please select a deposit method',
  }),
});

export const withdrawSchema = z.object({
  amount: amountSchema,
  availableBalance: z.number().optional(),
}).refine(
  (data) => {
    if (data.availableBalance !== undefined) {
      return Number(data.amount) <= data.availableBalance;
    }
    return true;
  },
  {
    message: 'Insufficient funds',
    path: ['amount'],
  }
);

export const transferSchema = z.object({
  amount: amountSchema,
  fromAccount: z.string().min(1, 'Please select source account'),
  toAccount: z.string().min(1, 'Please select destination account'),
}).refine((data) => data.fromAccount !== data.toAccount, {
  message: 'Cannot transfer to the same account',
  path: ['toAccount'],
});

export const tradeSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required'),
  quantity: z
    .string()
    .min(1, 'Quantity is required')
    .refine((val) => !isNaN(Number(val)), 'Must be a valid number')
    .refine((val) => Number(val) > 0, 'Quantity must be greater than 0')
    .refine((val) => Number.isInteger(Number(val)), 'Quantity must be a whole number'),
  orderType: z.enum(['market', 'limit'], {
    message: 'Please select order type',
  }),
  side: z.enum(['buy', 'sell'], {
    message: 'Please select buy or sell',
  }),
  limitPrice: z.string().optional(),
  buyingPower: z.number().optional(),
}).refine(
  (data) => {
    if (data.orderType === 'limit' && !data.limitPrice) {
      return false;
    }
    return true;
  },
  {
    message: 'Limit price is required for limit orders',
    path: ['limitPrice'],
  }
).refine(
  (data) => {
    if (data.side === 'buy' && data.buyingPower !== undefined) {
      const estimatedCost = Number(data.quantity) * (Number(data.limitPrice) || 0);
      return estimatedCost <= data.buyingPower;
    }
    return true;
  },
  {
    message: 'Insufficient buying power',
    path: ['quantity'],
  }
);

export const minAmountSchema = (min: number) =>
  amountSchema.refine((val) => Number(val) >= min, `Minimum amount is $${min}`);

export const maxAmountSchema = (max: number) =>
  amountSchema.refine((val) => Number(val) <= max, `Maximum amount is $${max}`);

export type DepositFormData = z.infer<typeof depositSchema>;
export type WithdrawFormData = z.infer<typeof withdrawSchema>;
export type TransferFormData = z.infer<typeof transferSchema>;
export type TradeFormData = z.infer<typeof tradeSchema>;
