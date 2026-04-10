export const Colors = {
  // Brand
  primary: '#007BFF', // Bleu Primaire
  primaryLight: '#66B2FF',
  primaryDark: '#0056B3',
  primaryGradientStart: '#007BFF',
  primaryGradientEnd: '#0056B3',

  // Operators
  airtel: '#E30613',
  airtelLight: '#FF5252',
  moov: '#0095DA',
  moovLight: '#4FC3F7',

  // Semantic
  success: '#28A745', // Vert Secondaire
  successLight: '#D4EDDA',
  error: '#DC3545',
  errorLight: '#F8D7DA',
  warning: '#FFC107', // Orange d'Accent
  warningLight: '#FFF3CD',
  info: '#17A2B8',

  // Neutral - White background with slightly green touches where needed
  background: '#FFFFFF',
  surface: '#FFFFFF',
  card: '#F8F9FA',
  border: '#DEE2E6',
  borderLight: '#F8F9FA',
  divider: '#E9ECEF',

  // Text
  textPrimary: '#343A40', // Gris Neutre
  textSecondary: '#6C757D',
  textTertiary: '#ADB5BD',
  textOnPrimary: '#FFFFFF',
  textOnDark: '#FFFFFF',
  textLink: '#007BFF',

  // Misc
  overlay: 'rgba(52, 58, 64, 0.65)',
  shadow: 'rgba(0, 123, 255, 0.08)',
  shimmer: '#E8E8E8',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const Gradients = {
  primary: ['#007BFF', '#0056B3'] as const,
  header: ['#007BFF', '#004494'] as const,
  card: ['#FFFFFF', '#F0FDF4'] as const, // Blanc avec touche de vert clair
  splash: ['#FFFFFF', '#E8F5E9'] as const, // Blanc vers touche verte
  action: ['#FFC107', '#E0A800'] as const,  // Orange
};
