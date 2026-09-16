import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFunds } from '../context/FundsContext';
import { COLORS, SPACING, BORDER_RADIUS } from '../utils/theme';
import { ChevronLeftIcon } from '../components/Icons';

interface ComingSoonScreenProps {
  title: string;
  onBack: () => void;
}

export const ComingSoonScreen: React.FC<ComingSoonScreenProps> = ({ title, onBack }) => {
  const { isDarkMode } = useFunds();
  const activeColors = isDarkMode ? COLORS.dark : COLORS.light;

  return (
    <View style={[styles.container, { backgroundColor: activeColors.background }]}>
      <View style={[styles.header, { borderBottomColor: activeColors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ChevronLeftIcon color={activeColors.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: activeColors.text }]}>{title}</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.emoji, { color: activeColors.text }]}>🚧</Text>
        <Text style={[styles.title, { color: activeColors.text }]}>Coming Soon</Text>
        <Text style={[styles.subtitle, { color: activeColors.textSecondary }]}>
          The {title} module is currently under development.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
