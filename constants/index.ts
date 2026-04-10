export { Colors, Gradients } from './Colors';
export { Typography, FontFamily, FontSize } from './Typography';
export { Layout, Shadows } from './Layout';

// Chad phone validation
export const CHAD_COUNTRY_CODE = '+235';
export const AIRTEL_PREFIX = '6';
export const MOOV_PREFIX = '9';

export const detectOperator = (phone: string): 'airtel' | 'moov' | null => {
  const cleaned = phone.replace(/\s/g, '').replace(CHAD_COUNTRY_CODE, '');
  if (cleaned.startsWith(AIRTEL_PREFIX)) return 'airtel';
  if (cleaned.startsWith(MOOV_PREFIX)) return 'moov';
  return null;
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 4) return `${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4)}`;
  return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)}`;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' XAF';
};
