import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput as RNTextInput, 
  StyleSheet, 
  ViewStyle, 
  TextStyle, 
  TextInputProps as RNTextInputProps,
  StyleProp
} from 'react-native';
import { useFunds } from '../context/FundsContext';
import { COLORS, BORDER_RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../utils/theme';

// --- CARD COMPONENT ---
interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, style, onPress }) => {
  const { isDarkMode } = useFunds();
  const activeColors = isDarkMode ? COLORS.dark : COLORS.light;

  const cardStyle = [
    styles.card,
    { 
      backgroundColor: activeColors.surfaceCard, 
      borderColor: activeColors.border 
    },
    style
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.85}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

// --- BUTTON COMPONENT ---
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
  textStyle,
}) => {
  const { isDarkMode } = useFunds();
  const activeColors = isDarkMode ? COLORS.dark : COLORS.light;

  const buttonStyles = [
    styles.btn,
    styles[`btn_${size}`],
    disabled && styles.btn_disabled,
    !disabled && { backgroundColor: activeColors[variant === 'outline' ? 'surface' : variant] },
    variant === 'outline' && { borderWidth: 1, borderColor: activeColors.primary },
    style,
  ];

  const labelStyles = [
    styles.btnText,
    styles[`btnText_${size}`],
    { color: variant === 'outline' ? activeColors.primary : '#FFFFFF' },
    disabled && { color: activeColors.textMuted },
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles as ViewStyle[]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={labelStyles as TextStyle[]}>{title}</Text>
    </TouchableOpacity>
  );
};

// --- BADGE STATUS COMPONENT ---
interface BadgeProps {
  label: string;
  type: 'active' | 'completed' | 'paid' | 'pending' | 'chit' | 'kitty' | 'savings' | 'neutral';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, type, style }) => {
  const { isDarkMode } = useFunds();
  const activeColors = isDarkMode ? COLORS.dark : COLORS.light;

  let bg = activeColors.primaryLight;
  let txt = activeColors.primary;

  switch (type) {
    case 'active':
    case 'paid':
      bg = activeColors.successLight;
      txt = activeColors.success;
      break;
    case 'completed':
      bg = activeColors.infoLight;
      txt = activeColors.info;
      break;
    case 'pending':
      bg = activeColors.dangerLight;
      txt = activeColors.danger;
      break;
    case 'kitty':
      bg = activeColors.secondaryLight;
      txt = activeColors.secondary;
      break;
    case 'savings':
      bg = activeColors.warningLight;
      txt = activeColors.warning;
      break;
    case 'neutral':
      bg = activeColors.border;
      txt = activeColors.textSecondary;
      break;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.badgeText, { color: txt }]}>{label.toUpperCase()}</Text>
    </View>
  );
};

// --- TEXT INPUT COMPONENT ---
interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  containerStyle,
  style,
  ...props
}) => {
  const { isDarkMode } = useFunds();
  const activeColors = isDarkMode ? COLORS.dark : COLORS.light;

  return (
    <View style={[styles.inputContainer, containerStyle]}>
      {label && <Text style={[styles.inputLabel, { color: activeColors.textSecondary }]}>{label}</Text>}
      <RNTextInput
        style={[
          styles.textInput,
          { 
            backgroundColor: activeColors.surface, 
            borderColor: error ? activeColors.danger : activeColors.border,
            color: activeColors.text
          },
          style,
        ]}
        placeholderTextColor={activeColors.textMuted}
        {...props}
      />
      {error && <Text style={[styles.errorText, { color: activeColors.danger }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    marginVertical: SPACING.xs,
    ...SHADOWS.sm,
  },
  btn: {
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  btn_sm: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    height: 32,
  },
  btn_md: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    height: 46,
  },
  btn_lg: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    height: 54,
  },
  btn_disabled: {
    backgroundColor: '#CCCCCC',
  },
  btnText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  btnText_sm: {
    fontSize: TYPOGRAPHY.size.xs,
  },
  btnText_md: {
    fontSize: TYPOGRAPHY.size.sm,
  },
  btnText_lg: {
    fontSize: TYPOGRAPHY.size.md,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  inputContainer: {
    marginVertical: SPACING.xs,
    width: '100%',
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 48,
    fontSize: TYPOGRAPHY.size.sm,
  },
  errorText: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
  },
});
