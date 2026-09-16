import React, { useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView, TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { useFunds } from '../context/FundsContext';
import { COLORS, BORDER_RADIUS, SPACING } from '../utils/theme';
import { FundGroup, Member, Payment, Auction } from '../types';
import { MoneyIcon } from '../components/Icons';
import { ChevronLeftIcon } from '../components/Icons';
import { DefaulterListReceipt } from '../components/DefaulterListReceipt';
// @ts-ignore
import RNHTMLtoPDF from 'react-native-html-to-pdf';
// @ts-ignore
import Share from 'react-native-share';
import { captureRef } from 'react-native-view-shot';
import { PDFDocument } from 'pdf-lib';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MemberCalculation {
  memberId: string;
  memberObj: Member | undefined;
  ticketNo: number;
  installmentsPaid: number;
  totalInstallmentsDue: number;
  arrearsDue: number;
  currentMonthDue: number;
  totalAmountDue: number;
  isPrized: boolean;
  auctionMonth: number | null;
  effectiveInstallment: number;
  agentName: string;
}

interface GroupFundReport {
  group: FundGroup;
  currentMonth: number;
  baseInstallment: number;
  commission: number;
  lastBidAmount: number;
  lastDividend: number;
  netInstallment: number;
  totalCollected: number;
  totalArrears: number;
  totalCurrentDue: number;
  pricedMembers: MemberCalculation[];
  nonPricedMembers: MemberCalculation[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calculateElapsedMonths(startDate: string): number {
  let start = new Date(startDate);
  if (startDate && startDate.includes('/')) {
    const parts = startDate.split('/');
    if (parts[0].length === 2 && parts[2]?.length === 4) {
      start = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`); // convert DD/MM/YYYY to YYYY-MM-DD
    }
  }
  if (isNaN(start.getTime())) {
    start = new Date(); // fallback to today to avoid NaN
  }
  const now = new Date();
  const months = Math.floor(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  );
  return Math.max(1, months);
}

function getEffectiveInstallment(monthNum: number, group: FundGroup): number {
  const before = group.auctions.filter((a) => a.monthNumber <= monthNum);
  if (!before.length) return group.monthlyInstallment;
  return before.sort((a, b) => b.monthNumber - a.monthNumber)[0].actualInstallment;
}

function computeGroupReport(
  group: FundGroup,
  members: Member[],
  payments: Payment[]
): GroupFundReport {
  const currentMonth = Math.min(
    Math.max(calculateElapsedMonths(group.startDate), group.auctions.length + 1),
    group.durationMonths
  );
  const baseInstallment = group.monthlyInstallment;
  const sortedAuctions = [...group.auctions].sort((a, b) => b.monthNumber - a.monthNumber);
  const latestAuction: Auction | undefined = sortedAuctions[0];
  const lastBidAmount = latestAuction?.bidAmount ?? 0;
  const totalMembersCount = group.totalMembers;
  const commissionAmt = latestAuction?.commission ?? 0;
  const lastDividend = latestAuction
    ? Math.round((latestAuction.bidAmount - latestAuction.commission) / totalMembersCount)
    : 0;
  const netInstallment = baseInstallment - lastDividend;
  const prizedIds = new Set(group.auctions.map((a) => a.winnerMemberId));

  let totalCollected = 0, totalArrears = 0, totalCurrentDue = 0;

  const memberCalcs: MemberCalculation[] = group.members.map((mId, idx) => {
    const memberObj = members.find((m) => m.id === mId);
    const agentName = (memberObj as any)?.agentName ?? (memberObj as any)?.agent ?? '—';
    const isPrized = prizedIds.has(mId);
    const auctionEntry = group.auctions.find((a) => a.winnerMemberId === mId);
    const allMemberPayments = payments.filter(
      (p) => p.groupId === group.id && p.memberId === mId && (p.status === 'paid' || p.status === 'pending')
    );
    const installmentsPaid = allMemberPayments.filter(p => p.status === 'paid').length;
    totalCollected += allMemberPayments.reduce((s, p) => s + p.amountPaid, 0);

    let arrearsDue = 0, dueInstallmentsCount = 0;
    for (let m = 1; m < currentMonth; m++) {
      const pm = allMemberPayments.find((p) => p.monthNumber === m);
      const effInst = getEffectiveInstallment(m, group);
      const paidAmt = pm ? pm.amountPaid : 0;
      const owed = Math.max(0, effInst - paidAmt);
      if (owed > 0) {
        arrearsDue += owed;
        dueInstallmentsCount++;
      }
    }
    const currPm = allMemberPayments.find((p) => p.monthNumber === currentMonth);
    const currentEffInst = getEffectiveInstallment(currentMonth, group);
    const currPaidAmt = currPm ? currPm.amountPaid : 0;
    const currentMonthDue = Math.max(0, currentEffInst - currPaidAmt);
    // Check future months that were explicitly marked as paid/pending
    for (let m = currentMonth + 1; m <= group.durationMonths; m++) {
      const pm = allMemberPayments.find((p) => p.monthNumber === m);
      if (pm) {
        const effInst = getEffectiveInstallment(m, group);
        const paidAmt = pm.amountPaid || 0;
        const owed = Math.max(0, effInst - paidAmt);
        if (owed > 0) {
          arrearsDue += owed;
          dueInstallmentsCount++;
        }
      }
    }

    totalArrears += arrearsDue;
    totalCurrentDue += currentMonthDue;

    return {
      memberId: mId,
      memberObj,
      ticketNo: idx + 1,
      installmentsPaid,
      totalInstallmentsDue: dueInstallmentsCount + (currentMonthDue > 0 ? 1 : 0),
      arrearsDue,
      currentMonthDue,
      totalAmountDue: arrearsDue + currentMonthDue,
      isPrized,
      auctionMonth: auctionEntry?.monthNumber ?? null,
      effectiveInstallment: currentEffInst,
      agentName,
    };
  });

  return {
    group, currentMonth, baseInstallment, commission: commissionAmt,
    lastBidAmount, lastDividend, netInstallment, totalCollected,
    totalArrears, totalCurrentDue,
    pricedMembers: memberCalcs.filter((m) => m.isPrized),
    nonPricedMembers: memberCalcs.filter((m) => !m.isPrized),
  };
}

// ─── Member Card List ─────────────────────────────────────────────────────────

const MemberCardList: React.FC<{
  members: MemberCalculation[];
  isDark: boolean;
  emptyMsg: string;
}> = ({ members, isDark, emptyMsg }) => {
  if (members.length === 0) {
    return (
      <View style={[T.emptyRow, { backgroundColor: isDark ? '#161F2E' : '#F8FAFC' }]}>
        <Text style={{ color: isDark ? '#64748B' : '#94A3B8', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 }}>
          {emptyMsg}
        </Text>
      </View>
    );
  }

  const totArrears = members.reduce((s, m) => s + m.arrearsDue, 0);
  const totCurr    = members.reduce((s, m) => s + m.currentMonthDue, 0);

  return (
    <View style={{ padding: 10, gap: 8 }}>
      {members.map((m) => (
        <View key={m.memberId} style={{
          backgroundColor: isDark ? '#161F2E' : '#FFFFFF',
          borderRadius: 8,
          padding: 12,
          borderWidth: 1,
          borderColor: isDark ? '#1E293B' : '#E2E8F0'
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: isDark ? '#3B82F620' : '#DBEAFE', justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#3B82F6' }}>{m.ticketNo}</Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#E2E8F0' : '#0F172A' }}>{m.memberObj?.name || 'Unknown'}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#475569' }}>📱 {m.memberObj?.phone || '—'}</Text>
            <Text style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#475569' }}>Agent: {m.agentName}</Text>
          </View>
          <View style={{ flexDirection: 'row', backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderRadius: 6, padding: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 9, color: isDark ? '#94A3B8' : '#475569', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 2 }}>Inst Paid</Text>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#22C55E' }}>{m.installmentsPaid}</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 9, color: isDark ? '#94A3B8' : '#475569', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 2 }}>Due Inst</Text>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: m.totalInstallmentsDue > 0 ? '#EF4444' : (isDark ? '#E2E8F0' : '#0F172A') }}>{m.totalInstallmentsDue}</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 9, color: isDark ? '#94A3B8' : '#475569', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 2 }}>Total Due</Text>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: m.totalAmountDue > 0 ? '#EF4444' : (isDark ? '#E2E8F0' : '#0F172A') }}>₹{m.totalAmountDue.toLocaleString('en-IN')}</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 9, color: isDark ? '#94A3B8' : '#475569', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 2 }}>Arrears</Text>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: m.arrearsDue > 0 ? '#EF4444' : (isDark ? '#E2E8F0' : '#0F172A') }}>₹{m.arrearsDue.toLocaleString('en-IN')}</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 9, color: isDark ? '#94A3B8' : '#475569', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 2 }}>Current</Text>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: m.currentMonthDue > 0 ? '#F59E0B' : (isDark ? '#E2E8F0' : '#0F172A') }}>₹{m.currentMonthDue.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>
      ))}

      {/* Totals */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: isDark ? '#1E3A5F30' : '#DBEAFE',
        borderRadius: 8,
        marginTop: 4
      }}>
        <Text style={{ fontSize: 12, fontWeight: '800', color: isDark ? '#93C5FD' : '#1E3A5F' }}>TOTALS</Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: totArrears > 0 ? '#EF4444' : (isDark ? '#4ADE80' : '#15803D') }}>Arrears: ₹{totArrears.toLocaleString('en-IN')}</Text>
          <Text style={{ fontSize: 12, fontWeight: '800', color: totCurr > 0 ? '#F59E0B' : (isDark ? '#4ADE80' : '#15803D') }}>Curr: ₹{totCurr.toLocaleString('en-IN')}</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Section Header Bar ───────────────────────────────────────────────────────

const SectionBar: React.FC<{
  label: string;
  count: number;
  accentColor: string;
  isDark: boolean;
}> = ({ label, count, accentColor, isDark }) => (
  <View style={[SB.bar, { backgroundColor: isDark ? accentColor + '15' : accentColor + '12', borderBottomColor: accentColor + '40' }]}>
    <View style={[SB.accent, { backgroundColor: accentColor }]} />
    <Text style={[SB.label, { color: isDark ? '#E2E8F0' : '#0F172A' }]}>{label}</Text>
    <View style={[SB.badge, { backgroundColor: accentColor + '25', borderColor: accentColor + '60' }]}>
      <Text style={[SB.badgeText, { color: accentColor }]}>{count}</Text>
    </View>
  </View>
);

// ─── Group List Card ──────────────────────────────────────────────────────────

const GroupCard: React.FC<{
  report: GroupFundReport;
  isDark: boolean;
  onPress: () => void;
}> = ({ report, isDark, onPress }) => {
  const defaulters = [...report.pricedMembers, ...report.nonPricedMembers].filter(m => m.totalAmountDue > 0).length;
  const pct = Math.round((report.currentMonth / report.group.durationMonths) * 100);
  const latestAuction = [...report.group.auctions].sort((a, b) => b.monthNumber - a.monthNumber)[0];
  const textC = isDark ? '#E2E8F0' : '#0F172A';
  const mutC  = isDark ? '#64748B' : '#94A3B8';
  const cardBg = isDark ? '#0F1829' : '#FFFFFF';
  const borderC = isDark ? '#1E293B' : '#CBD5E1';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={{ marginBottom: 12 }}>
      <View style={[GC.card, { backgroundColor: cardBg, borderColor: borderC }]}>

        {/* Top strip */}
        <View style={GC.strip}>
          <View style={{ flex: 1 }}>
            <Text style={GC.stripTitle}>{report.group.name}</Text>
            <Text style={GC.stripSub}>
              Month {report.currentMonth} of {report.group.durationMonths} •{' '}
              {report.group.totalMembers} members
            </Text>
          </View>
          <View style={[GC.statusBadge, {
            backgroundColor: defaulters > 0 ? '#EF444415' : '#22C55E15',
            borderColor: defaulters > 0 ? '#EF4444' : '#22C55E',
          }]}>
            <Text style={[GC.statusText, { color: defaulters > 0 ? '#EF4444' : '#22C55E' }]}>
              {defaulters > 0 ? `${defaulters} DEFAULTER${defaulters > 1 ? 'S' : ''}` : 'ALL CLEAR'}
            </Text>
          </View>
        </View>

        {/* Progress */}
        <View style={GC.progressWrap}>
          <View style={[GC.progressTrack, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
            <View style={[GC.progressFill, {
              width: `${pct}%` as any,
              backgroundColor: pct === 100 ? '#22C55E' : '#3B82F6',
            }]} />
          </View>
          <Text style={[GC.progressPct, { color: mutC }]}>{pct}%</Text>
        </View>

        {/* Grid */}
        <View style={GC.grid}>
          {[
            { l: 'CHIT VALUE',       v: `₹${report.group.totalValue.toLocaleString('en-IN')}`,   c: '#3B82F6' },
            { l: 'BASE INSTALLMENT', v: `₹${report.baseInstallment.toLocaleString('en-IN')}`,    c: textC },
            { l: 'LAST BID AMT',     v: latestAuction ? `₹${latestAuction.bidAmount.toLocaleString('en-IN')}` : '—', c: '#F59E0B' },
            { l: 'NET INSTALLMENT',  v: `₹${report.netInstallment.toLocaleString('en-IN')}`,     c: '#3B82F6' },
            { l: 'TOTAL COLLECTED',  v: `₹${report.totalCollected.toLocaleString('en-IN')}`,     c: '#22C55E' },
            { l: 'TOTAL ARREARS',    v: `₹${report.totalArrears.toLocaleString('en-IN')}`,       c: report.totalArrears > 0 ? '#EF4444' : '#22C55E' },
            { l: 'CURR MONTH DUE',   v: `₹${report.totalCurrentDue.toLocaleString('en-IN')}`,   c: report.totalCurrentDue > 0 ? '#F59E0B' : '#22C55E' },
            { l: 'AUCTIONS HELD',    v: `${report.group.auctions.length}`,                       c: textC },
          ].map(({ l, v, c }) => (
            <View key={l} style={[GC.gridCell, { borderColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
              <Text style={[GC.gridLabel, { color: mutC }]}>{l}</Text>
              <Text style={[GC.gridValue, { color: c }]}>{v}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={[GC.cta, { borderTopColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
          <Text style={{ color: '#3B82F6', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 }}>
            VIEW DEFAULTER LIST  →
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export interface FundCalculationsScreenProps {
  onBack: () => void;
  initialGroupId?: string | null;
}

export const FundCalculationsScreen: React.FC<FundCalculationsScreenProps> = ({ onBack, initialGroupId }) => {
  const { isDarkMode, groups, members, payments } = useFunds();
  const [showPreview, setShowPreview] = useState(false);
  const [editedDetails, setEditedDetails] = useState<Record<string, string>>({});
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(initialGroupId || null);

  React.useEffect(() => {
    if (initialGroupId) {
      setSelectedGroupId(initialGroupId);
    }
  }, [initialGroupId]);

  React.useEffect(() => {
    if (selectedGroupId) {
      AsyncStorage.getItem(`pdf_details_${selectedGroupId}`).then((val) => {
        if (val) {
          try {
            setEditedDetails(JSON.parse(val));
          } catch (e) {}
        } else {
          setEditedDetails({});
        }
      });
    } else {
      setEditedDetails({});
    }
  }, [selectedGroupId]);

  const handleSaveDetails = async () => {
    if (!selectedGroupId) return;
    try {
      await AsyncStorage.setItem(`pdf_details_${selectedGroupId}`, JSON.stringify(editedDetails));
      Alert.alert('Saved', 'PDF header fields have been saved successfully.');
    } catch (e) {
      Alert.alert('Error', 'Could not save details.');
    }
  };

  const reports = useMemo<GroupFundReport[]>(
    () => groups.filter((g) => g.type === 'chit')
                .map((g) => computeGroupReport(g, members, payments)),
    [groups, members, payments]
  );

  const report = reports.find((r) => r.group.id === selectedGroupId);

  // ── PDF Download ────────────────────────────────────────────────────────────
  const bg      = isDarkMode ? '#080E1A' : '#F0F4FA';
  const cardBg  = isDarkMode ? '#0F1829' : '#FFFFFF';
  const borderC = isDarkMode ? '#1E293B' : '#CBD5E1';
  const textC   = isDarkMode ? '#E2E8F0' : '#0F172A';
  const mutC    = isDarkMode ? '#64748B' : '#64748B';

  // ── PDF Download ────────────────────────────────────────────────────────────
  const handleDownloadReceipt = async () => {
    if (!showPreview) {
      setShowPreview(true);
      return;
    }
    try {
      const base64Img = await captureRef(scrollViewRef, { format: 'jpg', quality: 1, result: 'base64' });
      const pdfDoc = await PDFDocument.create();
      const jpgImage = await pdfDoc.embedJpg(base64Img);
      const { width, height } = jpgImage.scale(1);
      
      const page = pdfDoc.addPage([width, height]);
      page.drawImage(jpgImage, { x: 0, y: 0, width, height });
      
      const pdfBytesBase64 = await pdfDoc.saveAsBase64();

      const fileName = 'DefaulterList_' + group.name.replace(/\s+/g, '_') + '.pdf';
      const filePath = RNFS.CachesDirectoryPath + '/' + fileName;
      await RNFS.writeFile(filePath, pdfBytesBase64, 'base64');

      await Share.open({
        url: 'file://' + filePath,
        type: 'application/pdf',
        title: 'Share Defaulter List PDF',
      });
    } catch (error: any) {
      if (error?.message?.includes('User did not share') || error?.message?.includes('cancel')) return;
      Alert.alert('Download Failed', 'Could not generate PDF.\n\n' + error?.message);
    }
  };
  // ── GROUP LIST ─────────────────────────────────────────────────────────────
  if (!report) {
    return (
      <View style={[SC.container, { backgroundColor: bg }]}>
        <View style={SC.topBar}>
          <TouchableOpacity style={SC.backBtn} onPress={onBack}>
            <ChevronLeftIcon color="#FFFFFF" size={14} />
            <Text style={SC.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={SC.topTitle}>Fund Calculations</Text>
          <View style={{ width: 56 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>
          {reports.length === 0 ? (
            <View style={[SC.emptyBox, { backgroundColor: cardBg, borderColor: borderC }]}>
              <MoneyIcon color={mutC} size={40} />
              <Text style={[SC.emptyText, { color: mutC }]}>
                No Chit Fund groups yet.{'\n'}Create a chit group to see calculations.
              </Text>
            </View>
          ) : (
            reports.map((r) => (
              <GroupCard
                key={r.group.id}
                report={r}
                isDark={isDarkMode}
                onPress={() => setSelectedGroupId(r.group.id)}
              />
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  // ── REPORT DETAIL ──────────────────────────────────────────────────────────
  const {
    group, currentMonth, baseInstallment, lastBidAmount, lastDividend,
    netInstallment, commission, totalCollected, totalArrears, totalCurrentDue,
    pricedMembers, nonPricedMembers,
  } = report;

  const allMembers    = [...nonPricedMembers, ...pricedMembers];
  const grandArrears  = allMembers.reduce((s, m) => s + m.arrearsDue, 0);
  const grandCurr     = allMembers.reduce((s, m) => s + m.currentMonthDue, 0);
  const latestAuction = [...group.auctions].sort((a, b) => b.monthNumber - a.monthNumber)[0];
  const lastPrizedTicket = latestAuction
    ? group.members.indexOf(latestAuction.winnerMemberId) + 1
    : null;
  const fmt = (d: string | undefined) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
  const today      = fmt(new Date().toISOString());
  const defaulters = allMembers.filter(m => m.totalAmountDue > 0).length;

  return (
    <View style={[SC.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={SC.topBar}>
        <TouchableOpacity style={SC.backBtn} onPress={() => setSelectedGroupId(null)}>
          <ChevronLeftIcon color="#FFFFFF" size={14} />
          <Text style={SC.backText}>Groups</Text>
        </TouchableOpacity>
        <Text style={SC.topTitle} numberOfLines={1}>{group.name}</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {!showPreview && (
            <TouchableOpacity
              onPress={handleSaveDetails}
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}
            >
              <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>SAVE</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleDownloadReceipt}
            style={{ backgroundColor: showPreview ? '#16A34A' : 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}
          >
            <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>{showPreview ? 'DOWNLOAD PDF' : 'DOWNLOAD'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView ref={scrollViewRef} collapsable={false} contentContainerStyle={showPreview ? { padding: 0, paddingBottom: 60 } : { paddingHorizontal: 10, paddingBottom: 120, backgroundColor: bg }} showsVerticalScrollIndicator={false}>
        {showPreview ? (
          <DefaulterListReceipt
            group={group}
            currentMonth={currentMonth}
            baseInstallment={baseInstallment}
            lastBidAmount={lastBidAmount}
            lastDividend={lastDividend}
            nonPricedMembers={nonPricedMembers}
            pricedMembers={pricedMembers}
            editedDetails={editedDetails}
          />
        ) : (
          <>
{/* REPORT TITLE BLOCK */}
        <View style={[RPT.titleBlock, { backgroundColor: isDarkMode ? '#0F1829' : '#1E3A5F', borderColor: isDarkMode ? '#1E293B' : '#1E3A5F' }]}>
          <TextInput
            style={[RPT.orgLine, { padding: 0, margin: 0, textAlign: 'center' }]}
            value={editedDetails['ORG_LINE'] !== undefined ? editedDetails['ORG_LINE'] : 'Shriram Chits — Branch: GOBICHETTIPALAYAM'}
            onChangeText={(text) => setEditedDetails(prev => ({ ...prev, ORG_LINE: text }))}
          />
          <TextInput
            style={[RPT.mainTitle, { padding: 0, margin: 0, textAlign: 'center' }]}
            value={editedDetails['MAIN_TITLE'] !== undefined ? editedDetails['MAIN_TITLE'] : 'DEFAULTER LIST'}
            onChangeText={(text) => setEditedDetails(prev => ({ ...prev, MAIN_TITLE: text }))}
          />
          <View style={RPT.metaRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={RPT.metaText}>Date: </Text>
              <TextInput
                style={[RPT.metaText, { padding: 0, margin: 0, minWidth: 80 }]}
                value={editedDetails['HEADER_DATE'] !== undefined ? editedDetails['HEADER_DATE'] : today}
                onChangeText={(text) => setEditedDetails(prev => ({ ...prev, HEADER_DATE: text }))}
              />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={RPT.metaText}>Month: </Text>
              <TextInput
                style={[RPT.metaText, { padding: 0, margin: 0, minWidth: 60 }]}
                value={editedDetails['HEADER_MONTH'] !== undefined ? editedDetails['HEADER_MONTH'] : `${currentMonth}/${group.durationMonths}`}
                onChangeText={(text) => setEditedDetails(prev => ({ ...prev, HEADER_MONTH: text }))}
              />
            </View>
          </View>
          {defaulters > 0 && (
            <View style={RPT.defaulterChip}>
              <Text style={RPT.defaulterChipText}>⚠  {defaulters} Defaulter{defaulters > 1 ? 's' : ''} Found</Text>
            </View>
          )}
        </View>

        {/* GROUP DETAILS */}
        <View style={[RPT.card, { backgroundColor: cardBg, borderColor: borderC }]}>
          <View style={[RPT.cardHeader, { backgroundColor: isDarkMode ? '#1E293B' : '#1E3A5F' }]}>
            <Text style={RPT.cardHeaderText}>GROUP DETAILS</Text>
          </View>
          <View style={RPT.gdGrid}>
            {([
              ['BRANCH CODE',        group.branchCode || '4550'],
              ['BRANCH NAME',        group.branchName || 'GOBICHETTIPALAYAM'],
              ['GROUP CODE',         group.id.substring(0, 14).toUpperCase()],
              ['LAST PRIZED TICKET', lastPrizedTicket ? `${lastPrizedTicket}` : '—'],
              ['CHIT VALUE',         `₹${group.totalValue.toLocaleString('en-IN')}`],
              ['PRIZED BID AMOUNT',  lastBidAmount > 0 ? `₹${lastBidAmount.toLocaleString('en-IN')}` : '—'],
              ['AUCTION DATE',       fmt(group.startDate)],
              ['LAST AUCTION DATE',  latestAuction ? fmt((latestAuction as any).date ?? group.startDate) : '—'],
              ['AUCTION TIME',       group.auctionTime || '16:00'],
              ['AUCTION NUMBER',     `${group.auctions.length}`],
            ] as [string, string][]).map(([label, value], i) => (
              <View key={label} style={[RPT.gdCell, {
                borderBottomColor: isDarkMode ? '#1E293B' : '#E2E8F0',
                borderRightColor:  isDarkMode ? '#1E293B' : '#E2E8F0',
                borderRightWidth:  i % 2 === 0 ? StyleSheet.hairlineWidth : 0,
              }]}>
                <Text style={[RPT.gdLabel, { color: mutC }]}>{label}</Text>
                <TextInput
                  style={[RPT.gdValue, {
                    color: ['CHIT VALUE','PRIZED BID AMOUNT','LAST PRIZED TICKET'].includes(label) ? '#3B82F6' : textC,
                    padding: 0, margin: 0,
                  }]}
                  value={editedDetails[label] !== undefined ? editedDetails[label] : value}
                  onChangeText={(text) => setEditedDetails(prev => ({ ...prev, [label]: text }))}
                />
              </View>
            ))}
          </View>
        </View>

        {/* CALCULATION BREAKDOWN */}
        {group.auctions.length > 0 && (
          <View style={[RPT.card, { backgroundColor: cardBg, borderColor: borderC }]}>
            <View style={[RPT.cardHeader, { backgroundColor: isDarkMode ? '#1E293B' : '#1E3A5F' }]}>
              <Text style={RPT.cardHeaderText}>MONTHLY CALCULATION</Text>
            </View>
            <View style={RPT.calcGrid}>
              {([
                { l: 'BASE INSTALLMENT', v: `₹${baseInstallment.toLocaleString('en-IN')}`, c: '#6366F1', sub: `Chit Value ÷ ${group.totalMembers}` },
                { l: 'LAST BID AMOUNT',  v: `₹${lastBidAmount.toLocaleString('en-IN')}`,   c: '#F59E0B', sub: 'Winner auction bid' },
                { l: 'COMMISSION',       v: `₹${commission.toLocaleString('en-IN')}`,       c: '#EF4444', sub: `${group.commissionPercent}% of Chit Value` },
                { l: 'DIVIDEND/MEMBER',  v: `₹${lastDividend.toLocaleString('en-IN')}`,     c: '#22C55E', sub: '(Bid − Commission) ÷ Members' },
              ]).map(({ l, v, c, sub }) => (
                <View key={l} style={[RPT.calcBox, { backgroundColor: isDarkMode ? '#0B1120' : '#F8FAFC', borderColor: c + '35' }]}>
                  <Text style={[RPT.calcLabel, { color: mutC }]}>{l}</Text>
                  <Text style={[RPT.calcValue, { color: c }]}>{v}</Text>
                  <Text style={[RPT.calcSub, { color: mutC }]}>{sub}</Text>
                </View>
              ))}
            </View>
            <View style={[RPT.netBar, { backgroundColor: isDarkMode ? '#1E3A5F30' : '#EFF6FF', borderColor: '#3B82F660' }]}>
              <Text style={[RPT.netLabel, { color: mutC }]}>NET INSTALLMENT  =  </Text>
              <Text style={[RPT.netFormula, { color: mutC }]}>
                ₹{baseInstallment.toLocaleString('en-IN')} − ₹{lastDividend.toLocaleString('en-IN')}  =  
              </Text>
              <Text style={[RPT.netValue, { color: '#3B82F6' }]}>
                ₹{netInstallment.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        )}

        {/* AUCTION HISTORY */}
        {group.auctions.length > 0 && (
          <View style={[RPT.card, { backgroundColor: cardBg, borderColor: borderC }]}>
            <View style={[RPT.cardHeader, { backgroundColor: isDarkMode ? '#14532D40' : '#14532D' }]}>
              <Text style={RPT.cardHeaderText}>AUCTION HISTORY</Text>
            </View>
            <View>
              <View>
                <View style={[AH.hRow, { backgroundColor: isDarkMode ? '#0F1829' : '#F0FDF4' }]}>
                  {['MTH','WINNER','BID','COMM','DIV','NET'].map((h, i) => (
                    <Text key={h} style={[AH.hCell, { flex: i === 1 ? 2.5 : 1, textAlign: i === 1 ? 'left' : 'center', color: isDarkMode ? '#4ADE80' : '#14532D' }]}>{h}</Text>
                  ))}
                </View>
                {[...group.auctions].sort((a, b) => a.monthNumber - b.monthNumber).map((auction, idx) => {
                  const winner = members.find((m) => m.id === auction.winnerMemberId);
                  const div = Math.round((auction.bidAmount - auction.commission) / group.totalMembers);
                  const isEven = idx % 2 === 0;
                  return (
                    <View key={idx} style={[AH.row, {
                      backgroundColor: isDarkMode ? (isEven ? '#161F2E' : '#0F1829') : (isEven ? '#FFFFFF' : '#F7FFF9'),
                      borderBottomColor: isDarkMode ? '#1E293B' : '#D1FAE5',
                    }]}>
                      <Text style={[AH.cell, { flex: 1, textAlign: 'center', color: isDarkMode ? '#60A5FA' : '#1E3A5F', fontWeight: '800' }]}>M{auction.monthNumber}</Text>
                      <Text style={[AH.cell, { flex: 2.5, textAlign: 'left', color: textC, fontWeight: '600' }]} numberOfLines={1} adjustsFontSizeToFit>{winner?.name ?? 'Unknown'}</Text>
                      <Text style={[AH.cell, { flex: 1, textAlign: 'center', color: '#F59E0B', fontWeight: '700' }]} numberOfLines={1} adjustsFontSizeToFit>₹{auction.bidAmount}</Text>
                      <Text style={[AH.cell, { flex: 1, textAlign: 'center', color: '#EF4444' }]} numberOfLines={1} adjustsFontSizeToFit>₹{auction.commission}</Text>
                      <Text style={[AH.cell, { flex: 1, textAlign: 'center', color: '#22C55E', fontWeight: '700' }]} numberOfLines={1} adjustsFontSizeToFit>₹{div}</Text>
                      <Text style={[AH.cell, { flex: 1, textAlign: 'center', color: '#3B82F6', fontWeight: '800' }]} numberOfLines={1} adjustsFontSizeToFit>₹{auction.actualInstallment}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* NON PRIZED */}
        <View style={[RPT.card, { backgroundColor: cardBg, borderColor: borderC, overflow: 'hidden' }]}>
          <SectionBar label="NON PRIZED" count={nonPricedMembers.length} accentColor="#F59E0B" isDark={isDarkMode} />
          <MemberCardList members={nonPricedMembers} isDark={isDarkMode} emptyMsg="THERE IS NO NON PRIZED" />
        </View>

        {/* PRIZED */}
        <View style={[RPT.card, { backgroundColor: cardBg, borderColor: borderC, overflow: 'hidden' }]}>
          <SectionBar label="PRIZED" count={pricedMembers.length} accentColor="#22C55E" isDark={isDarkMode} />
          <MemberCardList members={pricedMembers} isDark={isDarkMode} emptyMsg="NO AUCTIONS HELD YET" />
        </View>

        {/* GRAND SUMMARY */}
        <View style={[RPT.card, { backgroundColor: isDarkMode ? '#0F1829' : '#EFF6FF', borderColor: '#3B82F640', overflow: 'hidden' }]}>
          <View style={[RPT.cardHeader, { backgroundColor: '#1E3A5F' }]}>
            <Text style={RPT.cardHeaderText}>GRAND SUMMARY</Text>
          </View>
          <View style={RPT.summGrid}>
            {([
              { l: 'TOTAL MEMBERS',     v: `${group.members.length}`,                                   c: textC },
              { l: 'PRIZED',            v: `${pricedMembers.length}`,                                    c: '#22C55E' },
              { l: 'NON-PRIZED',        v: `${nonPricedMembers.length}`,                                 c: '#F59E0B' },
              { l: 'DEFAULTERS',        v: `${defaulters}`,                                              c: defaulters > 0 ? '#EF4444' : '#22C55E' },
              { l: 'TOTAL COLLECTED',   v: `₹${totalCollected.toLocaleString('en-IN')}`,                c: '#22C55E' },
              { l: 'TOTAL ARREARS DUE', v: `₹${grandArrears.toLocaleString('en-IN')}`,                 c: grandArrears > 0 ? '#EF4444' : '#22C55E' },
              { l: 'CURR MONTH DUE',    v: `₹${grandCurr.toLocaleString('en-IN')}`,                    c: grandCurr > 0 ? '#F59E0B' : '#22C55E' },
              { l: 'GRAND TOTAL DUE',   v: `₹${(grandArrears + grandCurr).toLocaleString('en-IN')}`,   c: (grandArrears + grandCurr) > 0 ? '#EF4444' : '#22C55E', bold: true },
            ] as any[]).map(({ l, v, c, bold }) => (
              <View key={l} style={[RPT.summCell, { borderColor: isDarkMode ? '#1E293B' : '#BFDBFE' }]}>
                <Text style={[RPT.summLabel, { color: mutC }]}>{l}</Text>
                <Text style={[RPT.summValue, { color: c, fontWeight: bold ? '900' : '700', fontSize: bold ? 15 : 13 }]}>{v}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <Text style={[RPT.footer, { color: mutC }]}>
          Generated: {today}  •  {group.name}  •  Page 1 of 1
        </Text>
          </>
        )}
      </ScrollView>



    </View>
  );
};

// ─── StyleSheets ──────────────────────────────────────────────────────────────

const SC = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E3A5F',
    paddingHorizontal: 14,
    paddingVertical: 10,
    paddingTop: Platform.OS === 'ios' ? 52 : 10,
  },
  backBtn:  { flexDirection: 'row', alignItems: 'center', minWidth: 56 },
  backText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', marginLeft: 3 },
  topTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', flex: 1, textAlign: 'center', letterSpacing: 0.3 },
  emptyBox: { borderRadius: 12, borderWidth: 1, padding: 32, alignItems: 'center', marginTop: 24 },
  emptyText: { fontSize: 13, textAlign: 'center', marginTop: 12, lineHeight: 22 },
});

const GC = StyleSheet.create({
  card:     { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  strip:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E3A5F', padding: 12 },
  stripTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  stripSub:   { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 2 },
  statusBadge:{ borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  progressWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  progressTrack:{ flex: 1, height: 5, borderRadius: 3, overflow: 'hidden', marginRight: 8 },
  progressFill: { height: '100%', borderRadius: 3 },
  progressPct:  { fontSize: 10, fontWeight: '700', width: 28, textAlign: 'right' },
  grid:   { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, paddingBottom: 8 },
  gridCell: { width: '50%', padding: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  gridLabel:{ fontSize: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  gridValue:{ fontSize: 12, fontWeight: '800', marginTop: 2 },
  cta:  { borderTopWidth: 1, paddingVertical: 11, alignItems: 'center' },
});

const RPT = StyleSheet.create({
  titleBlock: {
    borderRadius: 10, borderWidth: 1,
    padding: 14, alignItems: 'center',
    marginTop: 10, marginBottom: 8,
  },
  orgLine:   { color: 'rgba(255,255,255,0.55)', fontSize: 9, marginBottom: 4 },
  mainTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', letterSpacing: 2.5 },
  metaRow:   { flexDirection: 'row', gap: 16, marginTop: 6 },
  metaText:  { color: 'rgba(255,255,255,0.6)', fontSize: 10 },
  defaulterChip: { marginTop: 8, backgroundColor: '#EF444420', borderRadius: 20, borderWidth: 1, borderColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 4 },
  defaulterChipText: { color: '#FCA5A5', fontSize: 11, fontWeight: '700' },

  card: { borderRadius: 10, borderWidth: 1, marginBottom: 8, overflow: 'hidden' },
  cardHeader: { paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' },
  cardHeaderText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },

  gdGrid:  { flexDirection: 'row', flexWrap: 'wrap' },
  gdCell:  { width: '50%', padding: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  gdLabel: { fontSize: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 },
  gdValue: { fontSize: 12, fontWeight: '700' },

  calcGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, padding: 10 },
  calcBox:  { width: '47%', borderRadius: 8, borderWidth: 1, padding: 10 },
  calcLabel:{ fontSize: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  calcValue:{ fontSize: 18, fontWeight: '900', marginBottom: 2 },
  calcSub:  { fontSize: 9 },

  netBar: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', margin: 10, marginTop: 0, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  netLabel:  { fontSize: 10, fontWeight: '800' },
  netFormula:{ fontSize: 10 },
  netValue:  { fontSize: 14, fontWeight: '900' },

  summGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
  summCell: { width: '50%', padding: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  summLabel:{ fontSize: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  summValue:{ fontSize: 13, fontWeight: '700' },

  footer: { textAlign: 'center', fontSize: 10, marginTop: 6, marginBottom: 8 },
});

const T = StyleSheet.create({
  headerRow:   { flexDirection: 'row', paddingHorizontal: 6, paddingVertical: 8 },
  hCell:       { fontSize: 8, fontWeight: '900', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 13 },
  dataRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 7, borderBottomWidth: StyleSheet.hairlineWidth },
  cell:        { fontSize: 10, lineHeight: 14 },
  totalRow:    { borderTopWidth: 2, paddingVertical: 9 },
  totalLabel:  { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  totalAmt:    { fontSize: 10, fontWeight: '900', textAlign: 'right' },
  emptyRow:    { paddingVertical: 18, alignItems: 'center', paddingHorizontal: 12 },
});

const SB = StyleSheet.create({
  bar:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 9, borderBottomWidth: 1 },
  accent:    { width: 4, height: 14, borderRadius: 2, marginRight: 8 },
  label:     { fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', flex: 1 },
  badge:     { borderRadius: 10, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: '800' },
});

const AH = StyleSheet.create({
  hRow:  { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 7 },
  hCell: { fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.4 },
  row:   { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  cell:  { fontSize: 10 },
});
