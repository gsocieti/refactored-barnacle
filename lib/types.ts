export type Category = { id: string; name: string; slug: string; sort_order: number };

export type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
};

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Tunai di kasir' },
  { value: 'transfer_bca', label: 'Transfer Bank BCA' },
  { value: 'transfer_bri', label: 'Transfer Bank BRI' },
  { value: 'transfer_mandiri', label: 'Transfer Bank Mandiri' },
  { value: 'qris', label: 'QRIS' },
  { value: 'gopay', label: 'GoPay' },
  { value: 'ovo', label: 'OVO' },
  { value: 'dana', label: 'DANA' },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]['value'];
