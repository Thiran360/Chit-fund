import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  FlatList,
  Alert
} from 'react-native';
import { useFunds } from '../context/FundsContext';
import { useAlert } from '../context/AlertContext';
import { COLORS, BORDER_RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../utils/theme';
import { Card, Button, Badge, TextInput } from '../components/UI';

import { 
  SubscribersIcon, 
  PhoneIcon, 
  EmailIcon, 
  LocationIcon, 
  ChevronRightIcon, 
  ChevronLeftIcon,
  GroupsIcon,
  MoneyIcon,
  LogoutIcon
} from '../components/Icons';

export interface MembersScreenProps {
  userRole: 'admin' | 'staff';
  onLogout?: () => void;
}

export const MembersScreen: React.FC<MembersScreenProps> = ({ userRole, onLogout }) => {
  const { showAlert } = useAlert();
  const { 
    isDarkMode, 
    members, 
    groups, 
    addMember, 
    deleteMember,
    getMemberLedger,
    refreshMembers 
  } = useFunds();
  
  const activeColors = isDarkMode ? COLORS.dark : COLORS.light;

  // Selected State
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  
  // Modals Visibility
  const [registerModalVisible, setRegisterModalVisible] = useState(false);

  // Form Step State
  const [registerStep, setRegisterStep] = useState(1);

  // Form Registration State (Enrollment Form Fields)
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [branchName, setBranchName] = useState('');
  const [agentName, setAgentName] = useState('');
  const [chitValue, setChitValue] = useState('');
  const [groupTktNo, setGroupTktNo] = useState('');
  const [duration, setDuration] = useState('');
  const [monthlyInstAmt, setMonthlyInstAmt] = useState('');
  const [admissionFees, setAdmissionFees] = useState('');
  const [fatherHusbandName, setFatherHusbandName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [subscriberStatus, setSubscriberStatus] = useState<'Individual' | 'Firm'>('Individual');
  const [gstNo, setGstNo] = useState('');
  const [incomeSource, setIncomeSource] = useState<'Salary' | 'Business' | 'Others'>('Salary');
  const [incomeSourceOthers, setIncomeSourceOthers] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [accountType, setAccountType] = useState<'SB' | 'CA'>('SB');
  const [accountNo, setAccountNo] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeAge, setNomineeAge] = useState('');
  const [nomineeRelationship, setNomineeRelationship] = useState('');
  const [witness1NameAddress, setWitness1NameAddress] = useState('');
  const [witness2NameAddress, setWitness2NameAddress] = useState('');
  const [identityProofType, setIdentityProofType] = useState<'PAN' | 'AADHAR' | 'VOTER ID'>('AADHAR');
  const [identityProofNo, setIdentityProofNo] = useState('');
  const [place, setPlace] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Handle open registration modal
  const handleOpenRegister = () => {
    // Reset all form inputs
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setBranchName('');
    setAgentName('');
    setChitValue('');
    setGroupTktNo('');
    setDuration('');
    setMonthlyInstAmt('');
    setAdmissionFees('');
    setFatherHusbandName('');
    setDob('');
    setGender('Male');
    setMaritalStatus('');
    setSubscriberStatus('Individual');
    setGstNo('');
    setIncomeSource('Salary');
    setIncomeSourceOthers('');
    setBankName('');
    setBankBranch('');
    setAccountType('SB');
    setAccountNo('');
    setIfscCode('');
    setOfficeAddress('');
    setNomineeName('');
    setNomineeAge('');
    setNomineeRelationship('');
    setWitness1NameAddress('');
    setWitness2NameAddress('');
    setIdentityProofType('AADHAR');
    setIdentityProofNo('');
    setPlace('Gobichettipalayam');
    setDate(new Date().toISOString().split('T')[0]);
    
    setRegisterStep(1);
    setRegisterModalVisible(true);
  };

  // Submit registration
  const handleRegisterMember = async () => {
    if (!name.trim()) {
      showAlert('Error', 'Subscriber Name is required in Step 2');
      setRegisterStep(2);
      return;
    }

    if (!phone.trim()) {
      showAlert('Error', 'Mobile Number is required in Step 3');
      setRegisterStep(3);
      return;
    }
    
    if (!address.trim()) {
      showAlert('Error', 'Residential Address is required in Step 3');
      setRegisterStep(3);
      return;
    }

    const result = await addMember({
      name,
      phone,
      email: email || 'N/A',
      address,
      joiningDate: date || new Date().toISOString().split('T')[0],
      
      // Chit enrollment fields
      branchName: branchName || 'N/A',
      agentName: agentName || 'N/A',
      chitValue: chitValue || 'N/A',
      groupTktNo: groupTktNo || 'N/A',
      duration: duration || 'N/A',
      monthlyInstAmt: monthlyInstAmt || 'N/A',
      admissionFees: admissionFees || 'N/A',
      fatherHusbandName: fatherHusbandName || 'N/A',
      dob: dob || 'N/A',
      gender,
      maritalStatus: maritalStatus || 'N/A',
      subscriberStatus,
      gstNo: gstNo || 'N/A',
      incomeSource,
      incomeSourceOthers: incomeSource === 'Others' ? incomeSourceOthers : 'N/A',
      bankName: bankName || 'N/A',
      bankBranch: bankBranch || 'N/A',
      accountType,
      accountNo: accountNo || 'N/A',
      ifscCode: ifscCode || 'N/A',
      officeAddress: officeAddress || 'N/A',
      nomineeName: nomineeName || 'N/A',
      nomineeAge: nomineeAge || 'N/A',
      nomineeRelationship: nomineeRelationship || 'N/A',
      witness1NameAddress: witness1NameAddress || 'N/A',
      witness2NameAddress: witness2NameAddress || 'N/A',
      identityProofType,
      identityProofNo: identityProofNo || 'N/A',
      place: place || 'N/A',
      date: date || new Date().toISOString().split('T')[0],
    });

    setRegisterModalVisible(false);
    if (result.success) {
      if (result.isFallback) {
        showAlert('Success (Offline Mode)', `${name} has been enrolled locally. Server sync failed: ${result.error || 'Network error'}`);
      } else {
        showAlert('Success', `${name} has been enrolled successfully.`);
      }
    } else {
      showAlert('Error', `Failed to enroll subscriber: ${result.error || 'Unknown error'}`);
    }
  };

  // Filter members list based on query
  const filteredMembers = members.filter((m) => {
    const q = memberSearchQuery.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.phone.includes(q);
  });

  const activeMember = members.find((m) => m.id === selectedMemberId);

  const handleDeleteMember = () => {
    if (userRole !== 'admin') {
      showAlert('Access Denied', 'Admin privileges are required to delete subscribers.');
      return;
    }
    Alert.alert(
      'Delete Subscriber',
      `Are you sure you want to delete ${activeMember?.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            if (!selectedMemberId) return;
            const res = await deleteMember(selectedMemberId);
            if (res.success) {
              showAlert('Success', 'Subscriber deleted successfully.');
              setSelectedMemberId(null);
            } else {
              showAlert('Error', `Failed to delete: ${res.error}`);
            }
          }
        }
      ]
    );
  };

  // --- RENDERING ---

  // Scenario 1: Members List View
  if (!selectedMemberId) {
    return (
      <View style={[styles.mainContainer, { backgroundColor: activeColors.background }]}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <SubscribersIcon color={activeColors.primary} size={24} />
            <Text style={[styles.headerTitle, { color: activeColors.text, marginLeft: 8 }]}>Subscribers</Text>
          </View>
          {userRole === 'staff' ? (
            <Button 
              title="+ Add Subscriber" 
              onPress={() => showAlert('Access Denied', 'Admin privileges are required to register new subscribers.')} 
              size="sm" 
              style={{ backgroundColor: isDarkMode ? '#334155' : '#94A3B8' }} 
            />
          ) : (
            <Button title="+ Add Subscriber" onPress={handleOpenRegister} size="sm" />
          )}
        </View>

        {userRole === 'staff' && (
          <View style={[styles.infoBanner, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: activeColors.border }]}>
            <Text style={[styles.infoBannerText, { color: activeColors.textSecondary }]}>
              🔒 <Text style={{ fontWeight: '700', color: activeColors.text }}>Staff Mode:</Text> View-only access to subscriber registration.
            </Text>
          </View>
        )}

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search subscriber name or phone..."
            value={memberSearchQuery}
            onChangeText={setMemberSearchQuery}
            style={{ height: 40 }}
          />
        </View>

        <FlatList
          data={filteredMembers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const ledger = getMemberLedger(item.id);
            
            return (
              <Card style={styles.subscriberCardPremium} onPress={() => setSelectedMemberId(item.id)}>
                <View style={styles.subscriberInfoRow}>
                  {/* Monogram avatar badge */}
                  <View style={[styles.memberAvatarCircle, { backgroundColor: activeColors.primaryLight }]}>
                    <Text style={[styles.memberAvatarText, { color: activeColors.primary }]}>
                      {item.name ? item.name.charAt(0).toUpperCase() : '?'}
                    </Text>
                  </View>
                  
                  <View style={{ flex: 1, marginLeft: SPACING.md }}>
                    <Text style={[styles.subscriberName, { color: activeColors.text }]}>{item.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      <PhoneIcon color={activeColors.textSecondary} size={12} />
                      <Text style={[styles.subscriberPhone, { color: activeColors.textSecondary, marginLeft: 4 }]}>
                        {item.phone} {item.branchName && item.branchName !== 'N/A' ? `• ${item.branchName}` : ''}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                    <Badge label={`${ledger.joinedGroupsCount} Schemes`} type="neutral" />
                    <ChevronRightIcon color={activeColors.textSecondary} size={12} />
                  </View>
                </View>
              </Card>
            );
          }}
        />

        {/* Modal: Multi-Step Register Member */}
        <Modal visible={registerModalVisible} transparent animationType="slide" onRequestClose={() => setRegisterModalVisible(false)}>
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <View style={[styles.modalContentExtended, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
              
              {/* Header with Title & Step Progress */}
              <View style={[styles.modalHeaderRow, { borderBottomColor: activeColors.border }]}>
                <Text style={[styles.modalTitle, { color: activeColors.text, marginBottom: 4 }]}>Register Subscriber</Text>
                
                {/* Visual Wizard Indicators */}
                <View style={styles.wizardIndicatorsContainer}>
                  {[1, 2, 3, 4].map((step) => {
                    const isPassed = registerStep > step;
                    const isActive = registerStep === step;
                    return (
                      <View key={step} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View 
                          style={[
                            styles.wizardIndicatorPill, 
                            { 
                              backgroundColor: isActive 
                                ? activeColors.primary 
                                : isPassed 
                                ? activeColors.primaryLight 
                                : 'transparent',
                              borderColor: isActive || isPassed ? activeColors.primary : activeColors.border
                            }
                          ]}
                        >
                          <Text 
                            style={[
                              styles.wizardIndicatorText, 
                              { color: isActive ? '#FFFFFF' : isPassed ? activeColors.primary : activeColors.textSecondary }
                            ]}
                          >
                            {step}
                          </Text>
                        </View>
                        {step < 4 && (
                          <View style={[styles.wizardIndicatorLine, { backgroundColor: registerStep > step ? activeColors.primary : activeColors.border }]} />
                        )}
                      </View>
                    );
                  })}
                </View>
                <Text style={{ fontSize: 11, fontWeight: '700', color: activeColors.primary, marginTop: 4 }}>
                  {registerStep === 1 && 'STEP 1: CHIT SCHEME DETAILS'}
                  {registerStep === 2 && 'STEP 2: PERSONAL & PROFILE DETAILS'}
                  {registerStep === 3 && 'STEP 3: BANK & ADDRESS INFORMATION'}
                  {registerStep === 4 && 'STEP 4: NOMINEE, WITNESS & DECLARATION'}
                </Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, marginVertical: SPACING.md }}>
                
                {/* STEP 1: CHIT SCHEME DETAILS */}
                {registerStep === 1 && (
                  <View style={{ gap: SPACING.xs }}>
                    <TextInput label="Branch Name" placeholder="e.g. Gobichettipalayam" value={branchName} onChangeText={setBranchName} />
                    <TextInput label="Agent Name" placeholder="e.g. S. Ramasamy" value={agentName} onChangeText={setAgentName} />
                    <TextInput label="Chit Value (₹)" placeholder="e.g. 100000" keyboardType="numeric" value={chitValue} onChangeText={setChitValue} />
                    <TextInput label="Group / Ticket No" placeholder="e.g. G1 / Tkt 1" value={groupTktNo} onChangeText={setGroupTktNo} />
                    <TextInput label="Duration (Months)" placeholder="e.g. 10" keyboardType="numeric" value={duration} onChangeText={setDuration} />
                    <TextInput label="Monthly Installment Amount (₹)" placeholder="e.g. 10000" keyboardType="numeric" value={monthlyInstAmt} onChangeText={setMonthlyInstAmt} />
                    <TextInput label="Admission Fees (₹)" placeholder="e.g. 500" keyboardType="numeric" value={admissionFees} onChangeText={setAdmissionFees} />
                  </View>
                )}

                {/* STEP 2: PERSONAL & PROFILE DETAILS */}
                {registerStep === 2 && (
                  <View style={{ gap: SPACING.xs }}>
                    <TextInput label="Full Name (BLOCK LETTERS) *" placeholder="e.g. SUNIL KUMAR" value={name} onChangeText={setName} />
                    <TextInput label="Father's / Husband's Name" placeholder="e.g. M. Kumar" value={fatherHusbandName} onChangeText={setFatherHusbandName} />
                    <TextInput label="Date of Birth" placeholder="e.g. YYYY-MM-DD" value={dob} onChangeText={setDob} />
                    
                    {/* Gender Selection */}
                    <Text style={[styles.fieldLabel, { color: activeColors.textSecondary }]}>Gender</Text>
                    <View style={styles.pillRow}>
                      {(['Male', 'Female', 'Other'] as const).map((g) => (
                        <TouchableOpacity
                          key={g}
                          style={[
                            styles.formPill,
                            { 
                              borderColor: activeColors.border,
                              backgroundColor: gender === g ? activeColors.primaryLight : 'transparent' 
                            }
                          ]}
                          onPress={() => setGender(g)}
                        >
                          <Text style={{ fontSize: 12, fontWeight: '700', color: gender === g ? activeColors.primary : activeColors.textSecondary }}>
                            {g.toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TextInput label="Marital Status" placeholder="e.g. Married / Single" value={maritalStatus} onChangeText={setMaritalStatus} />
                    
                    {/* Subscriber Status */}
                    <Text style={[styles.fieldLabel, { color: activeColors.textSecondary }]}>Subscriber Status</Text>
                    <View style={styles.pillRow}>
                      {(['Individual', 'Firm'] as const).map((s) => (
                        <TouchableOpacity
                          key={s}
                          style={[
                            styles.formPill,
                            { 
                              borderColor: activeColors.border,
                              backgroundColor: subscriberStatus === s ? activeColors.primaryLight : 'transparent' 
                            }
                          ]}
                          onPress={() => setSubscriberStatus(s)}
                        >
                          <Text style={{ fontSize: 12, fontWeight: '700', color: subscriberStatus === s ? activeColors.primary : activeColors.textSecondary }}>
                            {s.toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TextInput label="GST No (For Firms)" placeholder="e.g. 22AAAAA0000A1Z5" value={gstNo} onChangeText={setGstNo} />

                    {/* Income Source */}
                    <Text style={[styles.fieldLabel, { color: activeColors.textSecondary }]}>Income Source</Text>
                    <View style={styles.pillRow}>
                      {(['Salary', 'Business', 'Others'] as const).map((inc) => (
                        <TouchableOpacity
                          key={inc}
                          style={[
                            styles.formPill,
                            { 
                              borderColor: activeColors.border,
                              backgroundColor: incomeSource === inc ? activeColors.primaryLight : 'transparent' 
                            }
                          ]}
                          onPress={() => setIncomeSource(inc)}
                        >
                          <Text style={{ fontSize: 12, fontWeight: '700', color: incomeSource === inc ? activeColors.primary : activeColors.textSecondary }}>
                            {inc.toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {incomeSource === 'Others' && (
                      <TextInput label="Specify Income Source" placeholder="e.g. Pension / Rent" value={incomeSourceOthers} onChangeText={setIncomeSourceOthers} />
                    )}
                  </View>
                )}

                {/* STEP 3: BANK & ADDRESS INFORMATION */}
                {registerStep === 3 && (
                  <View style={{ gap: SPACING.xs }}>
                    <TextInput label="Mobile Number *" placeholder="e.g. 9876543210" keyboardType="numeric" value={phone} onChangeText={setPhone} />
                    <TextInput label="Email Address" placeholder="e.g. sunil@gmail.com" keyboardType="email-address" value={email} onChangeText={setEmail} />
                    <TextInput label="Residential Address *" placeholder="e.g. 102, Palace Street, Gobi" value={address} onChangeText={setAddress} />
                    <TextInput label="Business / Office Address" placeholder="e.g. 201 Commercial Arcade, Erode" value={officeAddress} onChangeText={setOfficeAddress} />
                    
                    <TextInput label="Bank Name" placeholder="e.g. State Bank of India" value={bankName} onChangeText={setBankName} />
                    <TextInput label="Bank Branch" placeholder="e.g. Gobichettipalayam" value={bankBranch} onChangeText={setBankBranch} />
                    
                    {/* Account Type */}
                    <Text style={[styles.fieldLabel, { color: activeColors.textSecondary }]}>Bank Account Type</Text>
                    <View style={styles.pillRow}>
                      {(['SB', 'CA'] as const).map((acc) => (
                        <TouchableOpacity
                          key={acc}
                          style={[
                            styles.formPill,
                            { 
                              borderColor: activeColors.border,
                              backgroundColor: accountType === acc ? activeColors.primaryLight : 'transparent' 
                            }
                          ]}
                          onPress={() => setAccountType(acc)}
                        >
                          <Text style={{ fontSize: 12, fontWeight: '700', color: accountType === acc ? activeColors.primary : activeColors.textSecondary }}>
                            {acc === 'SB' ? 'SAVINGS (SB)' : 'CURRENT (CA)'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TextInput label="Bank Account Number" placeholder="e.g. 30012456789" keyboardType="numeric" value={accountNo} onChangeText={setAccountNo} />
                    <TextInput label="IFSC Code" placeholder="e.g. SBIN0000842" autoCapitalize="characters" value={ifscCode} onChangeText={setIfscCode} />
                  </View>
                )}

                {/* STEP 4: NOMINEE, WITNESS & DECLARATION */}
                {registerStep === 4 && (
                  <View style={{ gap: SPACING.xs }}>
                    <TextInput label="Nominee's Name" placeholder="e.g. Sneha Kumar" value={nomineeName} onChangeText={setNomineeName} />
                    <TextInput label="Nominee's Age" placeholder="e.g. 28" keyboardType="numeric" value={nomineeAge} onChangeText={setNomineeAge} />
                    <TextInput label="Nominee's Relationship" placeholder="e.g. Daughter" value={nomineeRelationship} onChangeText={setNomineeRelationship} />
                    
                    <TextInput label="Witness 1 (Name & Address)" placeholder="e.g. R. Selvam, 45 Gandhi Road" value={witness1NameAddress} onChangeText={setWitness1NameAddress} />
                    <TextInput label="Witness 2 (Name & Address)" placeholder="e.g. K. Murugan, 12 Park Ave" value={witness2NameAddress} onChangeText={setWitness2NameAddress} />
                    
                    {/* Identity Proof */}
                    <Text style={[styles.fieldLabel, { color: activeColors.textSecondary }]}>Identity Proof (PAN / AADHAR / VOTER ID)</Text>
                    <View style={styles.pillRow}>
                      {(['AADHAR', 'PAN', 'VOTER ID'] as const).map((idType) => (
                        <TouchableOpacity
                          key={idType}
                          style={[
                            styles.formPill,
                            { 
                              borderColor: activeColors.border,
                              backgroundColor: identityProofType === idType ? activeColors.primaryLight : 'transparent' 
                            }
                          ]}
                          onPress={() => setIdentityProofType(idType)}
                        >
                          <Text style={{ fontSize: 12, fontWeight: '700', color: identityProofType === idType ? activeColors.primary : activeColors.textSecondary }}>
                            {idType}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TextInput label="Identity Document ID Number" placeholder="e.g. 5421-9876-1234 / ID No..." value={identityProofNo} onChangeText={setIdentityProofNo} />
                    
                    <TextInput label="Place" placeholder="e.g. Gobichettipalayam" value={place} onChangeText={setPlace} />
                    <TextInput label="Date" placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} />
                  </View>
                )}
              </ScrollView>

              {/* Action Buttons */}
              <View style={[styles.modalActions, { borderTopColor: activeColors.border }]}>
                {registerStep > 1 ? (
                  <Button 
                    title="Back" 
                    onPress={() => setRegisterStep((prev) => prev - 1)} 
                    variant="outline" 
                    style={styles.modalBtn} 
                  />
                ) : (
                  <Button 
                    title="Cancel" 
                    onPress={() => setRegisterModalVisible(false)} 
                    variant="outline" 
                    style={styles.modalBtn} 
                  />
                )}
                
                {registerStep < 4 ? (
                  <Button 
                    title="Next" 
                    onPress={() => {
                      if (registerStep === 2 && !name.trim()) {
                        showAlert('Error', 'Subscriber Name is required');
                        return;
                      }
                      if (registerStep === 3 && (!phone.trim() || !address.trim())) {
                        showAlert('Error', 'Mobile Number and Residential Address are required');
                        return;
                      }
                      setRegisterStep((prev) => prev + 1);
                    }} 
                    style={styles.modalBtn} 
                  />
                ) : (
                  <Button 
                    title="Enroll" 
                    onPress={handleRegisterMember} 
                    style={styles.modalBtn} 
                  />
                )}
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Scenario 2: Individual Member Ledger Profile View (Simplified & Focused)
  const joinedGroupsList = groups.filter((g) => g.members.includes(selectedMemberId));

  // Visual helper to render details row inside cards
  const renderDetailField = (icon: React.ReactNode, label: string, value: string | undefined) => {
    const displayValue = value && value !== 'N/A' ? value : 'Not Specified';
    const isNA = !value || value === 'N/A';
    return (
      <View style={styles.profileDetailFieldItem}>
        <View style={styles.profileDetailFieldIconWrapper}>
          {icon}
        </View>
        <View style={{ marginLeft: SPACING.sm, flex: 1 }}>
          <Text style={[styles.contactLabel, { color: activeColors.textSecondary }]}>{label}</Text>
          <Text style={[styles.contactValue, { color: isNA ? activeColors.textMuted : activeColors.text, fontStyle: isNA ? 'italic' : 'normal' }]}>
            {displayValue}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: activeColors.background }]}>
      
      {/* Detail Header */}
      <View style={[styles.detailHeader, { borderBottomColor: activeColors.border, backgroundColor: activeColors.surface }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <View style={{ flex: 1 }}>
            <TouchableOpacity style={[styles.backButton, { flexDirection: 'row', alignItems: 'center' }]} onPress={() => setSelectedMemberId(null)}>
              <ChevronLeftIcon color={activeColors.primary} size={14} />
              <Text style={[styles.backButtonText, { color: activeColors.primary, marginLeft: 4 }]}>Back to Subscribers</Text>
            </TouchableOpacity>
            <Text style={[styles.detailTitle, { color: activeColors.text }]}>{activeMember?.name}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {userRole === 'admin' && (
              <TouchableOpacity 
                style={[styles.profileLogoutBtn, { borderColor: '#EF4444', backgroundColor: isDarkMode ? '#3F1C1C' : '#FEF2F2' }]} 
                onPress={handleDeleteMember}
                activeOpacity={0.7}
              >
                <Text style={[styles.profileLogoutBtnText, { color: '#EF4444' }]}>Delete</Text>
              </TouchableOpacity>
            )}
            {onLogout && (
              <TouchableOpacity 
                style={[styles.profileLogoutBtn, { borderColor: '#EF4444', backgroundColor: isDarkMode ? '#3F1C1C' : '#FEF2F2' }]} 
                onPress={onLogout}
                activeOpacity={0.7}
              >
                <LogoutIcon color="#EF4444" size={14} />
                <Text style={[styles.profileLogoutBtnText, { color: '#EF4444', marginLeft: 4 }]}>Logout</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollProfile} showsVerticalScrollIndicator={false}>
        
        {/* Contact Details Premium Card */}
        <Card style={[styles.cardInfoPremium, { backgroundColor: activeColors.surfaceCard, borderColor: isDarkMode ? '#6366F125' : '#0066FF15' }]}>
          <View style={styles.premiumAccentTitleContainer}>
            <View style={[styles.premiumAccentBar, { backgroundColor: activeColors.primary }]} />
            <Text style={[styles.cardHeadingPremium, { color: activeColors.text }]}>Subscriber Profile Details</Text>
          </View>

          <View style={styles.profileRow}>
            {/* Round Avatar Monogram inside card */}
            <View style={[styles.memberAvatarCircleLarge, { backgroundColor: activeColors.primaryLight }]}>
              <Text style={[styles.memberAvatarTextLarge, { color: activeColors.primary }]}>
                {activeMember?.name ? activeMember.name.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
            
            <View style={styles.profileMetaInfo}>
              <Text style={[styles.profileNameTitle, { color: activeColors.text }]}>{activeMember?.name}</Text>
              <Text style={[styles.profileSubtitleText, { color: activeColors.textSecondary }]}>
                Enrolled: {activeMember?.joiningDate || 'N/A'}
              </Text>
              {activeMember?.branchName && activeMember?.branchName !== 'N/A' && (
                <Badge label={`${activeMember.branchName} Branch`} type="active" style={{ alignSelf: 'flex-start', marginTop: 4 }} />
              )}
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: activeColors.border, marginVertical: SPACING.md }} />

          {/* Contact Details Grid */}
          <View style={styles.contactDetailsGrid}>
            {renderDetailField(<PhoneIcon color={activeColors.primary} size={14} />, "Phone Number", activeMember?.phone)}
            {renderDetailField(<EmailIcon color={activeColors.primary} size={14} />, "Email Address", activeMember?.email)}
            {renderDetailField(<LocationIcon color={activeColors.primary} size={14} />, "Residential Address", activeMember?.address)}
            {renderDetailField(<LocationIcon color={activeColors.primary} size={14} />, "Business / Office Address", activeMember?.officeAddress)}
          </View>
        </Card>

        {/* Category Card 1: Madura Chit Enrollment parameters */}
        <Card style={styles.cardInfoPremiumCategory}>
          <View style={styles.premiumAccentTitleContainer}>
            <View style={[styles.premiumAccentBar, { backgroundColor: activeColors.success }]} />
            <Text style={[styles.cardHeadingPremium, { color: activeColors.text }]}>Madura Chit Enrollment details</Text>
          </View>

          <View style={styles.contactDetailsGrid}>
            {renderDetailField(<SubscribersIcon color={activeColors.success} size={14} />, "Branch Name", activeMember?.branchName)}
            {renderDetailField(<SubscribersIcon color={activeColors.success} size={14} />, "Agent Name", activeMember?.agentName)}
            {renderDetailField(<MoneyIcon color={activeColors.success} size={14} />, "Chit Value (Rs.)", activeMember?.chitValue ? `₹${activeMember.chitValue}` : undefined)}
            {renderDetailField(<GroupsIcon color={activeColors.success} size={14} />, "Group / Ticket No", activeMember?.groupTktNo)}
            {renderDetailField(<GroupsIcon color={activeColors.success} size={14} />, "Duration (Months)", activeMember?.duration ? `${activeMember.duration} Months` : undefined)}
            {renderDetailField(<MoneyIcon color={activeColors.success} size={14} />, "Monthly Inst Amt", activeMember?.monthlyInstAmt ? `₹${activeMember.monthlyInstAmt}` : undefined)}
            {renderDetailField(<MoneyIcon color={activeColors.success} size={14} />, "Admission Fees", activeMember?.admissionFees ? `₹${activeMember.admissionFees}` : undefined)}
            {renderDetailField(<LocationIcon color={activeColors.success} size={14} />, "Place of Enrollment", activeMember?.place)}
            {renderDetailField(<LocationIcon color={activeColors.success} size={14} />, "Date of Enrollment", activeMember?.date)}
          </View>
        </Card>

        {/* Category Card 2: Personal Profile */}
        <Card style={styles.cardInfoPremiumCategory}>
          <View style={styles.premiumAccentTitleContainer}>
            <View style={[styles.premiumAccentBar, { backgroundColor: activeColors.primary }]} />
            <Text style={[styles.cardHeadingPremium, { color: activeColors.text }]}>Personal Profile</Text>
          </View>

          <View style={styles.contactDetailsGrid}>
            {renderDetailField(<SubscribersIcon color={activeColors.primary} size={14} />, "Father's / Husband's Name", activeMember?.fatherHusbandName)}
            {renderDetailField(<SubscribersIcon color={activeColors.primary} size={14} />, "Date of Birth", activeMember?.dob)}
            {renderDetailField(<SubscribersIcon color={activeColors.primary} size={14} />, "Gender", activeMember?.gender)}
            {renderDetailField(<SubscribersIcon color={activeColors.primary} size={14} />, "Marital Status", activeMember?.maritalStatus)}
          </View>
        </Card>

        {/* Category Card 3: Professional & Tax Details */}
        <Card style={styles.cardInfoPremiumCategory}>
          <View style={styles.premiumAccentTitleContainer}>
            <View style={[styles.premiumAccentBar, { backgroundColor: activeColors.secondary }]} />
            <Text style={[styles.cardHeadingPremium, { color: activeColors.text }]}>Professional & Tax Details</Text>
          </View>

          <View style={styles.contactDetailsGrid}>
            {renderDetailField(<SubscribersIcon color={activeColors.secondary} size={14} />, "Subscriber Status", activeMember?.subscriberStatus)}
            {renderDetailField(<SubscribersIcon color={activeColors.secondary} size={14} />, "GST No", activeMember?.gstNo)}
            {renderDetailField(<SubscribersIcon color={activeColors.secondary} size={14} />, "Income Source", activeMember?.incomeSource === 'Others' ? activeMember.incomeSourceOthers : activeMember?.incomeSource)}
          </View>
        </Card>

        {/* Category Card 4: Bank Details */}
        <Card style={styles.cardInfoPremiumCategory}>
          <View style={styles.premiumAccentTitleContainer}>
            <View style={[styles.premiumAccentBar, { backgroundColor: activeColors.info }]} />
            <Text style={[styles.cardHeadingPremium, { color: activeColors.text }]}>Bank details</Text>
          </View>

          <View style={styles.contactDetailsGrid}>
            {renderDetailField(<GroupsIcon color={activeColors.info} size={14} />, "Bank Name", activeMember?.bankName)}
            {renderDetailField(<GroupsIcon color={activeColors.info} size={14} />, "Branch", activeMember?.bankBranch)}
            {renderDetailField(<GroupsIcon color={activeColors.info} size={14} />, "Account Type", activeMember?.accountType)}
            {renderDetailField(<GroupsIcon color={activeColors.info} size={14} />, "Account Number", activeMember?.accountNo)}
            {renderDetailField(<GroupsIcon color={activeColors.info} size={14} />, "IFSC Code", activeMember?.ifscCode)}
          </View>
        </Card>

        {/* Category Card 5: Nominee Details */}
        <Card style={styles.cardInfoPremiumCategory}>
          <View style={styles.premiumAccentTitleContainer}>
            <View style={[styles.premiumAccentBar, { backgroundColor: activeColors.warning }]} />
            <Text style={[styles.cardHeadingPremium, { color: activeColors.text }]}>Nominee details</Text>
          </View>

          <View style={styles.contactDetailsGrid}>
            {renderDetailField(<SubscribersIcon color={activeColors.warning} size={14} />, "Nominee Name", activeMember?.nomineeName)}
            {renderDetailField(<SubscribersIcon color={activeColors.warning} size={14} />, "Age", activeMember?.nomineeAge)}
            {renderDetailField(<SubscribersIcon color={activeColors.warning} size={14} />, "Relationship", activeMember?.nomineeRelationship)}
          </View>
        </Card>

        {/* Category Card 6: Witness Details */}
        <Card style={styles.cardInfoPremiumCategory}>
          <View style={styles.premiumAccentTitleContainer}>
            <View style={[styles.premiumAccentBar, { backgroundColor: activeColors.danger }]} />
            <Text style={[styles.cardHeadingPremium, { color: activeColors.text }]}>Witness details</Text>
          </View>

          <View style={styles.contactDetailsGrid}>
            {renderDetailField(<SubscribersIcon color={activeColors.danger} size={14} />, "Witness 1 Name & Address", activeMember?.witness1NameAddress)}
            {renderDetailField(<SubscribersIcon color={activeColors.danger} size={14} />, "Witness 2 Name & Address", activeMember?.witness2NameAddress)}
          </View>
        </Card>

        {/* Category Card 7: Identification Proof */}
        <Card style={styles.cardInfoPremiumCategory}>
          <View style={styles.premiumAccentTitleContainer}>
            <View style={[styles.premiumAccentBar, { backgroundColor: '#701a75' }]} />
            <Text style={[styles.cardHeadingPremium, { color: activeColors.text }]}>Identification Proof</Text>
          </View>

          <View style={styles.contactDetailsGrid}>
            {renderDetailField(<SubscribersIcon color="#701a75" size={14} />, "Identity Document Type", activeMember?.identityProofType)}
            {renderDetailField(<SubscribersIcon color="#701a75" size={14} />, "Document ID Number", activeMember?.identityProofNo)}
          </View>
        </Card>

        {/* Section: Joined Schemes */}
        <View style={styles.premiumAccentTitleContainer}>
          <View style={[styles.premiumAccentBar, { backgroundColor: activeColors.primary }]} />
          <Text style={[styles.sectionHeadingPremium, { color: activeColors.text }]}>Joined Schemes</Text>
        </View>

        {joinedGroupsList.length === 0 ? (
          <Card style={[styles.emptyCardPremium, { borderColor: activeColors.border }]}>
            <Text style={[styles.emptyLabel, { color: activeColors.textSecondary }]}>
              This subscriber hasn't joined any groups yet. Assign them to a group slot in the Groups panel.
            </Text>
          </Card>
        ) : (
          joinedGroupsList.map((g) => {
            const indexInGroup = g.members.indexOf(selectedMemberId || '');
            const slotNum = indexInGroup + 1;
            
            return (
              <Card key={g.id} style={styles.schemeCardPremium}>
                <View style={styles.schemeHeaderRow}>
                  <View style={[styles.schemeAvatarIcon, { backgroundColor: activeColors.primaryLight }]}>
                    <SubscribersIcon color={activeColors.primary} size={16} />
                  </View>
                  <View style={{ flex: 1, marginLeft: SPACING.md }}>
                    <Text style={[styles.schemeNameText, { color: activeColors.text }]}>{g.name}</Text>
                    <Text style={[styles.schemeDetailText, { color: activeColors.textSecondary }]}>
                      Assigned Member Slot: <Text style={{ color: activeColors.primary, fontWeight: '700' }}>#{slotNum}</Text>
                    </Text>
                  </View>
                  <Badge label={`${g.type}`} type={g.type} />
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
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
  searchContainer: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 80,
  },
  detailHeader: {
    padding: SPACING.md,
    borderBottomWidth: 1.5,
  },
  backButton: {
    marginBottom: SPACING.xs,
  },
  backButtonText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: 'bold',
  },
  profileLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1.2,
    gap: 4,
    marginTop: 2,
  },
  profileLogoutBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailTitle: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: 'bold',
  },
  scrollProfile: {
    padding: SPACING.md,
    paddingBottom: 90,
  },
  cardInfoPremium: {
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardInfoPremiumCategory: {
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  premiumAccentTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    marginTop: SPACING.xs,
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
  sectionHeadingPremium: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginTop: SPACING.md,
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
  subscriberInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subscriberName: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: 'bold',
  },
  subscriberPhone: {
    fontSize: TYPOGRAPHY.size.xs,
  },
  memberAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarCircleLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '800',
  },
  memberAvatarTextLarge: {
    fontSize: 24,
    fontWeight: '800',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  profileMetaInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  profileNameTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: 'bold',
  },
  profileSubtitleText: {
    fontSize: TYPOGRAPHY.size.xs,
    marginTop: 2,
  },
  contactDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  profileDetailFieldItem: {
    width: '46%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    minHeight: 46,
  },
  profileDetailFieldIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0066FF08',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactLabel: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactValue: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  schemeCardPremium: {
    marginVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#0066FF08',
    padding: SPACING.md,
  },
  schemeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  schemeAvatarIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  schemeNameText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: 'bold',
  },
  schemeDetailText: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyCardPremium: {
    alignItems: 'center',
    padding: SPACING.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#E2E8F0',
    backgroundColor: 'transparent',
  },
  emptyLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentExtended: {
    width: '94%',
    height: '86%',
    maxHeight: 680,
    maxWidth: 460,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    ...SHADOWS.lg,
    flexDirection: 'column',
  },
  modalHeaderRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: SPACING.sm,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: 'bold',
  },
  wizardIndicatorsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xs,
  },
  wizardIndicatorPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wizardIndicatorText: {
    fontSize: 10,
    fontWeight: '800',
  },
  wizardIndicatorLine: {
    width: 36,
    height: 2,
    marginHorizontal: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: SPACING.sm,
    marginBottom: 4,
  },
  pillRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
    flexWrap: 'wrap',
  },
  formPill: {
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: SPACING.md,
  },
  modalBtn: {
    flex: 0.48,
  },
});
