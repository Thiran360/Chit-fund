import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import { useFunds } from '../context/FundsContext';

interface MenuScreenProps {
  onNavigateToScreen: (screenName: string) => void;
  userRole: 'admin' | 'staff';
}

interface MenuCategory {
  id: string;
  title: string;
  iconText: string;
  description: string;
  screenName: string;
  adminOnly?: boolean;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({ onNavigateToScreen, userRole }) => {
  const { isDarkMode } = useFunds();
  const activeColors = isDarkMode ? COLORS.dark : COLORS.light;

  const categories: MenuCategory[] = [
    {
      id: 'transactions',
      title: 'Chit Transactions',
      iconText: '📄',
      description: 'Auction reports, Intimations, Daybook & Ledgers',
      screenName: 'Transactions',
    },
    {
      id: 'arrears',
      title: 'Arrear Reports',
      iconText: '📊',
      description: 'Area, Assistant, Group & Member-wise arrears',
      screenName: 'Arrears',
    },
    {
      id: 'accounting',
      title: 'Accounting System',
      iconText: '💼',
      description: 'Balance Sheet, P&L, Bank Book & Vouchers',
      screenName: 'Accounting',
    },
    {
      id: 'collections',
      title: 'Daily Collections',
      iconText: '📱',
      description: 'Mobile collections, Location Tracking & Auto Posting',
      screenName: 'Collections',
    },
    {
      id: 'subscribers',
      title: 'Subscriber & Guarantor',
      iconText: '🤝',
      description: 'Receipt Forms, Member Lists, Guarantees',
      screenName: 'Subscribers',
    },
    {
      id: 'special',
      title: 'Special Features',
      iconText: '⚙️',
      description: 'Audit Lock, Notifications, Auto Posting & BRS',
      screenName: 'SpecialFeatures',
      adminOnly: true,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: activeColors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: activeColors.text }]}>
            More Features
          </Text>
          <Text style={[styles.headerSubtitle, { color: activeColors.textSecondary }]}>
            Comprehensive Chit Fund Management
          </Text>
        </View>

        <View style={styles.gridContainer}>
          {categories.map((cat) => {
            if (cat.adminOnly && userRole !== 'admin') return null;

            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.card,
                  { 
                    backgroundColor: activeColors.surface,
                    borderColor: activeColors.border,
                  }
                ]}
                activeOpacity={0.7}
                onPress={() => onNavigateToScreen(cat.screenName)}
              >
                <View style={[styles.iconContainer, { backgroundColor: activeColors.primaryLight }]}>
                  <Text style={styles.iconText}>{cat.iconText}</Text>
                </View>
                <Text style={[styles.cardTitle, { color: activeColors.text }]}>
                  {cat.title}
                </Text>
                <Text style={[styles.cardDescription, { color: activeColors.textSecondary }]} numberOfLines={2}>
                  {cat.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  card: {
    width: '48%',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    ...Platform.select({
      ios: SHADOWS.sm,
      android: { elevation: 2 },
    }),
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconText: {
    fontSize: 24,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  cardDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
});
