const fs = require('fs');
const file = 'c:/Users/srira/ChitFunds/src/screens/FundCalculationsScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('paymentModalVisible')) {
  content = content.replace(
    /const \{ isDarkMode, groups, members, payments \} = useFunds\(\);/,
    `const { isDarkMode, groups, members, payments, updatePaymentStatus } = useFunds();
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPaymentMember, setSelectedPaymentMember] = useState<any>(null);
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'Cash' | 'Bank Transfer'>('UPI');
  const [isSavingPayment, setIsSavingPayment] = useState(false);`
  );

  content = content.replace(
    /const MemberCardList: React\.FC<\{([\s\S]*?)\}> = \(\{ members, isDark, emptyMsg \}\) => \{/,
    `const MemberCardList: React.FC<{$1
    onPressMember?: (member: any) => void;
  }> = ({ members, isDark, emptyMsg, onPressMember }) => {`
  );

  content = content.replace(
    /<View key=\{m\.memberId\} style=\{\{/g,
    '<TouchableOpacity key={m.memberId} onPress={() => onPressMember && onPressMember(m)} activeOpacity={0.8} style={{'
  );

  content = content.replace(
    /<MemberCardList members=\{nonPricedMembers\} isDark=\{isDarkMode\} emptyMsg="THERE IS NO NON PRIZED" \/>/,
    '<MemberCardList members={nonPricedMembers} isDark={isDarkMode} emptyMsg="THERE IS NO NON PRIZED" onPressMember={(m) => { setSelectedPaymentMember(m); setPaymentModalVisible(true); }} />'
  );

  content = content.replace(
    /<MemberCardList members=\{pricedMembers\} isDark=\{isDarkMode\} emptyMsg="NO AUCTIONS HELD YET" \/>/,
    '<MemberCardList members={pricedMembers} isDark={isDarkMode} emptyMsg="NO AUCTIONS HELD YET" onPressMember={(m) => { setSelectedPaymentMember(m); setPaymentModalVisible(true); }} />'
  );

  const modalCode = `        </View>

        {/* Payment Modal */}
        <Modal visible={paymentModalVisible} transparent animationType="slide" onRequestClose={() => setPaymentModalVisible(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: isDarkMode ? '#0F1829' : '#FFFFFF', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: isDarkMode ? '#E2E8F0' : '#0F172A' }}>
                  Collect Payment
                </Text>
                <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                  <Text style={{ fontSize: 16, color: '#64748B' }}>✕</Text>
                </TouchableOpacity>
              </View>
              {selectedPaymentMember && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 16, color: isDarkMode ? '#E2E8F0' : '#0F172A', marginBottom: 4 }}>{selectedPaymentMember.memberObj?.name}</Text>
                  <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 12 }}>Tkt {selectedPaymentMember.ticketNo} • Month {currentMonth}</Text>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                    <View>
                      <Text style={{ fontSize: 12, color: '#64748B' }}>Total Due</Text>
                      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#EF4444' }}>₹{(selectedPaymentMember.arrearsDue + selectedPaymentMember.currentMonthDue).toLocaleString('en-IN')}</Text>
                    </View>
                  </View>

                  <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 8, fontWeight: 'bold' }}>PAYMENT MODE</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
                    {['UPI', 'Cash', 'Bank Transfer'].map(mode => (
                      <TouchableOpacity 
                        key={mode} 
                        onPress={() => setPaymentMode(mode)}
                        style={{ 
                          flex: 1, 
                          paddingVertical: 10, 
                          alignItems: 'center', 
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: paymentMode === mode ? '#3B82F6' : (isDarkMode ? '#334155' : '#CBD5E1'),
                          backgroundColor: paymentMode === mode ? '#3B82F620' : 'transparent'
                        }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: paymentMode === mode ? '#3B82F6' : (isDarkMode ? '#E2E8F0' : '#0F172A') }}>{mode}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity 
                    style={{ backgroundColor: '#22C55E', padding: 16, borderRadius: 12, alignItems: 'center' }}
                    disabled={isSavingPayment}
                    onPress={async () => {
                      setIsSavingPayment(true);
                      const res = await updatePaymentStatus(group.id, selectedPaymentMember.memberId, currentMonth, true, {
                        paymentMode,
                        paymentDate: new Date().toISOString().split('T')[0],
                        amount: selectedPaymentMember.arrearsDue + selectedPaymentMember.currentMonthDue
                      });
                      setIsSavingPayment(false);
                      if (res.success) {
                        setPaymentModalVisible(false);
                        Alert.alert('Success', 'Payment saved successfully!');
                      } else {
                        Alert.alert('Error', res.error || 'Failed to save payment');
                      }
                    }}
                  >
                    <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>
                      {isSavingPayment ? 'Saving...' : 'Confirm Payment'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>

      </ScrollView>`;

  content = content.replace(
    /\s*<\/View>\n\s*<\/ScrollView>\n\s*<\/View>\n\s*\);\n\};/g,
    modalCode + '\n    </View>\n  );\n};'
  );

  content = content.replace(
    /<\/TouchableOpacity>\n\s*<View style=\{\{ flexDirection: 'row', gap: 12 \}\}>/g,
    '</View>\n              <View style={{ flexDirection: \'row\', gap: 12 }}>'
  );

  fs.writeFileSync(file, content, 'utf8');
  console.log('Payment modal injected!');
} else {
  console.log('Already injected');
}
