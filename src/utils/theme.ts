export const COLORS = {
  light: {
    primary: '#0066FF', // Vibrant Electric Blue
    primaryLight: '#EBF5FF', // Soft Light Blue
    secondary: '#00B4D8', // Sky/Teal secondary
    secondaryLight: '#CAF0F8',
    success: '#10B981', // Emerald
    successLight: '#ECFDF5',
    warning: '#F59E0B', // Amber
    warningLight: '#FEF3C7',
    danger: '#EF4444', // Red
    dangerLight: '#FEF2F2',
    info: '#0066FF', // Blue
    infoLight: '#EBF5FF',
    background: '#F8FAFC', // Crisp, clean off-white
    surface: '#FFFFFF', // Pure White
    surfaceCard: '#FFFFFF',
    border: '#E2E8F0', // Slate 100/200
    text: '#0F172A', // Slate 900
    textSecondary: '#475569', // Slate 600
    textMuted: '#94A3B8', // Slate 400
    shadowColor: '#0066FF',
    glass: 'rgba(255, 255, 255, 0.85)',
  },
  dark: {
    primary: '#6366F1', // Light Indigo
    primaryLight: '#1E1B4B',
    secondary: '#A78BFA', // Light Purple
    secondaryLight: '#2E1065',
    success: '#34D399', // Emerald 400
    successLight: '#064E3B',
    warning: '#FBBF24', // Amber 400
    warningLight: '#78350F',
    danger: '#F87171', // Red 400
    dangerLight: '#7F1D1D',
    info: '#60A5FA', // Blue 400
    infoLight: '#172554',
    background: '#0B0F19', // Premium Midnight Blue/Black
    surface: '#111827', // Dark Slate
    surfaceCard: '#1E293B', // Slate 800
    border: '#334155', // Slate 700
    text: '#F9FAFB', // Slate 50
    textSecondary: '#9CA3AF', // Slate 400
    textMuted: '#6B7280', // Slate 500
    shadowColor: '#000000',
    glass: 'rgba(30, 41, 59, 0.75)',
  },
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  premium: {
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
};

export const SPACING = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
};

export const BORDER_RADIUS = {
  xs: 5,
  sm: 9,
  md: 14,
  lg: 18,
  xl: 26,
  round: 9999,
};

export const TYPOGRAPHY = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  size: {
    xs: 13,
    sm: 16,
    md: 18,
    lg: 22,
    xl: 26,
    xxl: 34,
    xxxl: 44,
  },
};
