import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useFunds } from '../context/FundsContext';
import { COLORS, SHADOWS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../utils/theme';
import { Payment } from '../types';

interface ReceiptViewProps {
  visible: boolean;
  payment: Payment | null;
  onClose: () => void;
}

export const ReceiptView: React.FC<ReceiptViewProps> = ({ visible, payment, onClose }) => {
  const { isDarkMode, groups, members } = useFunds();
  const activeColors = isDarkMode ? COLORS.dark : COLORS.light;

  if (!payment) return null;

  const group = groups.find((g) => g.id === payment.groupId);
  const member = members.find((m) => m.id === payment.memberId);

  if (!group || !member) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
        <View style={[styles.receiptContainer, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
          
          {/* Header Action */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: activeColors.text }]}>Payment Receipt</Text>
            <TouchableOpacity style={[styles.closeButton, { backgroundColor: activeColors.border }]} onPress={onClose}>
              <Text style={[styles.closeButtonText, { color: activeColors.text }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* The Receipt Sheet */}
            <View style={[styles.receiptSheet, { backgroundColor: isDarkMode ? '#1E293B' : '#F9FAFB', borderColor: activeColors.border }]}>
              
              {/* Receipt Header */}
              <View style={styles.receiptHeader}>
                <Text style={[styles.brandName, { color: activeColors.primary }]}>CHITTRUST LEDGER</Text>
                <Text style={[styles.receiptSubtitle, { color: activeColors.textSecondary }]}>OFFICIAL PAYMENT RECEIPT</Text>
                <View style={[styles.divider, { borderBottomColor: activeColors.border }]} />
              </View>

              {/* Stamp of Payout (Absolutely Positioned) */}
              <View style={[styles.paidStamp, { borderColor: activeColors.success }]}>
                <Text style={[styles.paidStampText, { color: activeColors.success }]}>PAID</Text>
              </View>

              {/* Amount Display */}
              <View style={styles.amountSection}>
                <Text style={[styles.amountLabel, { color: activeColors.textSecondary }]}>AMOUNT SECURED</Text>
                <Text style={[styles.amountText, { color: activeColors.success }]}>
                  ₹{payment.amountPaid.toLocaleString('en-IN')}
                </Text>
              </View>

              {/* Info Grid */}
              <View style={styles.infoGrid}>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: activeColors.textSecondary }]}>Receipt ID</Text>
                  <Text style={[styles.infoValue, { color: activeColors.text }]}>{payment.id}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: activeColors.textSecondary }]}>Date & Time</Text>
                  <Text style={[styles.infoValue, { color: activeColors.text }]}>{payment.paymentDate || 'N/A'}</Text>
                </View>

                <View style={[styles.rowDivider, { borderBottomColor: activeColors.border }]} />

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: activeColors.textSecondary }]}>Subscriber</Text>
                  <Text style={[styles.infoValue, { color: activeColors.text, fontWeight: '600' }]}>{member.name}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: activeColors.textSecondary }]}>Contact</Text>
                  <Text style={[styles.infoValue, { color: activeColors.text }]}>{member.phone}</Text>
                </View>

                <View style={[styles.rowDivider, { borderBottomColor: activeColors.border }]} />

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: activeColors.textSecondary }]}>Fund Group</Text>
                  <Text style={[styles.infoValue, { color: activeColors.text, fontWeight: '600' }]}>{group.name}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: activeColors.textSecondary }]}>Fund Type</Text>
                  <Text style={[styles.infoValue, { color: activeColors.text, textTransform: 'capitalize' }]}>{group.type} Fund</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: activeColors.textSecondary }]}>Installment Month</Text>
                  <Text style={[styles.infoValue, { color: activeColors.text }]}>Month {payment.monthNumber} of {group.durationMonths}</Text>
                </View>

                <View style={[styles.rowDivider, { borderBottomColor: activeColors.border }]} />

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: activeColors.textSecondary }]}>Payment Mode</Text>
                  <Text style={[styles.infoValue, { color: activeColors.text }]}>{payment.paymentMode}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: activeColors.textSecondary }]}>Transaction Ref</Text>
                  <Text style={[styles.infoValue, { color: activeColors.primary, fontWeight: 'bold' }]}>
                    {payment.transactionRef || 'CASH_ENTRY'}
                  </Text>
                </View>
              </View>

              {/* Decorative Dashed Edge Bottom */}
              <View style={styles.dashedFooterLine} />
              <View style={styles.footerNoteSection}>
                <Text style={[styles.footerNoteText, { color: activeColors.textMuted }]}>
                  This is a digitally generated ledger verification slip. No physical signature is required.
                </Text>
              </View>
            </View>

            {/* Print / Done Button */}
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: activeColors.primary }]} onPress={onClose}>
              <Text style={styles.actionButtonText}>Done</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  receiptContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    ...SHADOWS.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: SPACING.sm,
  },
  receiptSheet: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  receiptHeader: {
    alignItems: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  brandName: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  receiptSubtitle: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '600',
    marginTop: 4,
  },
  divider: {
    width: '60%',
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    marginTop: SPACING.md,
  },
  paidStamp: {
    position: 'absolute',
    top: 60,
    right: 20,
    borderWidth: 3,
    borderRadius: 8,
    padding: 6,
    transform: [{ rotate: '-15deg' }],
    opacity: 0.85,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  paidStampText: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  amountSection: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  amountLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    letterSpacing: 1,
    fontWeight: '600',
  },
  amountText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 4,
  },
  infoGrid: {
    marginTop: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.size.sm,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.size.sm,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    marginVertical: SPACING.md,
  },
  dashedFooterLine: {
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#9CA3AF',
    opacity: 0.3,
    marginVertical: SPACING.lg,
  },
  footerNoteSection: {
    alignItems: 'center',
  },
  footerNoteText: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  actionButton: {
    height: 50,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
    ...SHADOWS.md,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: 'bold',
  },
});
