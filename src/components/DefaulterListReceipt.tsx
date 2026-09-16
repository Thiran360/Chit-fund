import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FundGroup, MemberCalculation } from '../types';

interface Props {
  group: FundGroup;
  currentMonth: number;
  baseInstallment: number;
  lastBidAmount: number;
  lastDividend: number;
  nonPricedMembers: MemberCalculation[];
  pricedMembers: MemberCalculation[];
  editedDetails?: Record<string, string>;
}

export const DefaulterListReceipt: React.FC<Props> = ({
  group,
  currentMonth,
  lastBidAmount,
  nonPricedMembers,
  pricedMembers,
  editedDetails = {},
}) => {
  // Format dates
  const fmt = (d: string | undefined) => d ? new Date(d).toLocaleDateString('en-GB') : '';
  const today = new Date().toLocaleDateString('en-GB');
  
  const latestAuction = [...group.auctions].sort((a, b) => b.monthNumber - a.monthNumber)[0];
  const lastPrizedTicket = latestAuction ? group.members.indexOf(latestAuction.winnerMemberId) + 1 : '';

  const v = (key: string, defaultVal: string) => editedDetails[key] !== undefined ? editedDetails[key] : defaultVal;

  const renderMemberRow = (m: MemberCalculation, isPrizedSection: boolean = false) => {
    let bidAmt = 0;
    if (isPrizedSection && m.auctionMonth) {
      const auc = group.auctions.find(a => a.monthNumber === m.auctionMonth);
      bidAmt = auc ? auc.bidAmount : 0;
    }
    
    return (
      <View style={S.row} key={m.memberId}>
        <Text style={[S.cell, S.wTkt, S.center]}>{m.ticketNo}</Text>
        <Text style={[S.cell, S.wName]}>{m.memberObj?.name || ''}</Text>
        <Text style={[S.cell, S.wPhone]}>{m.memberObj?.phone || ''}</Text>
        <Text style={[S.cell, S.wAgent, isPrizedSection ? S.right : {}]}>
          {isPrizedSection ? (bidAmt > 0 ? bidAmt.toFixed(2) : '—') : (m.agentName || '')}
        </Text>
        <Text style={[S.cell, S.wNum, S.center]}>{m.installmentsPaid}</Text>
        <Text style={[S.cell, S.wNum, S.center]}>{m.totalInstallmentsDue}</Text>
        <Text style={[S.cell, S.wAmt, S.right]}>{m.arrearsDue > 0 ? m.arrearsDue.toFixed(2) : '0.00'}</Text>
        <Text style={[S.cell, S.wAmt, S.right, { borderRightWidth: 0 }]}>{m.currentMonthDue > 0 ? m.currentMonthDue.toFixed(2) : '0.00'}</Text>
      </View>
    );
  };

  const renderTotals = (list: MemberCalculation[], isLast: boolean) => {
    const tArr = list.reduce((s, m) => s + m.arrearsDue, 0);
    const tCur = list.reduce((s, m) => s + m.currentMonthDue, 0);
    return (
      <View style={[S.row, isLast ? { borderBottomWidth: 0 } : {}]}>
        <Text style={[S.cell, { flex: 7.2, textAlign: 'right', fontWeight: 'bold' }]}>TOTAL </Text>
        <Text style={[S.cell, S.wAmt, S.right, { fontWeight: 'bold' }]}>{tArr > 0 ? tArr.toFixed(2) : '0.00'}</Text>
        <Text style={[S.cell, S.wAmt, S.right, { fontWeight: 'bold', borderRightWidth: 0 }]}>{tCur > 0 ? tCur.toFixed(2) : '0.00'}</Text>
      </View>
    );
  };

  return (
    <View style={S.container}>
      <View style={S.header}>
        <Text style={S.headerText}>{v('ORG_LINE', 'HOME    MASTER    REPORT    QUERY    LOGOUT')}</Text>
        <Text style={S.headerText}>USER : QUERYALL  NAME : K01975 [KAMATCHI V]</Text>
        <Text style={S.headerText}>BRANCH : {group.branchCode || '4550'} [{group.branchName || 'GOBICHETTIPALAYAM'}]  DATE : {v('HEADER_DATE', today)}</Text>
      </View>

      <Text style={S.title}>{v('MAIN_TITLE', 'DEFAULTER LIST')}</Text>

      <View style={S.table}>
        <Text style={S.sectionHeader}>GROUP DETAILS</Text>
        <View style={S.row}>
          <Text style={[S.cell, S.wL]}>BRANCH CODE <Text style={S.b}>{v('BRANCH CODE', group.branchCode || '4550')}</Text></Text>
          <Text style={[S.cell, S.wR, { borderRightWidth: 0 }]}>BRANCH NAME <Text style={S.b}>{v('BRANCH NAME', group.branchName || 'GOBICHETTIPALAYAM')}</Text></Text>
        </View>
        <View style={S.row}>
          <Text style={[S.cell, S.wL]}>GROUP CODE <Text style={S.b}>{v('GROUP CODE', group.id.substring(0, 14).toUpperCase())}</Text></Text>
          <Text style={[S.cell, S.wR, { borderRightWidth: 0 }]}>LAST PRIZED TICKET <Text style={S.b}>{v('LAST PRIZED TICKET', lastPrizedTicket ? `${lastPrizedTicket}` : '—')}</Text></Text>
        </View>
        <View style={S.row}>
          <Text style={[S.cell, S.wL]}>CHIT VALUE <Text style={S.b}>{v('CHIT VALUE', `₹${group.totalValue.toLocaleString('en-IN')}`)}</Text></Text>
          <Text style={[S.cell, S.wR, { borderRightWidth: 0 }]}>PRIZED BID AMOUNT <Text style={S.b}>{v('PRIZED BID AMOUNT', lastBidAmount > 0 ? `₹${lastBidAmount.toLocaleString('en-IN')}` : '—')}</Text></Text>
        </View>
        <View style={S.row}>
          <Text style={[S.cell, S.wL]}>AUCTION DATE <Text style={S.b}>{v('AUCTION DATE', fmt(group.startDate))}</Text></Text>
          <Text style={[S.cell, S.wR, { borderRightWidth: 0 }]}>LAST AUCTION DATE <Text style={S.b}>{v('LAST AUCTION DATE', latestAuction ? fmt(latestAuction.date) : '—')}</Text></Text>
        </View>
        <View style={[S.row, { borderBottomWidth: 0 }]}>
          <Text style={[S.cell, S.wL]}>AUCTION TIME <Text style={S.b}>{v('AUCTION TIME', group.auctionTime || '16:00')}</Text></Text>
          <Text style={[S.cell, S.wR, { borderRightWidth: 0 }]}>AUCTION NUMBER <Text style={S.b}>{v('AUCTION NUMBER', `${group.auctions.length}`)}</Text></Text>
        </View>
      </View>

      <View style={S.table}>
        <Text style={S.sectionHeader}>NON PRIZED</Text>
        <View style={S.row}>
          <Text style={[S.cell, S.wTkt, S.center]}>TKT NO</Text>
          <Text style={[S.cell, S.wName]}>NAME</Text>
          <Text style={[S.cell, S.wPhone]}>PHONE NO</Text>
          <Text style={[S.cell, S.wAgent]}>AGENT NAME</Text>
          <Text style={[S.cell, S.wNum, S.center]}>INST PAID</Text>
          <Text style={[S.cell, S.wNum, S.center]}>NO OF DUE INST</Text>
          <Text style={[S.cell, S.wAmt, S.right]}>ARREARS AMT DUE</Text>
          <Text style={[S.cell, S.wAmt, S.right, { borderRightWidth: 0 }]}>CURRENT AMT DUE</Text>
        </View>
        {nonPricedMembers.length === 0 ? (
          <View style={[S.row, { borderBottomWidth: 0 }]}>
            <Text style={[S.cell, { flex: 1, borderRightWidth: 0 }]}>THERE IS NO NON PRIZED</Text>
          </View>
        ) : (
          <>
            {nonPricedMembers.map(m => renderMemberRow(m, false))}
            {renderTotals(nonPricedMembers, true)}
          </>
        )}
      </View>

      <View style={S.table}>
        <Text style={S.sectionHeader}>PRIZED</Text>
        <View style={S.row}>
          <Text style={[S.cell, S.wTkt, S.center]}>TKT NO</Text>
          <Text style={[S.cell, S.wName]}>NAME</Text>
          <Text style={[S.cell, S.wPhone]}>PHONE NO</Text>
          <Text style={[S.cell, S.wAgent, S.right]}>BID AMT</Text>
          <Text style={[S.cell, S.wNum, S.center]}>INST PAID</Text>
          <Text style={[S.cell, S.wNum, S.center]}>NO OF DUE INST</Text>
          <Text style={[S.cell, S.wAmt, S.right]}>ARREARS AMT DUE</Text>
          <Text style={[S.cell, S.wAmt, S.right, { borderRightWidth: 0 }]}>CURRENT AMT DUE</Text>
        </View>
        {pricedMembers.length === 0 ? (
          <View style={[S.row, { borderBottomWidth: 0 }]}>
            <Text style={[S.cell, { flex: 1, borderRightWidth: 0 }]}>THERE IS NO PRIZED</Text>
          </View>
        ) : (
          <>
            {pricedMembers.map(m => renderMemberRow(m, true))}
            {renderTotals(pricedMembers, true)}
          </>
        )}
      </View>
    </View>
  );
};

const S = StyleSheet.create({
  container: { backgroundColor: '#FFF', padding: 10 },
  header: { marginBottom: 15, alignItems: 'center' },
  headerText: { fontSize: 9, fontWeight: 'bold', fontFamily: 'monospace', color: '#000', marginBottom: 2, textAlign: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', textDecorationLine: 'underline', marginBottom: 15, fontFamily: 'serif', color: '#000' },
  table: { borderWidth: 1, borderColor: '#000', marginBottom: 15 },
  sectionHeader: { fontSize: 11, fontWeight: 'bold', borderBottomWidth: 1, borderColor: '#000', padding: 4, backgroundColor: '#e2e8f0', color: '#000' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' },
  cell: { fontSize: 7, padding: 3, borderRightWidth: 1, borderColor: '#000', color: '#000', fontFamily: 'serif' },
  b: { fontWeight: 'bold' },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },
  wL: { flex: 1 },
  wR: { flex: 1 },
  wTkt: { flex: 0.6 },
  wName: { flex: 2 },
  wPhone: { flex: 1.5 },
  wAgent: { flex: 1.5 },
  wNum: { flex: 0.8 },
  wAmt: { flex: 1.2 },
});
