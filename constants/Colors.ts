export const Colors = {
  // Brand - Inspiré des couleurs du Sahel au coucher de soleil
  primary: '#D97706', // Ambre chaud
  primaryLight: '#FBBF24', // Or soleil
  primaryDark: '#B45309', // Terre brûlée

  // Accent - Énergique et optimiste
  accent: '#059669', // Vert émeraude (croissance, nature)
  accentLight: '#10B981',
  accentBright: '#F59E0B', // Orange mandarine (énergie)

  // Operators (conserver identité marque)
  airtel: '#E30613',
  airtelLight: '#FF5252',
  moov: '#0095DA',
  moovLight: '#4FC3F7',

  // Semantic
  success: '#059669', // Vert émeraude cohérent
  successLight: '#D1FAE5',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#0EA5E9',

  // Neutral - Chauds plutôt que gris froids
  background: '#FFFBF5', // Blanc cassé chaud (pas blanc pur)
  surface: '#FFFFFF',
  surfaceWarm: '#FEF3E2', // Surface avec touche d'ambre
  card: '#FFFFFF',
  border: '#E7E5E4',
  borderLight: '#F5F5F4',
  divider: '#F5F5F4',

  // Text - Contrastes riches
  textPrimary: '#1C1917', // Presque noir chaud
  textSecondary: '#57534E', // Gris chaud
  textTertiary: '#A8A29E', // Gris clair chaud
  textOnPrimary: '#FFFFFF',
  textOnDark: '#FFFFFF',
  textLink: '#D97706',

  // Misc
  overlay: 'rgba(28, 25, 23, 0.65)',
  shadow: 'rgba(217, 119, 6, 0.12)', // Ombre ambre
  shimmer: '#F5F5F4',
  white: '#FFFFFF',
  black: '#1C1917',
  transparent: 'transparent',
};

export const Gradients = {
  primary: ['#D97706', '#B45309'] as const, // Ambre sunset
  header: ['#F59E0B', '#D97706'] as const, // Orange to Amber
  card: ['#FFFFFF', '#FEF3E2'] as const, // Blanc avec touche d'ambre
  splash: ['#FFFBF5', '#FEF3E2'] as const, // Blanc cassé vers ambre léger
  action: ['#F59E0B', '#D97706'] as const, // Orange mandarine
  success: ['#10B981', '#059669'] as const, // Vert énergique
  celebration: ['#F59E0B', '#EF4444', '#8B5CF6'] as const, // Multicolor pour succès
};
