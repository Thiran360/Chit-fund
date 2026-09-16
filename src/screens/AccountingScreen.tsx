import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput } from 'react-native';
import { useFunds } from '../context/FundsContext';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import { ChevronLeftIcon, ChevronRightIcon } from '../components/Icons';

interface AccountingScreenProps {
  onBack: () => void;
}

interface FeatureItem {
  id: string;
  title: string;
  subtitle?: string;
  isNew?: boolean;
}

interface FeatureGroup {
  title: string;
  items: FeatureItem[];
}

export const AccountingScreen: React.FC<AccountingScreenProps> = ({ onBack }) => {
  const { isDarkMode } = useFunds();
  const activeColors = isDarkMode ? COLORS.dark : COLORS.light;
  const [searchQuery, setSearchQuery] = useState('');

  const groups: FeatureGroup[] = [
    {
      title: 'Financial Statements',
      items: [
        { id: 'balance-sheet', title: 'Balance Sheet', subtitle: 'With / Without Schedule' },
        { id: 'profit-loss', title: 'Profit & Loss Account', subtitle: 'Yearly / Monthwise (With/Without Schedule)' },
        { id: 'trail-balance', title: 'Trail Balance' },
      ],
    },
    {
      title: 'Ledgers & Books',
      items: [
        { id: 'bank-book', title: 'Bank Book, Cash Book & Day Transaction', subtitle: 'All Ledgers' },
        { id: 'bank-register', title: 'Bank Register' },
        { id: 'audit-trail', title: 'Audit Trail' },
      ],
    },
    {
      title: 'Vouchers',
      items: [
        { id: 'vouchers', title: 'Vouchers', subtitle: 'Contra, Receipts, Payment & General Journal' },
      ],
    },
  ];

  // Filter items based on search query
  const filteredGroups = groups.map(group => ({
    ...group,
    items: group.items.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (item.subtitle && item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })).filter(group => group.items.length > 0);

  return (
    <View style={[styles.container, { backgroundColor: activeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: activeColors.surface, borderBottomColor: activeColors.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <ChevronLeftIcon color={activeColors.primary} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: activeColors.primary }]}>Accounting System</Text>
          <View style={{ width: 40 }} />
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchInputWrapper, { backgroundColor: activeColors.background, borderColor: activeColors.border }]}>
            <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
            <TextInput
              style={[styles.searchInput, { color: activeColors.text }]}
              placeholder="Search statements, ledgers..."
              placeholderTextColor={activeColors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filteredGroups.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateEmoji]}>📂</Text>
            <Text style={[styles.emptyStateText, { color: activeColors.textSecondary }]}>No results found.</Text>
          </View>
        ) : (
          filteredGroups.map((group, groupIndex) => (
            <View key={groupIndex} style={styles.groupContainer}>
              <Text style={[styles.groupTitle, { color: activeColors.textSecondary }]}>{group.title}</Text>
              
              <View style={[styles.listContainer, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
                {group.items.map((item, itemIndex) => {
                  const isLast = itemIndex === group.items.length - 1;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.listItem,
                        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: activeColors.border }
                      ]}
                      activeOpacity={0.7}
                    >
                      <View style={styles.listItemTextContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={[styles.listItemTitle, { color: activeColors.text }]}>{item.title}</Text>
                          {item.isNew && (
                            <View style={[styles.newBadge, { backgroundColor: activeColors.primaryLight }]}>
                              <Text style={[styles.newBadgeText, { color: activeColors.primary }]}>NEW</Text>
                            </View>
                          )}
                        </View>
                        {item.subtitle && (
                          <Text style={[styles.listItemSubtitle, { color: activeColors.textSecondary }]}>
                            {item.subtitle}
                          </Text>
                        )}
                      </View>
                      <ChevronRightIcon color={activeColors.border} size={16} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    ...Platform.select({
      ios: SHADOWS.sm,
    }),
    elevation: Platform.OS === 'android' ? 3 : undefined,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  backBtn: {
    padding: SPACING.xs,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  searchContainer: {
    width: '100%',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  scrollContent: {
    padding: SPACING.md,
  },
  groupContainer: {
    marginBottom: SPACING.xl,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  listContainer: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  listItemTextContainer: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  listItemSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  newBadge: {
    marginLeft: SPACING.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
