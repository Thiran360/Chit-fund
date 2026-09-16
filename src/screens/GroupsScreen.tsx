import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  FlatList,
  Alert,
  Linking
} from 'react-native';
import { useFunds } from '../context/FundsContext';
import { useAlert } from '../context/AlertContext';
import { COLORS, BORDER_RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../utils/theme';
import { Card, Button, Badge, TextInput } from '../components/UI';
import { ProgressBar } from '../components/Charts';
import { FundGroup, Member, FundType } from '../types';
import { GroupsIcon, SubscribersIcon, MoneyIcon, ChevronRightIcon, ChevronLeftIcon } from '../components/Icons';

export interface GroupsScreenProps {
  userRole: 'admin' | 'staff';
  onNavigateToCalculations?: (groupId: string) => void;
}

export const GroupsScreen: React.FC<GroupsScreenProps> = ({ userRole, onNavigateToCalculations }) => {
  const { showAlert } = useAlert();
  const { 
    isDarkMode, 
    groups, 
    members, 
    payments, 
    addGroup, 
    deleteGroup,
    recordAuction, 
    recordKittyPayout,
    updatePaymentStatus,
    getGroupInstallmentForMonth,
    registerMemberInGroup,
    removeMemberFromGroup,
    replaceMemberInGroup,
    refreshGroups,
    refreshMembers,
    refreshAssignments,
    refreshCollections
  } = useFunds();
  
  const activeColors = isDarkMode ? COLORS.dark : COLORS.light;

  // Navigation / Selected State
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const activeGroup = groups.find((g) => g.id === selectedGroupId);


  // Modals visibility
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [replaceModalVisible, setReplaceModalVisible] = useState(false);
  
  // Member Replacement states
  const [replacingMemberId, setReplacingMemberId] = useState<string | null>(null);
  const [selectedReplacementMemberId, setSelectedReplacementMemberId] = useState<string | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);

  // Auction Modal
  const [auctionModalVisible, setAuctionModalVisible] = useState(false);
  const [auctionWinnerId, setAuctionWinnerId] = useState<string | null>(null);
  const [auctionBidAmount, setAuctionBidAmount] = useState('');
  const [auctionDate, setAuctionDate] = useState(new Date().toISOString().split('T')[0]);

  // Group Form state
  const [groupName, setGroupName] = useState('');
  const [fundType, setFundType] = useState<FundType>('chit');
  const [totalValue, setTotalValue] = useState('100000');
  const [duration, setDuration] = useState('10');
  const [numMembers, setNumMembers] = useState('10');
  const [commission, setCommission] = useState('5');
  const [interest, setInterest] = useState('8');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  
  // New Admin fields
  const [branchCode, setBranchCode] = useState('4550');
  const [branchName, setBranchName] = useState('GOBICHETTIPALAYAM');
  const [auctionTime, setAuctionTime] = useState('16:00');

  // Loading & Pull-to-refresh states
  const [isCreating, setIsCreating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  const showCustomAlert = showAlert;

  // Handle group deletion
  const handleDeleteGroup = async () => {
    if (!selectedGroupId || !activeGroup) return;

    if (userRole === 'staff') {
      showCustomAlert('Access Denied', 'Admin privileges are required to delete groups.');
      return;
    }

    showCustomAlert(
      'Delete Group?',
      'Are you sure you want to permanently delete the group? This action is irreversible and will delete all subscriber payments logged in this group.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const res = await deleteGroup(selectedGroupId);
              setIsDeleting(false);
              if (res.success) {
                showCustomAlert('Success', 'Group has been successfully deleted.');
                setSelectedGroupId(null);
              } else {
                showCustomAlert('Error', res.error || 'Failed to delete group.');
              }
            } catch (e: any) {
              setIsDeleting(false);
              showCustomAlert('Error', e.message || 'An unexpected error occurred.');
            }
          }
        }
      ]
    );
  };

  // Expanded member payment entry state
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [selectedEntryMonth, setSelectedEntryMonth] = useState<number>(1);
  const [entryAmount, setEntryAmount] = useState<string>('');
  const [entryPaymentMode, setEntryPaymentMode] = useState<'UPI' | 'Cash' | 'Bank Transfer'>('UPI');
  const [entryStatusPaid, setEntryStatusPaid] = useState<boolean>(true);
  const [entryTxRef, setEntryTxRef] = useState<string>('');

  // Open creation modal
  const handleOpenCreateModal = () => {
    setGroupName('');
    setTotalValue('100000');
    setDuration('10');
    setNumMembers('10');
    setCommission('5');
    setInterest('8');
    setStartDate(new Date().toISOString().split('T')[0]);
    setBranchCode('4550');
    setBranchName('GOBICHETTIPALAYAM');
    setAuctionTime('16:00');
    setCreateModalVisible(true);
  };

  const handleRecordAuction = () => {
    if (!selectedGroupId || !activeGroup || !auctionWinnerId) {
      showCustomAlert('Error', 'Please select a winner.');
      return;
    }
    if (activeGroup.type === 'chit' && !auctionBidAmount) {
      showCustomAlert('Error', 'Please enter a bid amount.');
      return;
    }
    
    if (activeGroup.type === 'chit') {
      recordAuction(selectedGroupId, auctionWinnerId, parseFloat(auctionBidAmount), auctionDate);
    } else if (activeGroup.type === 'kitty') {
      recordKittyPayout(selectedGroupId, auctionWinnerId, auctionDate);
    }
    
    setAuctionModalVisible(false);
    setAuctionWinnerId(null);
    setAuctionBidAmount('');
    showCustomAlert('Success', 'Auction/Payout recorded successfully. Member moved to Prized.');
  };

  // Submit new group
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      showCustomAlert('Error', 'Please enter a group name');
      return;
    }
    const val = parseFloat(totalValue);
    const dur = parseInt(duration);
    const mems = parseInt(numMembers);

    if (isNaN(val) || isNaN(dur) || isNaN(mems) || val <= 0 || dur <= 0 || mems <= 0) {
      showCustomAlert('Error', 'Please enter valid numerical values');
      return;
    }

    const monthlyInst = val / mems;

    setIsCreating(true);

    try {
      const result = await addGroup({
        name: groupName,
        type: fundType,
        totalValue: val,
        durationMonths: dur,
        totalMembers: mems,
        monthlyInstallment: Math.round(monthlyInst),
        commissionPercent: fundType === 'chit' ? parseFloat(commission) : 0,
        interestRate: fundType === 'savings' ? parseFloat(interest) : 0,
        startDate,
        status: 'active',
        members: [],
        branchCode,
        branchName,
        auctionTime,
      });

      setIsCreating(false);

      if (result.success) {
        if (result.isFallback) {
          showCustomAlert(
            'Created Locally',
            'Connection to the backend API failed. Group was successfully saved locally on the device.'
          );
        } else {
          showCustomAlert(
            'Success',
            `Group "${groupName}" successfully created and saved on the server API!`
          );
        }
        setCreateModalVisible(false);
      } else {
        showCustomAlert('Error', 'Failed to create group: ' + (result.error || 'Unknown error'));
      }
    } catch (e: any) {
      setIsCreating(false);
      showCustomAlert('Error', 'An unexpected error occurred: ' + e.message);
    }
  };

  // Pull to refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshGroups();
    await refreshMembers();
    await refreshAssignments();
    await refreshCollections();
    setIsRefreshing(false);
  };

  // Assign subscriber
  const handleAssignSubscriber = async (memberId: string) => {
    if (!selectedGroupId) return;
    setAssignModalVisible(false);
    try {
      const res = await registerMemberInGroup(selectedGroupId, memberId);
      if (res.success) {
        showCustomAlert(
          'Success', 
          res.isFallback 
            ? 'Subscriber registered locally (offline).' 
            : 'Subscriber successfully assigned and synchronized with the backend!'
        );
      } else {
        showCustomAlert('Error', res.error || 'Failed to assign subscriber.');
      }
    } catch (e: any) {
      showCustomAlert('Error', e.message || 'An unexpected error occurred.');
    }
  };

  // Handle subscriber replacement
  const handleReplaceMember = async (newMemberId: string) => {
    if (!activeGroup || !replacingMemberId || !newMemberId) {
      showCustomAlert('Error', 'Please select a replacement subscriber.');
      return;
    }

    setReplaceModalVisible(false);
    setIsReplacing(true);
    try {
      const res = await replaceMemberInGroup(activeGroup.id, replacingMemberId, newMemberId);
      setIsReplacing(false);
      
      if (res.success) {
        const oldName = members.find(m => m.id === replacingMemberId)?.name || 'Removed Member';
        const newName = members.find(m => m.id === newMemberId)?.name || 'New Member';
        
        showCustomAlert(
          'Replacement Success',
          res.isFallback
            ? `Successfully replaced ${oldName} with ${newName} locally (offline).`
            : `Successfully replaced ${oldName} with ${newName} on the Django API backend!`
        );
        
        setReplacingMemberId(null);
      } else {
        showCustomAlert('Error', res.error || 'Failed to replace subscriber.');
      }
    } catch (err: any) {
      setIsReplacing(false);
      showCustomAlert('Error', err.message || 'An unexpected error occurred.');
    }
  };

  // Expand / collapse assigned member and load Month 1 payment details
  const handleToggleExpandMember = (mId: string) => {
    if (!selectedGroupId || !activeGroup) return;
    if (expandedMemberId === mId) {
      setExpandedMemberId(null);
    } else {
      setExpandedMemberId(mId);
      setSelectedEntryMonth(1);
      
      const expected = getGroupInstallmentForMonth(selectedGroupId, 1);
      const existing = payments.find(
        (p) => p.groupId === selectedGroupId && p.memberId === mId && p.monthNumber === 1
      );
      const isPaid = existing?.status === 'paid';
      setEntryAmount(isPaid ? existing.amountPaid.toString() : expected.toString());
      setEntryStatusPaid(isPaid);
      setEntryPaymentMode((existing?.paymentMode as any) || 'UPI');
      setEntryTxRef(existing?.transactionRef || `TXN-M${mId.replace('M', '')}-${selectedGroupId}-1`);
    }
  };

  // Select month to load details inside the card
  const handleSelectMonthForEntry = (mId: string, monthNum: number) => {
    if (!selectedGroupId || !activeGroup) return;
    setSelectedEntryMonth(monthNum);
    
    const expected = getGroupInstallmentForMonth(selectedGroupId, monthNum);
    const existing = payments.find(
      (p) => p.groupId === selectedGroupId && p.memberId === mId && p.monthNumber === monthNum
    );
    const isPaid = existing?.status === 'paid';
    setEntryAmount(isPaid ? existing.amountPaid.toString() : expected.toString());
    setEntryStatusPaid(isPaid);
    setEntryPaymentMode((existing?.paymentMode as any) || 'UPI');
    setEntryTxRef(existing?.transactionRef || `TXN-M${mId.replace('M', '')}-${selectedGroupId}-${monthNum}`);
  };

  // Save manual installment record
  const handleSaveCollectionEntry = async (mId: string) => {
    if (!selectedGroupId || !activeGroup) return;

    const amt = parseFloat(entryAmount);
    if (isNaN(amt) || amt < 0) {
      showCustomAlert('Error', 'Please enter a valid amount');
      return;
    }

    setIsSavingPayment(true);
    try {
      const res = await updatePaymentStatus(
        selectedGroupId,
        mId,
        selectedEntryMonth,
        entryStatusPaid,
        {
          amountPaid: isNaN(amt) ? 0 : amt,
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMode: entryPaymentMode,
          transactionRef: entryStatusPaid ? entryTxRef : '',
        }
      );
      setIsSavingPayment(false);

      if (res.success) {
        showCustomAlert(
          'Success', 
          res.isFallback 
            ? `Month ${selectedEntryMonth} payment saved locally (offline).` 
            : `Month ${selectedEntryMonth} payment successfully synchronized with the backend!`
        );
      } else {
        showCustomAlert('Error', res.error || 'Failed to save payment entry.');
      }
    } catch (e: any) {
      setIsSavingPayment(false);
      showCustomAlert('Error', e.message || 'An unexpected error occurred.');
    }
  };

  const handleSendWhatsAppReceipt = (memberObj: any, instPaid: number, totalPaid: number, arrears: number, current: number, totalDue: number, monthNum: number, amountPaid: string) => {
    if (!memberObj?.phone) {
      showCustomAlert('Error', 'Phone number is missing for this member.');
      return;
    }
    const phone = memberObj.phone.replace(/\D/g, '');
    const amtStr = amountPaid.trim() ? amountPaid : '0';
    const message = `*Shri Ram Chits - Payment Receipt*\n\nDear ${memberObj.name},\nWe have received your payment of ₹${amtStr} for Month ${monthNum} in group "${activeGroup?.name}".\n\n*Account Summary:*\n• Total Amount Paid: ₹${totalPaid}\n• Arrears Due: ₹${arrears}\n• Current Month Due: ₹${current}\n• *Total Due: ₹${totalDue}*\n\nThank you!`;
    
    Linking.openURL(`whatsapp://send?phone=91${phone}&text=${encodeURIComponent(message)}`).catch(() => {
      showCustomAlert('Error', 'WhatsApp is not installed on your device or the link could not be opened.');
    });
  };

  // --- RENDERING SCENARIOS ---

  // 1. Group List Render
  if (!selectedGroupId) {
    return (
      <View style={[styles.mainContainer, { backgroundColor: activeColors.background }]}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <GroupsIcon color={activeColors.primary} size={24} />
            <Text style={[styles.headerTitle, { color: activeColors.text, marginLeft: 8 }]}>Fund Groups</Text>
          </View>
          {userRole === 'staff' ? (
            <Button 
              title="+ Create Group" 
              onPress={() => showCustomAlert('Access Denied', 'Admin privileges are required to create new groups.')} 
              size="sm" 
              style={{ backgroundColor: isDarkMode ? '#334155' : '#94A3B8' }} 
            />
          ) : (
            <Button title="+ Create Group" onPress={handleOpenCreateModal} size="sm" style={styles.createBtn} />
          )}
        </View>

        {userRole === 'staff' && (
          <View style={[styles.infoBanner, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: activeColors.border }]}>
            <Text style={[styles.infoBannerText, { color: activeColors.textSecondary }]}>
              🔒 <Text style={{ fontWeight: '700', color: activeColors.text }}>Staff Mode:</Text> View-only access to group settings.
            </Text>
          </View>
        )}

        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          renderItem={({ item }) => {
            const progressRatio = item.type === 'chit' 
              ? item.auctions.length / item.durationMonths 
              : item.type === 'kitty' 
              ? item.kittyPayouts.length / item.durationMonths
              : 0.35; // Default progress mockup for savings RDs
              
            const monthText = item.type === 'chit'
              ? `Month ${item.auctions.length} of ${item.durationMonths}`
              : item.type === 'kitty'
              ? `Month ${item.kittyPayouts.length} of ${item.durationMonths}`
              : `Month 4 of ${item.durationMonths}`;

            return (
              <Card style={styles.groupCard} onPress={() => { setSelectedGroupId(item.id); }}>
                <View style={styles.groupCardHeader}>
                  <View>
                    <Text style={[styles.groupName, { color: activeColors.text }]}>{item.name}</Text>
                    <Text style={[styles.groupInfo, { color: activeColors.textSecondary }]}>
                      Total pot: ₹{item.totalValue.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <Badge label={item.type} type={item.type} />
                </View>

                {/* Progress bar showing chit months progression */}
                <View style={styles.progressRow}>
                  <ProgressBar progress={progressRatio} showText={false} height={6} />
                  <View style={styles.progressBarTextRow}>
                    <Text style={[styles.progressTimelineText, { color: activeColors.textSecondary }]}>{monthText}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <SubscribersIcon color={activeColors.textSecondary} size={12} />
                      <Text style={[styles.membersCountText, { color: activeColors.textSecondary, marginLeft: 4 }]}>
                        {item.members.length}/{item.totalMembers} Slots
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.groupCardFooter}>
                  <Text style={[styles.monthlyInstallmentLabel, { color: activeColors.textSecondary }]}>
                    Base Installment: <Text style={{ color: activeColors.text, fontWeight: '700' }}>₹{item.monthlyInstallment.toLocaleString('en-IN')}</Text>
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.manageBtnLabel, { color: activeColors.primary, marginRight: 2 }]}>Manage</Text>
                    <ChevronRightIcon color={activeColors.primary} size={10} />
                  </View>
                </View>
              </Card>
            );
          }}
        />

        {/* Modal: Create Fund Group */}
        <Modal visible={createModalVisible} transparent animationType="slide" onRequestClose={() => setCreateModalVisible(false)}>
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <View style={[styles.modalContent, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
              <Text style={[styles.modalTitle, { color: activeColors.text }]}>Create Fund Group</Text>
              
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                <TextInput label="Group Name" placeholder="e.g. Platinum 2L Chit" value={groupName} onChangeText={setGroupName} />
                
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <TextInput label="Branch Code" value={branchCode} onChangeText={setBranchCode} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput label="Branch Name" value={branchName} onChangeText={setBranchName} />
                  </View>
                </View>

                <TextInput label="Total Pot Value (₹)" keyboardType="numeric" value={totalValue} onChangeText={setTotalValue} />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <TextInput label="Duration (Months)" keyboardType="numeric" value={duration} onChangeText={setDuration} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput label="Members Count" keyboardType="numeric" value={numMembers} onChangeText={setNumMembers} />
                  </View>
                </View>

                <TextInput label="Admin Commission %" keyboardType="numeric" value={commission} onChangeText={setCommission} />

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <TextInput label="Start Date" placeholder="YYYY-MM-DD" value={startDate} onChangeText={setStartDate} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput label="Auction Time" placeholder="e.g. 16:00" value={auctionTime} onChangeText={setAuctionTime} />
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <Button 
                  title="Cancel" 
                  onPress={() => setCreateModalVisible(false)} 
                  variant="outline" 
                  style={styles.modalBtn} 
                  disabled={isCreating}
                />
                <Button 
                  title={isCreating ? "Creating..." : "Create"} 
                  onPress={handleCreateGroup} 
                  style={styles.modalBtn} 
                  disabled={isCreating}
                />
              </View>
            </View>
          </View>
        </Modal>


      </View>
    );
  }

  if (!activeGroup) {
    return null;
  }

  // 2. Group Detail Mode (When specific Group selected)
  const availableMembers = members.filter((m) => !activeGroup.members.includes(m.id));

  // Render a spreadsheet-like ledger table matching the Shriram Chits Defaulter format
  const renderSubscriberTable = (title: string, memberIds: string[]) => {
    let totalArrears = 0;
    let totalCurrent = 0;

    let elapsedMonths = 0;
    if (activeGroup.startDate) {
      let start = new Date(activeGroup.startDate);
      if (activeGroup.startDate.includes('/')) {
        const parts = activeGroup.startDate.split('/');
        if (parts[0].length === 2 && parts[2]?.length === 4) {
          start = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      }
      if (isNaN(start.getTime())) {
        start = new Date(); // fallback
      }
      const now = new Date();
      const monthDiff = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
      elapsedMonths = Math.max(0, monthDiff);
    }
    
    const recordedEvents = activeGroup.type === 'chit' ? activeGroup.auctions.length : activeGroup.kittyPayouts.length;
    elapsedMonths = Math.max(elapsedMonths, recordedEvents);

    const memberData = memberIds.map((mId, idx) => {
      const memberObj = members.find((m) => m.id === mId);
      const tktNo = memberObj?.groupTktNo || `${idx + 1}`;
      
      let instPaidCount = 0;
      let totalPaidAmount = 0;
      let noOfDueInst = 0;
      let arrearsAmtDue = 0;
      let currentAmtDue = 0;

      for (let m = 1; m <= activeGroup.durationMonths; m++) {
        // Find ANY payment logged for this month (paid or pending)
        const payment = payments.find(
          (p) => p.groupId === activeGroup.id && p.memberId === mId && p.monthNumber === m && (p.status === 'paid' || p.status === 'pending')
        );
        
        const instAmt = getGroupInstallmentForMonth(activeGroup.id, m);
        let amountOwed = instAmt;
        
        if (payment) {
          totalPaidAmount += payment.amountPaid;
          amountOwed = Math.max(0, instAmt - payment.amountPaid);
          if (payment.status === 'paid') {
            instPaidCount++;
          }
        }
        
        // If they still owe money (or haven't paid anything)
        if (amountOwed > 0 || !payment || payment.status === 'pending') {
          if (m <= elapsedMonths) {
            if (amountOwed > 0) noOfDueInst++;
            arrearsAmtDue += amountOwed;
          } else if (m === elapsedMonths + 1) {
            if (amountOwed > 0) noOfDueInst++;
            currentAmtDue += amountOwed;
          } else if (payment && (payment.status === 'pending' || payment.status === 'paid')) {
            // "only admin enter amount pending then calculate other wise not pending"
            // If the admin explicitly logged a payment (even partial/pending) for a future month,
            // we calculate the remaining amount owed.
            if (amountOwed > 0) {
              noOfDueInst++;
              arrearsAmtDue += amountOwed;
            }
          }
        }
      }

      totalArrears += arrearsAmtDue;
      totalCurrent += currentAmtDue;

      return {
        mId,
        memberObj,
        tktNo,
        instPaid: instPaidCount,
        totalPaidAmount,
        noOfDueInst,
        arrearsAmtDue,
        currentAmtDue
      };
    });

    const tableWidth = userRole === 'admin' ? 870 : 800;

    return (
      <View style={{ marginBottom: SPACING.md }}>
        {/* Section Title Bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.sm }}>
          <View style={[styles.premiumAccentBar, { backgroundColor: activeColors.primary }]} />
          <Text style={[styles.sectionHeadingPremium, { color: activeColors.text }]}>
            {title} ({memberIds.length})
          </Text>
        </View>

        {memberIds.length === 0 ? (
          <Card style={{ alignItems: 'center', padding: SPACING.md, borderStyle: 'dashed', borderWidth: 1, borderColor: activeColors.border, marginBottom: SPACING.xl }}>
            <Text style={{ fontSize: 11, color: activeColors.textSecondary, fontWeight: '800', fontStyle: 'italic', letterSpacing: 0.5, textTransform: 'uppercase' }}>
              THERE IS NO {title}
            </Text>
          </Card>
        ) : (
          <View>

            {/* Rows */}
            {memberData.map(({ mId, memberObj, tktNo, instPaid, totalPaidAmount, noOfDueInst, arrearsAmtDue, currentAmtDue }) => {
              const isExpanded = expandedMemberId === mId;
              const memberPayments = payments.filter(
                (p) => p.groupId === activeGroup.id && p.memberId === mId && (p.status === 'paid' || p.paymentDate !== '')
              );

              return (
                <View key={mId} style={{ marginBottom: SPACING.sm, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: activeColors.border, overflow: 'hidden', backgroundColor: activeColors.surfaceCard }}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleToggleExpandMember(mId)}
                    style={{
                      padding: SPACING.md,
                      backgroundColor: isExpanded
                        ? (isDarkMode ? '#0f172a' : '#f8fafc')
                        : 'transparent',
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: activeColors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm }}>
                          <Text style={{ color: activeColors.primary, fontSize: 12, fontWeight: 'bold' }}>#{tktNo}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: 'bold', color: activeColors.text }} numberOfLines={1}>{memberObj?.name || 'Unknown'}</Text>
                          <Text style={{ fontSize: 11, color: activeColors.textSecondary, marginTop: 2 }} numberOfLines={1}>{memberObj?.phone || 'N/A'} • Agent: {memberObj?.agentName || 'N/A'}</Text>
                        </View>
                      </View>
                      
                      {userRole === 'admin' && (
                        <TouchableOpacity
                          style={[styles.actionBtnMini, { backgroundColor: isDarkMode ? '#3f1a1a' : '#fee2e2', paddingVertical: 4, paddingHorizontal: 8, alignSelf: 'center', marginLeft: SPACING.sm }]}
                          onPress={(e) => {
                            e.stopPropagation();
                            showCustomAlert(
                              'Remove Subscriber',
                              `Are you sure you want to remove ${memberObj?.name || 'this subscriber'} from the group?`,
                              [
                                { text: 'Cancel', style: 'cancel' },
                                { 
                                  text: 'Remove', 
                                  style: 'destructive',
                                  onPress: async () => {
                                    try {
                                      const res = await removeMemberFromGroup(activeGroup.id, mId);
                                      if (res.success) {
                                        showCustomAlert(
                                          'Success', 
                                          res.isFallback 
                                            ? 'Subscriber removed locally (offline).' 
                                            : 'Subscriber successfully removed and synchronized with the backend!'
                                        );
                                        setExpandedMemberId(null);
                                      } else {
                                        showCustomAlert('Error', res.error || 'Failed to remove subscriber.');
                                      }
                                    } catch (err: any) {
                                      showCustomAlert('Error', err.message || 'An unexpected error occurred.');
                                    }
                                  }
                                }
                              ]
                            );
                          }}
                        >
                          <Text style={{ color: COLORS.dark.danger, fontSize: 10, fontWeight: 'bold' }}>Delete</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={{ flexDirection: 'row', backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9', borderRadius: BORDER_RADIUS.sm, padding: SPACING.sm }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 9, color: activeColors.textSecondary, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 2 }}>Total Paid</Text>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: activeColors.success }}>₹{totalPaidAmount.toLocaleString('en-IN')}</Text>
                      </View>
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={{ fontSize: 9, color: activeColors.textSecondary, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 2 }}>Due Inst</Text>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: noOfDueInst > 0 ? activeColors.danger : activeColors.text }}>{noOfDueInst}</Text>
                      </View>
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={{ fontSize: 9, color: activeColors.textSecondary, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 2 }}>Total Due</Text>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: (arrearsAmtDue + currentAmtDue) > 0 ? activeColors.danger : activeColors.text }}>₹{(arrearsAmtDue + currentAmtDue).toLocaleString('en-IN')}</Text>
                      </View>
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={{ fontSize: 9, color: activeColors.textSecondary, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 2 }}>Arrears Due</Text>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: arrearsAmtDue > 0 ? activeColors.danger : activeColors.text }}>₹{arrearsAmtDue.toLocaleString('en-IN')}</Text>
                      </View>
                      <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 9, color: activeColors.textSecondary, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 2 }}>Current Due</Text>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: currentAmtDue > 0 ? (activeColors.warning || '#D97706') : activeColors.text }}>₹{currentAmtDue.toLocaleString('en-IN')}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Sub-table Expanded payment entry drawer */}
                  {isExpanded && (
                    <View style={{ backgroundColor: isDarkMode ? '#0b0f19' : '#ffffff', borderTopWidth: 1, borderTopColor: activeColors.border, paddingBottom: SPACING.md }}>
                       <Text style={[styles.drawerSectionTitle, { color: activeColors.text, paddingHorizontal: SPACING.md, marginTop: SPACING.sm }]}>
                         Month-by-Month Installments
                       </Text>
                       
                       <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.monthScrollRow, { paddingHorizontal: SPACING.md }]}>
                         {Array.from({ length: activeGroup.durationMonths }).map((_, monthIdx) => {
                           const monthNum = monthIdx + 1;
                           const isSelected = selectedEntryMonth === monthNum;
                           const monthPayment = payments.find(
                             (p) => p.groupId === activeGroup.id && p.memberId === mId && p.monthNumber === monthNum
                           );
                           const isPaid = monthPayment?.status === 'paid';

                           // It's pending if there's an explicit pending record, OR if it's not paid and is due (past or current month)
                           const isPending = (monthPayment?.status === 'pending' && monthPayment.paymentDate !== '') || (!isPaid && monthNum <= elapsedMonths + 1);

                           return (
                             <TouchableOpacity
                               key={monthIdx}
                               style={[
                                 styles.monthEntryPill,
                                 {
                                   borderColor: isSelected 
                                     ? activeColors.primary 
                                     : isPaid 
                                     ? activeColors.success 
                                     : isPending
                                     ? '#F59E0B'
                                     : activeColors.border,
                                   backgroundColor: isSelected 
                                     ? activeColors.primaryLight 
                                     : isPaid 
                                     ? `${activeColors.success}15`
                                     : isPending
                                     ? '#F59E0B15'
                                     : 'transparent',
                                 }
                               ]}
                               onPress={() => handleSelectMonthForEntry(mId, monthNum)}
                             >
                               <Text style={[
                                 styles.monthEntryPillText, 
                                 { 
                                   color: isSelected 
                                     ? activeColors.primary 
                                     : isPaid 
                                     ? activeColors.success 
                                     : isPending
                                     ? '#F59E0B'
                                     : activeColors.text,
                                   fontWeight: isSelected || isPaid || isPending ? '700' : '400'
                                 }
                               ]}>
                                 M{monthNum}{isPaid ? ' ✓' : isPending ? ' ⏳' : ''}
                               </Text>
                             </TouchableOpacity>
                           );
                         })}
                       </ScrollView>

                       {/* Payment Entry Form Card */}
                       <View style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.md }}>
                         <View 
                           style={[styles.entryFormCardPremium, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', borderColor: activeColors.border, marginTop: SPACING.sm }]}
                         >
                           <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm }}>
                             <Text style={{ fontSize: 13, fontWeight: 'bold', color: activeColors.text }}>
                               Enter Payment: Month {selectedEntryMonth}
                             </Text>
                             <Text style={{ fontSize: 11, color: activeColors.textSecondary, fontWeight: '600' }}>
                               Expected: ₹{getGroupInstallmentForMonth(activeGroup.id, selectedEntryMonth).toLocaleString('en-IN')}
                             </Text>
                           </View>

                           {/* Paid/Pending Toggle */}
                           <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm }}>
                             <TouchableOpacity
                               style={[
                                 styles.toggleButton,
                                 {
                                   borderColor: entryStatusPaid ? activeColors.success : activeColors.border,
                                   backgroundColor: entryStatusPaid ? `${activeColors.success}15` : 'transparent',
                                 }
                               ]}
                               onPress={() => setEntryStatusPaid(true)}
                             >
                               <Text style={{ color: entryStatusPaid ? activeColors.success : activeColors.textSecondary, fontWeight: '700', fontSize: 12 }}>
                                 ✓ PAID
                               </Text>
                             </TouchableOpacity>

                             <TouchableOpacity
                               style={[
                                 styles.toggleButton,
                                 {
                                   borderColor: !entryStatusPaid ? activeColors.danger : activeColors.border,
                                   backgroundColor: !entryStatusPaid ? `${activeColors.danger}15` : 'transparent',
                                 }
                               ]}
                               onPress={() => setEntryStatusPaid(false)}
                             >
                               <Text style={{ color: !entryStatusPaid ? activeColors.danger : activeColors.textSecondary, fontWeight: '700', fontSize: 12 }}>
                                 ✗ PENDING
                               </Text>
                             </TouchableOpacity>
                           </View>

                           <View>
                             <TextInput
                               label="Manually Received Amount (₹)"
                                 keyboardType="numeric"
                                 value={entryAmount}
                                 onChangeText={setEntryAmount}
                                 style={{ marginBottom: SPACING.sm }}
                               />

                               <Text style={{ fontSize: TYPOGRAPHY.size.xs, fontWeight: '600', color: activeColors.textSecondary, marginBottom: 6 }}>
                                 Payment Mode
                               </Text>
                               <View style={{ flexDirection: 'row', gap: 6, marginBottom: SPACING.sm }}>
                                 {(['UPI', 'Cash', 'Bank Transfer'] as const).map((mode) => (
                                   <TouchableOpacity
                                     key={mode}
                                     style={{
                                       flex: 1,
                                       borderWidth: 1,
                                       borderColor: entryPaymentMode === mode ? activeColors.primary : activeColors.border,
                                       backgroundColor: entryPaymentMode === mode ? activeColors.primaryLight : 'transparent',
                                       paddingVertical: 8,
                                       borderRadius: BORDER_RADIUS.sm,
                                       alignItems: 'center'
                                     }}
                                     onPress={() => setEntryPaymentMode(mode)}
                                   >
                                     <Text style={{ fontSize: 10, fontWeight: '700', color: entryPaymentMode === mode ? activeColors.primary : activeColors.textSecondary }}>
                                       {mode}
                                     </Text>
                                   </TouchableOpacity>
                                 ))}
                               </View>

                               <TextInput
                                 label="Transaction Ref / Note"
                                 placeholder="e.g. UPI Ref, Cash details..."
                                 value={entryTxRef}
                                 onChangeText={setEntryTxRef}
                                 style={{ marginBottom: SPACING.sm }}
                               />
                             </View>

                             <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs }}>
                              <Button
                                style={{ flex: 1 }}
                                title={isSavingPayment ? "Synchronizing..." : "Save Collection Entry"}
                                onPress={() => handleSaveCollectionEntry(mId)}
                                disabled={isSavingPayment}
                                size="sm"
                              />
                              <TouchableOpacity
                                style={{ backgroundColor: '#25D366', borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, justifyContent: 'center', alignItems: 'center' }}
                                onPress={() => handleSendWhatsAppReceipt(memberObj, instPaid, totalPaidAmount, arrearsAmtDue, currentAmtDue, arrearsAmtDue + currentAmtDue, selectedEntryMonth, entryAmount)}
                              >
                                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13 }}>WhatsApp</Text>
                              </TouchableOpacity>
                            </View>
                         </View>

                         {/* Stored Collections */}
                         <Text style={[styles.drawerSectionTitle, { color: activeColors.text, marginTop: SPACING.md, marginBottom: SPACING.xs }]}>
                           Stored Payment Collections Log
                         </Text>
                         
                         {memberPayments.length === 0 ? (
                           <Text style={{ fontSize: TYPOGRAPHY.size.xs, color: activeColors.textMuted, fontStyle: 'italic', marginVertical: 4 }}>
                             No payment collections logged yet.
                           </Text>
                         ) : (
                           <View style={{ gap: SPACING.xs, marginVertical: 4 }}>
                             {memberPayments
                               .sort((a, b) => a.monthNumber - b.monthNumber)
                               .map((p) => (
                                 <View 
                                   key={p.id} 
                                   style={[
                                     styles.receiptRowPremium,
                                     { 
                                       backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', 
                                       borderColor: p.status === 'pending' ? '#F59E0B50' : activeColors.border
                                     }
                                   ]}
                                 >
                                   <View style={{ flex: 1 }}>
                                     <Text style={{ fontSize: 12, fontWeight: '700', color: activeColors.text }}>
                                       Month {p.monthNumber} • {p.paymentMode}
                                     </Text>
                                     {p.transactionRef ? (
                                       <Text style={{ fontSize: 10, color: activeColors.textSecondary, marginTop: 2 }}>
                                         Ref: {p.transactionRef}
                                       </Text>
                                     ) : null}
                                     {p.paymentDate ? (
                                       <Text style={{ fontSize: 10, color: activeColors.textMuted, marginTop: 2 }}>
                                         {p.paymentDate}
                                       </Text>
                                     ) : null}
                                   </View>
                                   <View style={{ alignItems: 'flex-end', gap: 6 }}>
                                     <Text style={{ 
                                       fontSize: 12, 
                                       fontWeight: 'bold', 
                                       color: p.status === 'pending' ? '#F59E0B' : activeColors.success 
                                     }}>
                                       {p.status === 'pending' ? 'PENDING' : `₹${p.amountPaid.toLocaleString('en-IN')}`}
                                     </Text>
                                     {p.status === 'pending' && userRole === 'admin' && (
                                       <TouchableOpacity
                                         style={{
                                           backgroundColor: '#22C55E18',
                                           borderWidth: 1,
                                           borderColor: '#22C55E60',
                                           borderRadius: 6,
                                           paddingVertical: 3,
                                           paddingHorizontal: 8,
                                         }}
                                         onPress={() => {
                                           showCustomAlert(
                                             'Mark as Paid',
                                             `Update Month ${p.monthNumber} for ${memberObj?.name || 'this member'} from PENDING to PAID?`,
                                             [
                                               { text: 'Cancel', style: 'cancel' },
                                               {
                                                 text: 'Mark Paid',
                                                 onPress: async () => {
                                                   const amt = getGroupInstallmentForMonth(activeGroup.id, p.monthNumber);
                                                   const res = await updatePaymentStatus(
                                                     activeGroup.id,
                                                     mId,
                                                     p.monthNumber,
                                                     true,
                                                     {
                                                       amountPaid: amt,
                                                       paymentDate: new Date().toISOString().split('T')[0],
                                                       paymentMode: p.paymentMode || 'Cash',
                                                       transactionRef: p.transactionRef || '',
                                                     }
                                                   );
                                                   if (res.success) {
                                                     showCustomAlert('Success', `Month ${p.monthNumber} marked as Paid!`);
                                                   } else {
                                                     showCustomAlert('Error', res.error || 'Failed to update payment.');
                                                   }
                                                 }
                                               }
                                             ]
                                           );
                                         }}
                                       >
                                         <Text style={{ fontSize: 10, fontWeight: '700', color: '#22C55E' }}>Mark Paid ✓</Text>
                                       </TouchableOpacity>
                                     )}
                                   </View>
                                 </View>
                               ))}
                           </View>
                         )}
                       </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: activeColors.background }]}>
      
      {/* Detail Header */}
      <View style={[styles.detailHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomColor: activeColors.border, backgroundColor: activeColors.surface }]}>
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={[styles.backButton, { flexDirection: 'row', alignItems: 'center' }]} onPress={() => setSelectedGroupId(null)}>
            <ChevronLeftIcon color={activeColors.primary} size={14} />
            <Text style={[styles.backButtonText, { color: activeColors.primary, marginLeft: 4 }]}>Back to Groups</Text>
          </TouchableOpacity>
          <Text style={[styles.detailTitle, { color: activeColors.text }]}>{activeGroup.name}</Text>
          <View style={styles.badgeRow}>
            <Badge label={`${activeGroup.type} scheme`} type={activeGroup.type} />
            <Badge label={activeGroup.status} type={activeGroup.status === 'active' ? 'active' : 'completed'} />
          </View>
        </View>
        <Button 
          title="Full Fund Details"
          onPress={() => onNavigateToCalculations?.(activeGroup.id)}
          size="sm"
          style={{ backgroundColor: activeColors.primary }}
        />
      </View>

      {/* Scrollable Layout for Group Details and Members */}
      <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
        
        {/* Unified selected group details */}
        <Card style={[styles.cardInfoPremium, { backgroundColor: activeColors.surfaceCard, borderColor: isDarkMode ? '#6366F125' : '#0066FF15' }]}>
          <View style={[styles.premiumAccentTitleContainer, { justifyContent: 'space-between' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.premiumAccentBar, { backgroundColor: activeColors.primary }]} />
              <Text style={[styles.cardHeadingPremium, { color: activeColors.text }]}>Group Parameters</Text>
            </View>
            {userRole === 'admin' && activeGroup.status === 'active' && (
              <Button 
                title="Conduct Auction" 
                size="sm" 
                onPress={() => {
                  setAuctionDate(new Date().toISOString().split('T')[0]);
                  setAuctionBidAmount('');
                  setAuctionWinnerId(null);
                  setAuctionModalVisible(true);
                }} 
                style={{ backgroundColor: activeColors.success }} 
              />
            )}
          </View>
          
          <View style={styles.paramGridPremium}>
            <View style={styles.paramItemPremium}>
              <Text style={[styles.paramLabelPremium, { color: activeColors.textSecondary }]}>Scheme Pot</Text>
              <Text style={[styles.paramValuePremium, { color: activeColors.primary }]}>₹{activeGroup.totalValue.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.paramItemPremium}>
              <Text style={[styles.paramLabelPremium, { color: activeColors.textSecondary }]}>Duration</Text>
              <Text style={[styles.paramValuePremium, { color: activeColors.text }]}>{activeGroup.durationMonths} Months</Text>
            </View>

            <View style={styles.paramItemPremium}>
              <Text style={[styles.paramLabelPremium, { color: activeColors.textSecondary }]}>Monthly Base Amt</Text>
              <Text style={[styles.paramValuePremium, { color: activeColors.text }]}>₹{activeGroup.monthlyInstallment.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.paramItemPremium}>
              <Text style={[styles.paramLabelPremium, { color: activeColors.textSecondary }]}>Scheme Type</Text>
              <Badge label={`${activeGroup.type}`} type={activeGroup.type} />
            </View>

            <View style={styles.paramItemPremium}>
              <Text style={[styles.paramLabelPremium, { color: activeColors.textSecondary }]}>Start Date</Text>
              <Text style={[styles.paramValuePremium, { color: activeColors.text }]}>{activeGroup.startDate}</Text>
            </View>

            <View style={styles.paramItemPremium}>
              <Text style={[styles.paramLabelPremium, { color: activeColors.textSecondary }]}>Capacity Slots</Text>
              <Text style={[styles.paramValuePremium, { color: activeColors.text }]}>{activeGroup.members.length} / {activeGroup.totalMembers}</Text>
            </View>
          </View>

          {/* Danger Zone / Delete Group Section */}
          <View style={{ height: 1, backgroundColor: activeColors.border, marginVertical: SPACING.md }} />
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, marginRight: SPACING.md }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: activeColors.danger }}>Danger Zone</Text>
              <Text style={{ fontSize: 10, color: activeColors.textSecondary, marginTop: 2 }}>
                Permanently delete this group and all its records.
              </Text>
            </View>
            
            {userRole === 'staff' ? (
              <Button
                title="Delete Group"
                variant="outline"
                onPress={() => showCustomAlert('Access Denied', 'Admin privileges are required to delete groups.')}
                style={{
                  borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                  backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                }}
                textStyle={{
                  color: activeColors.textMuted,
                }}
              />
            ) : (
              <Button
                title={isDeleting ? "Deleting..." : "Delete Group"}
                variant="outline"
                disabled={isDeleting}
                onPress={handleDeleteGroup}
                style={{
                  borderColor: activeColors.danger,
                }}
                textStyle={{
                  color: activeColors.danger,
                }}
              />
            )}
          </View>
        </Card>

        {/* Group Members Section */}
        <View style={styles.sectionDividerRow}>
          <View style={styles.premiumAccentTitleContainer}>
            <View style={[styles.premiumAccentBar, { backgroundColor: activeColors.primary }]} />
            <Text style={[styles.sectionHeadingPremium, { color: activeColors.text }]}>Group Members</Text>
          </View>
          {activeGroup.members.length < activeGroup.totalMembers && (
            userRole === 'staff' ? (
              <Button 
                title="+ Add Member Slot" 
                onPress={() => showCustomAlert('Access Denied', 'Admin privileges are required to assign member slots.')} 
                size="sm" 
                style={{ backgroundColor: isDarkMode ? '#334155' : '#94A3B8' }} 
              />
            ) : (
              <Button title="+ Add Member Slot" onPress={() => setAssignModalVisible(true)} size="sm" />
            )
          )}
        </View>

        {activeGroup.members.length === 0 ? (
          <Card style={{ alignItems: 'center', padding: SPACING.xl, marginBottom: SPACING.md }}>
            <Text style={[styles.emptyLabel, { color: activeColors.textSecondary }]}>No members assigned to this group yet.</Text>
            {userRole === 'staff' ? (
              <Button 
                title="Assign Slot Now" 
                onPress={() => showCustomAlert('Access Denied', 'Admin privileges are required to assign member slots.')} 
                size="sm" 
                style={{ marginTop: SPACING.md, backgroundColor: isDarkMode ? '#334155' : '#94A3B8' }} 
              />
            ) : (
              <Button title="Assign Slot Now" onPress={() => setAssignModalVisible(true)} size="sm" style={{ marginTop: SPACING.md }} />
            )}
          </Card>
        ) : (
          <View>
            {renderSubscriberTable('Active Subscribers', activeGroup.members)}
          </View>
        )}


      </ScrollView>

      {/* Modal: Assign Subscriber to Slot */}
      <Modal visible={assignModalVisible} transparent animationType="slide" onRequestClose={() => setAssignModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
            <Text style={[styles.modalTitle, { color: activeColors.text }]}>Select Subscriber</Text>
            
            {availableMembers.length === 0 ? (
              <Text style={[styles.emptyLabel, { color: activeColors.textSecondary, marginVertical: SPACING.md }]}>
                No registered members available to join this group. Register more members first.
              </Text>
            ) : (
              <FlatList
                data={availableMembers}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: 300 }}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[styles.memberSelectItem, { borderBottomColor: activeColors.border }]}
                    onPress={() => handleAssignSubscriber(item.id)}
                  >
                    <Text style={[styles.memberSelectName, { color: activeColors.text }]}>{item.name}</Text>
                    <Text style={[styles.memberSelectPhone, { color: activeColors.textSecondary }]}>{item.phone}</Text>
                  </TouchableOpacity>
                )}
              />
            )}

            <Button title="Close" onPress={() => setAssignModalVisible(false)} variant="outline" style={{ marginTop: SPACING.md }} />
          </View>
        </View>
      </Modal>

      {/* Modal: Replace Subscriber */}
      <Modal visible={replaceModalVisible} transparent animationType="slide" onRequestClose={() => setReplaceModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
            <Text style={[styles.modalTitle, { color: activeColors.text }]}>Replace Subscriber</Text>
            
            <Text style={{ fontSize: 12, color: activeColors.textSecondary, marginBottom: SPACING.md }}>
              Choose a registered member who is not currently in this group to replace the selected removed subscriber.
            </Text>

            {availableMembers.length === 0 ? (
              <Text style={[styles.emptyLabel, { color: activeColors.textSecondary, marginVertical: SPACING.md }]}>
                No registered members available to join this group. Register more members first.
              </Text>
            ) : (
              <FlatList
                data={availableMembers}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: 300 }}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[styles.memberSelectItem, { borderBottomColor: activeColors.border }]}
                    onPress={() => handleReplaceMember(item.id)}
                  >
                    <Text style={[styles.memberSelectName, { color: activeColors.text }]}>{item.name}</Text>
                    <Text style={[styles.memberSelectPhone, { color: activeColors.textSecondary }]}>{item.phone}</Text>
                  </TouchableOpacity>
                )}
              />
            )}

            <Button title="Close" onPress={() => setReplaceModalVisible(false)} variant="outline" style={{ marginTop: SPACING.md }} />
          </View>
        </View>
      </Modal>

      {/* Modal: Conduct Auction */}
      <Modal visible={auctionModalVisible} transparent animationType="slide" onRequestClose={() => setAuctionModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
            <Text style={[styles.modalTitle, { color: activeColors.text }]}>Record {activeGroup?.type === 'chit' ? 'Auction' : 'Payout'}</Text>
            
            <Text style={{ fontSize: 12, color: activeColors.textSecondary, marginBottom: SPACING.md }}>
              Select a Non-Prized member to declare as the winner for this month.
            </Text>

            <View style={{ maxHeight: 200, marginBottom: SPACING.md }}>
              <FlatList
                data={activeGroup?.members.filter(mId => {
                  if (activeGroup.type === 'chit') {
                    return !activeGroup.auctions.some(a => a.winnerMemberId === mId);
                  }
                  return !activeGroup.kittyPayouts.some(k => k.winnerMemberId === mId);
                }).map(id => members.find(m => m.id === id)).filter(Boolean) || []}
                keyExtractor={(item) => item!.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[styles.memberSelectItem, { 
                      borderBottomColor: activeColors.border,
                      backgroundColor: auctionWinnerId === item!.id ? (isDarkMode ? '#1e293b' : '#f1f5f9') : 'transparent'
                    }]}
                    onPress={() => setAuctionWinnerId(item!.id)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: activeColors.primary, marginRight: 10, justifyContent: 'center', alignItems: 'center' }}>
                        {auctionWinnerId === item!.id && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: activeColors.primary }} />}
                      </View>
                      <View>
                        <Text style={[styles.memberSelectName, { color: activeColors.text }]}>{item!.name}</Text>
                        <Text style={[styles.memberSelectPhone, { color: activeColors.textSecondary }]}>{item!.phone}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>

            {activeGroup?.type === 'chit' && (
              <TextInput 
                label="Bid Amount (₹)" 
                keyboardType="numeric" 
                value={auctionBidAmount} 
                onChangeText={setAuctionBidAmount} 
                placeholder="Discount bid by winner" 
                style={{ marginBottom: SPACING.sm }}
              />
            )}

            <TextInput 
              label="Date" 
              value={auctionDate} 
              onChangeText={setAuctionDate} 
              placeholder="YYYY-MM-DD" 
            />

            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={() => setAuctionModalVisible(false)} variant="outline" style={styles.modalBtn} />
              <Button title="Record Winner" onPress={handleRecordAuction} style={[styles.modalBtn, { backgroundColor: activeColors.success }]} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  infoBanner: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoBannerText: {
    fontSize: 11,
    fontWeight: '500',
  },
  mainContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: 'bold',
  },
  createBtn: {
    alignSelf: 'center',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 80,
  },
  groupCard: {
    marginBottom: SPACING.md,
  },
  groupCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  groupName: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: 'bold',
  },
  groupInfo: {
    fontSize: TYPOGRAPHY.size.xs,
    marginTop: 2,
  },
  progressRow: {
    marginVertical: SPACING.md,
  },
  progressBarTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressTimelineText: {
    fontSize: 10,
    fontWeight: '600',
  },
  membersCountText: {
    fontSize: 10,
    fontWeight: '600',
  },
  groupCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  monthlyInstallmentLabel: {
    fontSize: TYPOGRAPHY.size.xs,
  },
  manageBtnLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: 'bold',
  },
  detailHeader: {
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  backButton: {
    marginBottom: SPACING.xs,
  },
  backButtonText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: 'bold',
  },
  detailTitle: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: 'bold',
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 6,
    gap: SPACING.sm,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderBottomWidth: 3,
  },
  tabText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabContent: {
    padding: SPACING.md,
    paddingBottom: 90,
  },
  cardInfo: {
    marginBottom: SPACING.md,
  },
  cardHeading: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  paramGrid: {
    gap: SPACING.sm,
  },
  paramRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paramLabel: {
    fontSize: TYPOGRAPHY.size.sm,
  },
  paramValue: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCol: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  summaryVal: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: 'bold',
    marginTop: 4,
  },
  progressSubLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '600',
    marginBottom: 6,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  panelTitle: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: 'bold',
  },
  emptyLabel: {
    fontSize: TYPOGRAPHY.size.sm,
    textAlign: 'center',
  },
  subscriberCard: {
    marginVertical: 4,
  },
  subscriberInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketBadge: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ticketNumber: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  subscriberName: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: 'bold',
  },
  subscriberPhone: {
    fontSize: 11,
  },
  auctionCalculatorCard: {
    marginBottom: SPACING.md,
  },
  inputHeading: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '600',
    marginBottom: 6,
  },
  pickerSelector: {
    marginBottom: SPACING.md,
  },
  bidderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: 4,
  },
  bidderPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
  },
  bidderPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  calcBox: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
  },
  calcTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  calcLabel: {
    fontSize: 11,
  },
  calcVal: {
    fontSize: 11,
    fontWeight: '600',
  },
  calcDivider: {
    borderBottomWidth: 1,
    marginVertical: SPACING.sm,
  },
  auctionCard: {
    marginBottom: SPACING.sm,
  },
  auctionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  auctionMonth: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: 'bold',
  },
  auctionDate: {
    fontSize: TYPOGRAPHY.size.xs,
  },
  auctionDetailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: 4,
  },
  aucDetailCol: {
    minWidth: '22%',
  },
  aucLabel: {
    fontSize: 8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  aucVal: {
    fontSize: 11,
    marginTop: 2,
  },
  trackerHeader: {
    marginBottom: SPACING.md,
  },
  trackerSub: {
    fontSize: TYPOGRAPHY.size.xs,
    marginTop: 2,
  },
  gridBox: {
    padding: SPACING.sm,
  },
  gridHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  gridHeaderLabelCell: {
    width: 100,
    justifyContent: 'center',
  },
  gridHeaderCell: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridColHeader: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  gridDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  gridRowName: {
    fontSize: 11,
    fontWeight: '600',
  },
  gridCell: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.xs,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  cellText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 420,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    ...SHADOWS.lg,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  typeSelectLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '600',
    marginTop: SPACING.sm,
    marginBottom: 6,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeTabText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  modalBtn: {
    flex: 0.48,
  },
  memberSelectItem: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  memberSelectName: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: 'bold',
  },
  memberSelectPhone: {
    fontSize: TYPOGRAPHY.size.xs,
    marginTop: 2,
  },
  expandedDrawer: {
    marginTop: SPACING.md,
  },
  drawerSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  monthScrollRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  monthEntryPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    minWidth: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthEntryPillText: {
    fontSize: 11,
  },
  entryFormCard: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  toggleButton: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfoPremium: {
    marginBottom: SPACING.lg,
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  premiumAccentTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  premiumAccentBar: {
    width: 4,
    height: 18,
    borderRadius: BORDER_RADIUS.xs,
    marginRight: SPACING.sm,
  },
  cardHeadingPremium: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  paramGridPremium: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  paramItemPremium: {
    width: '46%',
    marginBottom: SPACING.xs,
  },
  paramLabelPremium: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  paramValuePremium: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '700',
  },
  sectionDividerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionHeadingPremium: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subscriberCardPremium: {
    marginVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  memberAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '800',
  },
  entryFormCardPremium: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  receiptRowPremium: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    marginVertical: 3,
  },
  tableContainerPremium: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginTop: SPACING.md,
  },
  tableHeaderRowPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1.5,
  },
  tableHeaderCellPremium: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 8,
  },
  tableBodyRowPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 56,
  },
  tableAvatarMini: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  tableAvatarMiniText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  tableNameText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  tablePhoneText: {
    fontSize: 10,
  },
  miniPillStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.xs,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnMini: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedDrawerInline: {
    paddingBottom: SPACING.md,
  },
});
