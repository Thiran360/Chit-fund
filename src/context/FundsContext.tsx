import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Member, FundGroup, Payment, Auction, KittyPayout, FundType, CustomerGroupAssignment, CollectionRecord } from '../types';


interface FundsContextProps {
  groups: FundGroup[];
  members: Member[];
  payments: Payment[];
  assignments: CustomerGroupAssignment[];
  collections: CollectionRecord[];
  isDarkMode: boolean;
  toggleTheme: () => void;
  addGroup: (group: Omit<FundGroup, 'id' | 'auctions' | 'kittyPayouts'>) => Promise<{ success: boolean; isFallback: boolean; error?: string }>;
  deleteGroup: (groupId: string) => Promise<{ success: boolean; error?: string }>;
  deleteMember: (memberId: string) => Promise<{ success: boolean; error?: string }>;
  addMember: (member: Omit<Member, 'id'>) => Promise<{ success: boolean; isFallback: boolean; error?: string }>;
  registerMemberInGroup: (groupId: string, memberId: string) => Promise<{ success: boolean; isFallback: boolean; error?: string }>;
  removeMemberFromGroup: (groupId: string, memberId: string) => Promise<{ success: boolean; isFallback: boolean; error?: string }>;
  replaceMemberInGroup: (groupId: string, removedMemberId: string, newMemberId: string) => Promise<{ success: boolean; isFallback: boolean; error?: string }>;
  recordAuction: (groupId: string, winnerMemberId: string, bidAmount: number, date?: string) => void;
  recordKittyPayout: (groupId: string, winnerMemberId: string, date?: string) => void;
  recordPayment: (payment: Omit<Payment, 'id'>) => Payment;
  updatePaymentStatus: (groupId: string, memberId: string, month: number, paid: boolean, details?: Partial<Payment>) => Promise<{ success: boolean; isFallback: boolean; error?: string }>;
  getMemberLedger: (memberId: string) => {
    joinedGroupsCount: number;
    totalPaid: number;
    totalOutstanding: number;
    totalDividendsEarned: number;
    paymentHistory: Payment[];
  };
  getGroupInstallmentForMonth: (groupId: string, monthNumber: number) => number;
  refreshGroups: () => Promise<boolean>;
  refreshMembers: () => Promise<boolean>;
  refreshAssignments: () => Promise<boolean>;
  refreshCollections: () => Promise<boolean>;
}

const FundsContext = createContext<FundsContextProps | undefined>(undefined);

// Compact payments serializer helpers
interface EncodedPayment {
  month: number;
  status: 'paid' | 'pending';
  amount: number;
  mode: 'UPI' | 'Cash' | 'Bank Transfer';
}

const encodeGroupTicketNo = (ticketNo: string, paymentsList: EncodedPayment[]): string => {
  const paymentsStr = paymentsList
    .map(p => {
      const statusChar = p.status === 'paid' ? 'P' : 'N';
      const modeChar = p.mode === 'Cash' ? 'C' : p.mode === 'Bank Transfer' ? 'B' : 'U';
      return `${p.month}:${statusChar}:${p.amount}:${modeChar}`;
    })
    .join(';');
  return `${ticketNo}|${paymentsStr}`;
};

const decodeGroupTicketNo = (encoded: string): { ticketNo: string; paymentsList: EncodedPayment[] } => {
  if (!encoded || typeof encoded !== 'string') {
    return { ticketNo: 'N/A', paymentsList: [] };
  }
  if (!encoded.includes('|')) {
    return { ticketNo: encoded, paymentsList: [] };
  }
  const [ticketNo, paymentsPart] = encoded.split('|');
  const paymentsList: EncodedPayment[] = [];
  if (paymentsPart) {
    const parts = paymentsPart.split(';');
    parts.forEach(part => {
      const subparts = part.split(':');
      if (subparts.length === 4) {
        const month = parseInt(subparts[0]);
        const status = subparts[1] === 'P' ? 'paid' : 'pending';
        const amount = parseFloat(subparts[2]) || 0;
        const modeChar = subparts[3];
        const mode = modeChar === 'C' ? 'Cash' : modeChar === 'B' ? 'Bank Transfer' : 'UPI';
        if (!isNaN(month)) {
          paymentsList.push({ month, status, amount, mode });
        }
      }
    });
  }
  return { ticketNo, paymentsList };
};

// Seed data cleared to start with a fresh blank state
const INITIAL_MEMBERS: Member[] = [];
const INITIAL_GROUPS: FundGroup[] = [];

// Helper to pre-populate payments (cleared for fresh start)
const generateInitialPayments = (): Payment[] => {
  return [];
};

export const FundsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [groups, setGroups] = useState<FundGroup[]>(INITIAL_GROUPS);
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [payments, setPayments] = useState<Payment[]>(generateInitialPayments());
  const [assignments, setAssignments] = useState<CustomerGroupAssignment[]>([]);
  const [collections, setCollections] = useState<CollectionRecord[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false); // White with blue premium theme by default

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  const persistAssignments = async (updatedAssignments: CustomerGroupAssignment[]) => {
    try {
      await AsyncStorage.setItem('local_assignments', JSON.stringify(updatedAssignments));
    } catch (e) {
      console.error('Failed to save assignments to storage', e);
    }
  };


  // Persistence helpers
  const persistGroupsMeta = async (updatedGroups: FundGroup[]) => {
    try {
      const meta: Record<string, any> = {};
      updatedGroups.forEach((g) => {
        meta[g.id] = {
          members: g.members,
          auctions: g.auctions,
          kittyPayouts: g.kittyPayouts,
          status: g.status,
          removedMembers: g.removedMembers || [],
          branchCode: g.branchCode,
          branchName: g.branchName,
          auctionTime: g.auctionTime,
        };
      });
      await AsyncStorage.setItem('local_group_metadata', JSON.stringify(meta));
    } catch (e) {
      console.error('Failed to save group metadata to storage', e);
    }
  };

  const persistPayments = async (updatedPayments: Payment[]) => {
    try {
      await AsyncStorage.setItem('local_payments', JSON.stringify(updatedPayments));
    } catch (e) {
      console.error('Failed to save payments to storage', e);
    }
  };

  // Load startup data from AsyncStorage and backend API
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load local members
        const savedMembersStr = await AsyncStorage.getItem('local_members');
        let loadedMembers: Member[] = [];
        if (savedMembersStr) {
          loadedMembers = JSON.parse(savedMembersStr);
          setMembers(loadedMembers);
        }

        // Load local payments
        const savedPaymentsStr = await AsyncStorage.getItem('local_payments');
        let loadedPayments: Payment[] = [];
        if (savedPaymentsStr) {
          loadedPayments = JSON.parse(savedPaymentsStr);
          setPayments(loadedPayments);
        }

        // Load local assignments
        const savedAssignmentsStr = await AsyncStorage.getItem('local_assignments');
        if (savedAssignmentsStr) {
          const loadedAssignments = JSON.parse(savedAssignmentsStr);
          setAssignments(loadedAssignments);
        }

        // Load local collections cache
        const savedCollectionsStr = await AsyncStorage.getItem('local_collections');
        if (savedCollectionsStr) {
          setCollections(JSON.parse(savedCollectionsStr));
        }

        // Fetch live groups from API and sync
        await refreshGroups();
        
        // Fetch live members/subscribers from API and sync
        await refreshMembers();

        // Fetch live assignments from customer-groups and sync
        await refreshAssignments();

        // Fetch live collection records and hydrate payments
        await refreshCollections();
      } catch (error) {
        console.error('Failed to load startup data in FundsContext', error);
      }
    };

    loadData();
  }, []);

  const refreshGroups = async (): Promise<boolean> => {
    try {
      // Load group local metadata (members array, auctions, payouts)
      const savedGroupMetaStr = await AsyncStorage.getItem('local_group_metadata');
      const loadedGroupMeta = savedGroupMetaStr ? JSON.parse(savedGroupMetaStr) : {};

      // Fetch live groups from API
      const response = await fetch('https://guidance-glorifier-mango.ngrok-free.dev/api/groups/', {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        const apiGroups = await response.json();
        if (Array.isArray(apiGroups)) {
          const mappedGroups: FundGroup[] = apiGroups.map((bg: any) => {
            const groupId = `G${bg.id}`;
            const meta = loadedGroupMeta[groupId] || { members: [], auctions: [], kittyPayouts: [], status: 'active', removedMembers: [] };
            return {
              id: groupId,
              name: bg.group_name || 'Unnamed Group',
              type: 'chit',
              totalValue: parseFloat(bg.chit_value) || 0,
              durationMonths: parseInt(bg.duration_months) || 0,
              totalMembers: parseInt(bg.total_members) || 0,
              monthlyInstallment: Math.round(parseFloat(bg.monthly_installment) || 0),
              commissionPercent: 5,
              interestRate: 0,
              startDate: bg.start_date || new Date().toISOString().split('T')[0],
              status: meta.status || 'active',
              members: meta.members || [],
              auctions: meta.auctions || [],
              kittyPayouts: meta.kittyPayouts || [],
              removedMembers: meta.removedMembers || [],
              branchCode: meta.branchCode,
              branchName: meta.branchName,
              auctionTime: meta.auctionTime,
            };
          });

          setGroups(mappedGroups);

          // Sync/Pre-populate payments for any members inside these fetched groups
          setPayments((prev) => {
            const mergedPayments = [...prev];
            mappedGroups.forEach((g) => {
              g.members.forEach((mId) => {
                for (let m = 1; m <= g.durationMonths; m++) {
                  const paymentId = `P-${g.id}-M${m}-${mId}`;
                  if (!mergedPayments.some((p) => p.id === paymentId)) {
                    mergedPayments.push({
                      id: paymentId,
                      groupId: g.id,
                      memberId: mId,
                      monthNumber: m,
                      amountPaid: 0,
                      paymentDate: '',
                      paymentMode: 'UPI',
                      transactionRef: '',
                      status: 'pending',
                    });
                  }
                }
              });
            });
            persistPayments(mergedPayments);
            return mergedPayments;
          });

          // Save metadata
          const newMeta: Record<string, any> = {};
          mappedGroups.forEach((g) => {
            newMeta[g.id] = {
              members: g.members,
              auctions: g.auctions,
              kittyPayouts: g.kittyPayouts,
              status: g.status,
              removedMembers: g.removedMembers || [],
            };
          });
          await AsyncStorage.setItem('local_group_metadata', JSON.stringify(newMeta));
          return true;
        }
      }
    } catch (e) {
      console.error('Failed to refresh groups', e);
    }
    return false;
  };

  const refreshMembers = async (): Promise<boolean> => {
    try {
      const response = await fetch('https://guidance-glorifier-mango.ngrok-free.dev/api/customers/', {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        const apiCustomers = await response.json();
        if (Array.isArray(apiCustomers)) {
          const mappedMembers: Member[] = apiCustomers.map((c: any) => {
            return {
              id: `M${c.id}`,
              name: c.customer_name || 'Unnamed',
              phone: c.mobile_number || '',
              email: c.email || 'N/A',
              address: c.residence_address || '',
              joiningDate: c.created_at ? c.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
              branchName: c.branch_name || 'N/A',
              agentName: c.agent_name || 'N/A',
              chitValue: String(c.chit_value || ''),
              groupTktNo: c.group_ticket_no || 'N/A',
              duration: String(c.duration || ''),
              monthlyInstAmt: String(c.monthly_installment || ''),
              admissionFees: String(c.admission_fees || ''),
              fatherHusbandName: c.father_husband_name || 'N/A',
              dob: c.date_of_birth || '2000-01-01',
              gender: c.gender || 'Male',
              maritalStatus: c.marital_status || 'Single',
              subscriberStatus: c.subscriber_status || 'Individual',
              gstNo: c.gst_no || 'N/A',
              incomeSource: c.income_source || 'Salary',
              incomeSourceOthers: c.income_source_others || 'N/A',
              bankName: c.bank_name || 'N/A',
              bankBranch: c.branch || 'N/A',
              accountType: c.account_type || 'SB',
              accountNo: c.account_number || 'N/A',
              ifscCode: c.ifsc_code || 'N/A',
              officeAddress: c.office_address || 'N/A',
              nomineeName: c.nominee_name || 'N/A',
              nomineeAge: String(c.nominee_age || ''),
              nomineeRelationship: c.nominee_relationship || 'N/A',
              witness1NameAddress: c.witness_one || 'N/A',
              witness2NameAddress: c.witness_two || 'N/A',
              identityProofType: c.proof_type || 'AADHAR',
              identityProofNo: c.proof_no || 'N/A',
              place: c.place || 'Gobichettipalayam',
              date: c.created_at ? c.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            };
          });

          setMembers(mappedMembers);
          await AsyncStorage.setItem('local_members', JSON.stringify(mappedMembers));

          // Sync group memberships and auto-create missing payments from backend customer records
          setGroups((prevGroups) => {
            const updated = prevGroups.map((g) => {
              const gIntId = parseInt(g.id.replace('G', ''));
              // Find all customers from API belonging to this group
              const matchedMemberIds = apiCustomers
                .filter((c: any) => c.group === gIntId || c.group === String(gIntId))
                .map((c: any) => `M${c.id}`);

              // Merge keeping unique ones
              const mergedMembers = Array.from(new Set([...g.members, ...matchedMemberIds]));

              // Pre-populate missing payments placeholders
              setPayments((prevP) => {
                const updatedP = [...prevP];
                let changed = false;
                mergedMembers.forEach((mId) => {
                  for (let m = 1; m <= g.durationMonths; m++) {
                    const paymentId = `P-${g.id}-M${m}-${mId}`;
                    if (!updatedP.some((p) => p.id === paymentId)) {
                      updatedP.push({
                        id: paymentId,
                        groupId: g.id,
                        memberId: mId,
                        monthNumber: m,
                        amountPaid: 0,
                        paymentDate: '',
                        paymentMode: 'UPI',
                        transactionRef: '',
                        status: 'pending',
                      });
                      changed = true;
                    }
                  }
                });
                if (changed) {
                  persistPayments(updatedP);
                }
                return updatedP;
              });

              return {
                ...g,
                members: mergedMembers,
              };
            });

            persistGroupsMeta(updated);
            return updated;
          });

          return true;
        }
      }
    } catch (e) {
      console.error('Failed to refresh members', e);
    }
    return false;
  };

  const refreshAssignments = async (): Promise<boolean> => {
    try {
      const response = await fetch('https://guidance-glorifier-mango.ngrok-free.dev/api/customer-groups/', {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        const apiAssignments = await response.json();
        if (Array.isArray(apiAssignments)) {

          // ── DEDUPLICATION ────────────────────────────────────────────────
          // Group all assignments by customer+group key, keep the highest-id
          // (most recent) as canonical, and queue the rest for deletion.
          const byKey: Record<string, any[]> = {};
          apiAssignments.forEach((a: any) => {
            const key = `${a.customer}-${a.group}`;
            if (!byKey[key]) byKey[key] = [];
            byKey[key].push(a);
          });

          const canonicalAssignments: any[] = [];
          const orphanIds: number[] = [];

          Object.values(byKey).forEach((group: any[]) => {
            // Sort descending by id so newest is first
            group.sort((x: any, y: any) => y.id - x.id);

            // Merge all encoded payments from duplicates into one list
            const mergedPayments: EncodedPayment[] = [];
            group.forEach((a: any) => {
              const { paymentsList } = decodeGroupTicketNo(a.group_ticket_no);
              paymentsList.forEach((ep: EncodedPayment) => {
                const idx = mergedPayments.findIndex((p) => p.month === ep.month);
                if (idx !== -1) {
                  // Keep the record from the newest assignment (group[0])
                  if (group[0].id === a.id) mergedPayments[idx] = ep;
                } else {
                  mergedPayments.push(ep);
                }
              });
            });

            const canonical = { ...group[0] };
            if (mergedPayments.length > 0) {
              const { ticketNo } = decodeGroupTicketNo(canonical.group_ticket_no);
              canonical.group_ticket_no = encodeGroupTicketNo(ticketNo, mergedPayments);
            }
            canonicalAssignments.push(canonical);
            group.slice(1).forEach((a: any) => orphanIds.push(a.id));
          });

          // Fire-and-forget: silently clean up backend orphans
          if (orphanIds.length > 0) {
            Promise.all(
              orphanIds.map((id: number) =>
                fetch(`https://guidance-glorifier-mango.ngrok-free.dev/api/customer-groups/${id}/`, {
                  method: 'DELETE',
                  headers: { 'ngrok-skip-browser-warning': 'true' },
                }).catch(() => {})
              )
            );
          }
          // ─────────────────────────────────────────────────────────────────

          setAssignments(canonicalAssignments);
          await AsyncStorage.setItem('local_assignments', JSON.stringify(canonicalAssignments));

          // Sync payments and members into groups using deduplicated assignments
          setGroups((prevGroups) => {
            const updated = prevGroups.map((g) => {
              const gIntId = parseInt(g.id.replace('G', ''));
              const groupAssignments = canonicalAssignments.filter((a: any) => a.group === gIntId);
              const assignedMemberIds = groupAssignments.map((a: any) => `M${a.customer}`);
              const mergedMembers = Array.from(new Set([...g.members, ...assignedMemberIds]));

              setPayments((prevPayments) => {
                const updatedPayments = [...prevPayments];
                let changed = false;

                groupAssignments.forEach((a: any) => {
                  const mId = `M${a.customer}`;
                  const { paymentsList } = decodeGroupTicketNo(a.group_ticket_no);

                  for (let m = 1; m <= g.durationMonths; m++) {
                    const paymentId = `P-${g.id}-M${m}-${mId}`;
                    const existingIdx = updatedPayments.findIndex(p => p.id === paymentId);
                    const encodedPay = paymentsList.find(ep => ep.month === m);

                    const paymentData: Payment = {
                      id: paymentId,
                      groupId: g.id,
                      memberId: mId,
                      monthNumber: m,
                      amountPaid: encodedPay ? (encodedPay.status === 'paid' ? encodedPay.amount : 0) : 0,
                      paymentDate: encodedPay && encodedPay.status === 'paid' ? new Date().toISOString().split('T')[0] : '',
                      paymentMode: encodedPay ? encodedPay.mode : 'UPI',
                      transactionRef: encodedPay && encodedPay.status === 'paid' ? `TXN-M${a.customer}-${g.id}-${m}` : '',
                      status: encodedPay ? encodedPay.status : 'pending',
                    };

                    if (existingIdx !== -1) {
                      const current = updatedPayments[existingIdx];
                      if (current.status !== paymentData.status || current.amountPaid !== paymentData.amountPaid || current.paymentMode !== paymentData.paymentMode) {
                        updatedPayments[existingIdx] = paymentData;
                        changed = true;
                      }
                    } else {
                      updatedPayments.push(paymentData);
                      changed = true;
                    }
                  }
                });

                if (changed) persistPayments(updatedPayments);
                return updatedPayments;
              });

              return { ...g, members: mergedMembers };
            });

            persistGroupsMeta(updated);
            return updated;
          });

          return true;
        }
      }
    } catch (e) {
      console.error('Failed to refresh customer-groups assignments', e);
    }
    return false;
  };

  // Fetch all collection records from /api/collections/ and hydrate the payments state
  const refreshCollections = async (): Promise<boolean> => {
    try {
      const response = await fetch('https://guidance-glorifier-mango.ngrok-free.dev/api/collections/', {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const apiCollections: CollectionRecord[] = await response.json();
        if (Array.isArray(apiCollections)) {

          // Deduplicate: for the same customer+group+month keep the one with the highest id
          const byKey: Record<string, CollectionRecord[]> = {};
          apiCollections.forEach((c) => {
            const key = `${c.customer}-${c.group}-${c.month_number}`;
            if (!byKey[key]) byKey[key] = [];
            byKey[key].push(c);
          });

          const canonicalCollections: CollectionRecord[] = [];
          const orphanCollectionIds: number[] = [];

          Object.values(byKey).forEach((group) => {
            group.sort((a, b) => b.id - a.id); // newest first
            canonicalCollections.push(group[0]);
            group.slice(1).forEach((c) => orphanCollectionIds.push(c.id));
          });

          // Silently clean up backend duplicates
          if (orphanCollectionIds.length > 0) {
            Promise.all(
              orphanCollectionIds.map((id) =>
                fetch(`https://guidance-glorifier-mango.ngrok-free.dev/api/collections/${id}/`, {
                  method: 'DELETE',
                  headers: { 'ngrok-skip-browser-warning': 'true' },
                }).catch(() => {})
              )
            );
          }

          setCollections(canonicalCollections);
          await AsyncStorage.setItem('local_collections', JSON.stringify(canonicalCollections));

          // Map each collection record into our local Payment state
          setPayments((prevPayments) => {
            const updatedPayments = [...prevPayments];
            let changed = false;

            canonicalCollections.forEach((c) => {
              const groupId = `G${c.group}`;
              const memberId = `M${c.customer}`;
              const paymentId = `P-${groupId}-M${c.month_number}-${memberId}`;
              const modeMap: Record<string, Payment['paymentMode']> = {
                cash: 'Cash',
                upi: 'UPI',
                bank_transfer: 'Bank Transfer',
              };

              const paymentData: Payment = {
                id: paymentId,
                groupId,
                memberId,
                monthNumber: c.month_number,
                amountPaid: parseFloat(c.amount) || 0,
                paymentDate: c.created_at ? c.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
                paymentMode: modeMap[c.payment_mode] || 'UPI',
                transactionRef: c.transaction_ref || `TXN-M${c.customer}-${groupId}-${c.month_number}`,
                status: c.status || 'paid',
              };

              const existingIdx = updatedPayments.findIndex((p) => p.id === paymentId);
              if (existingIdx !== -1) {
                const current = updatedPayments[existingIdx];
                if (
                  current.status !== paymentData.status ||
                  current.amountPaid !== paymentData.amountPaid ||
                  current.paymentMode !== paymentData.paymentMode ||
                  current.paymentDate !== paymentData.paymentDate ||
                  current.transactionRef !== paymentData.transactionRef
                ) {
                  updatedPayments[existingIdx] = paymentData;
                  changed = true;
                }
              } else {
                updatedPayments.push(paymentData);
                changed = true;
              }
            });

            if (changed) persistPayments(updatedPayments);
            return updatedPayments;
          });

          return true;
        }
      }
    } catch (e) {
      console.error('Failed to refresh collections', e);
    }
    return false;
  };

  // Add a new group (saves to the backend API and keeps local fallback state)
  const addGroup = async (group: Omit<FundGroup, 'id' | 'auctions' | 'kittyPayouts'>): Promise<{ success: boolean; isFallback: boolean; error?: string }> => {
    try {
      const response = await fetch('https://guidance-glorifier-mango.ngrok-free.dev/api/groups/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          group_name: group.name,
          chit_value: group.totalValue,
          duration_months: group.durationMonths,
          total_members: group.totalMembers,
          monthly_installment: group.monthlyInstallment,
          start_date: group.startDate,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status code ${response.status}`);
      }

      const createdGroup = await response.json();
      const newId = `G${createdGroup.id}`;
      const newGroup: FundGroup = {
        ...group,
        id: newId,
        auctions: [],
        kittyPayouts: [],
        removedMembers: [],
      };

      setGroups((prev) => {
        const updated = [...prev, newGroup];
        persistGroupsMeta(updated);
        return updated;
      });

      // Create pending payments placeholders for all assigned members for all months
      const placeholders: Payment[] = [];
      newGroup.members.forEach((mId) => {
        for (let m = 1; m <= newGroup.durationMonths; m++) {
          placeholders.push({
            id: `P-${newId}-M${m}-${mId}`,
            groupId: newId,
            memberId: mId,
            monthNumber: m,
            amountPaid: 0,
            paymentDate: '',
            paymentMode: 'UPI',
            transactionRef: '',
            status: 'pending',
          });
        }
      });

      setPayments((prev) => {
        const updatedP = [...prev, ...placeholders];
        persistPayments(updatedP);
        return updatedP;
      });

      return { success: true, isFallback: false };
    } catch (error: any) {
      console.error('Failed to save group to API, falling back to local creation', error);
      
      // Fallback local creation in case of API failure or offline mode
      const newId = `G${Date.now()}`;
      const newGroup: FundGroup = {
        ...group,
        id: newId,
        auctions: [],
        kittyPayouts: [],
        removedMembers: [],
      };

      setGroups((prev) => {
        const updated = [...prev, newGroup];
        persistGroupsMeta(updated);
        return updated;
      });

      const placeholders: Payment[] = [];
      newGroup.members.forEach((mId) => {
        for (let m = 1; m <= newGroup.durationMonths; m++) {
          placeholders.push({
            id: `P-${newId}-M${m}-${mId}`,
            groupId: newId,
            memberId: mId,
            monthNumber: m,
            amountPaid: 0,
            paymentDate: '',
            paymentMode: 'UPI',
            transactionRef: '',
            status: 'pending',
          });
        }
      });

      setPayments((prev) => {
        const updatedP = [...prev, ...placeholders];
        persistPayments(updatedP);
        return updatedP;
      });

      return { success: true, isFallback: true, error: error.message || String(error) };
    }
  };

  // Add a new member (saves to the backend API and keeps local fallback state)
  const addMember = async (member: Omit<Member, 'id'>): Promise<{ success: boolean; isFallback: boolean; error?: string }> => {
    let groupBackendId = 1;
    const groupTkt = member.groupTktNo || '';
    
    // Try to see if any group ID from our list is typed
    const matchedGroup = groups.find(g => 
      groupTkt.toLowerCase().includes(g.id.toLowerCase()) || 
      groupTkt.toLowerCase().includes(g.name.toLowerCase())
    );
    if (matchedGroup) {
      groupBackendId = parseInt(matchedGroup.id.replace('G', ''));
    } else {
      // Otherwise try to extract the first number from the input
      const numMatch = groupTkt.match(/\d+/);
      if (numMatch) {
        groupBackendId = parseInt(numMatch[0]);
      } else if (groups.length > 0) {
        // Or fallback to the first active group in our state
        groupBackendId = parseInt(groups[0].id.replace('G', ''));
      }
    }

    try {
      const payload = {
        branch_name: member.branchName || 'N/A',
        agent_name: member.agentName || 'N/A',
        group_ticket_no: member.groupTktNo || 'N/A',
        admission_fees: parseFloat(member.admissionFees || '0') || 0,
        customer_name: member.name,
        father_husband_name: member.fatherHusbandName || 'N/A',
        date_of_birth: (member.dob && member.dob !== 'N/A' && /^\d{4}-\d{2}-\d{2}$/.test(member.dob)) ? member.dob : '2000-01-01',
        gender: member.gender || 'Male',
        marital_status: member.maritalStatus || 'Single',
        subscriber_status: member.subscriberStatus || 'Individual',
        income_source: member.incomeSource || 'Salary',
        email: member.email || 'N/A',
        mobile_number: member.phone,
        bank_name: member.bankName || 'N/A',
        branch: member.bankBranch || 'N/A',
        account_number: member.accountNo || 'N/A',
        ifsc_code: member.ifscCode || 'N/A',
        residence_address: member.address,
        nominee_name: member.nomineeName || 'N/A',
        nominee_age: parseInt(member.nomineeAge || '0') || 0,
        nominee_relationship: member.nomineeRelationship || 'N/A',
        witness_one: member.witness1NameAddress || 'N/A',
        witness_two: member.witness2NameAddress || 'N/A',
        proof_type: member.identityProofType || 'AADHAR',
        place: member.place || 'Gobichettipalayam',
        group: groupBackendId
      };

      const response = await fetch('https://guidance-glorifier-mango.ngrok-free.dev/api/customers/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server returned status code ${response.status}`);
      }

      const createdCustomer = await response.json();
      const newId = `M${createdCustomer.id}`;
      const newMember: Member = {
        ...member,
        id: newId,
      };

      setMembers((prev) => {
        const updated = [...prev, newMember];
        AsyncStorage.setItem('local_members', JSON.stringify(updated)).catch(e => console.error(e));
        return updated;
      });

      // Add member to the group locally — do NOT call registerMemberInGroup here as it would
      // POST a duplicate to /api/customer-groups/. The backend already has the relationship
      // via the customer's group field. refreshAssignments() will sync on next load.
      const targetGroupId = `G${groupBackendId}`;
      setGroups((prev) => {
        const updated = prev.map((g) => {
          if (g.id !== targetGroupId) return g;
          if (g.members.includes(newId)) return g;
          if (g.members.length >= g.totalMembers) return g;
          const updatedMembers = [...g.members, newId];
          const placeholders: Payment[] = [];
          for (let m = 1; m <= g.durationMonths; m++) {
            placeholders.push({
              id: `P-${targetGroupId}-M${m}-${newId}`,
              groupId: targetGroupId,
              memberId: newId,
              monthNumber: m,
              amountPaid: 0,
              paymentDate: '',
              paymentMode: 'UPI',
              transactionRef: '',
              status: 'pending',
            });
          }
          setPayments((prevP) => {
            const updatedP = [...prevP, ...placeholders];
            persistPayments(updatedP);
            return updatedP;
          });
          return { ...g, members: updatedMembers };
        });
        persistGroupsMeta(updated);
        return updated;
      });

      return { success: true, isFallback: false };
    } catch (error: any) {
      console.error('Failed to create customer on API, falling back to local creation', error);
      
      // Fallback local creation in case of API failure or offline mode
      const newId = `M${Date.now()}`;
      const newMember: Member = {
        ...member,
        id: newId,
      };

      setMembers((prev) => {
        const updated = [...prev, newMember];
        AsyncStorage.setItem('local_members', JSON.stringify(updated)).catch(e => console.error(e));
        return updated;
      });

      // Offline: register in group locally only (no API call, avoid duplicates)
      const targetGroupId = `G${groupBackendId}`;
      setGroups((prev) => {
        const updated = prev.map((g) => {
          if (g.id !== targetGroupId) return g;
          if (g.members.includes(newId)) return g;
          if (g.members.length >= g.totalMembers) return g;
          const updatedMembers = [...g.members, newId];
          const placeholders: Payment[] = [];
          for (let m = 1; m <= g.durationMonths; m++) {
            placeholders.push({
              id: `P-${targetGroupId}-M${m}-${newId}`,
              groupId: targetGroupId,
              memberId: newId,
              monthNumber: m,
              amountPaid: 0,
              paymentDate: '',
              paymentMode: 'UPI',
              transactionRef: '',
              status: 'pending',
            });
          }
          setPayments((prevP) => {
            const updatedP = [...prevP, ...placeholders];
            persistPayments(updatedP);
            return updatedP;
          });
          return { ...g, members: updatedMembers };
        });
        persistGroupsMeta(updated);
        return updated;
      });

      return { success: true, isFallback: true, error: error.message || String(error) };
    }
  };

  const deleteMember = async (memberId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const apiId = memberId.replace('M', '');
      
      const response = await fetch(`https://guidance-glorifier-mango.ngrok-free.dev/api/customers/${apiId}/`, {
        method: 'DELETE',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
        },
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`Server returned status code ${response.status}`);
      }

      // Successful deletion on backend, update local state
      setMembers((prev) => {
        const updated = prev.filter((m) => m.id !== memberId);
        AsyncStorage.setItem('local_members', JSON.stringify(updated)).catch(e => console.error(e));
        return updated;
      });

      setGroups((prev) => {
        const updated = prev.map(g => ({
          ...g,
          members: g.members.filter(id => id !== memberId)
        }));
        persistGroupsMeta(updated);
        return updated;
      });

      setAssignments((prev) => {
        const customerIntId = parseInt(apiId);
        const updated = prev.filter((a) => a.customer !== customerIntId);
        persistAssignments(updated);
        return updated;
      });

      setPayments((prev) => {
        const updatedP = prev.filter((p) => p.memberId !== memberId);
        persistPayments(updatedP);
        return updatedP;
      });

      return { success: true };
    } catch (error: any) {
      console.error('Failed to delete member on API, performing local fallback deletion', error);
      
      // Fallback local deletion in case of API failure or offline mode
      setMembers((prev) => {
        const updated = prev.filter((m) => m.id !== memberId);
        AsyncStorage.setItem('local_members', JSON.stringify(updated)).catch(e => console.error(e));
        return updated;
      });

      setGroups((prev) => {
        const updated = prev.map(g => ({
          ...g,
          members: g.members.filter(id => id !== memberId)
        }));
        persistGroupsMeta(updated);
        return updated;
      });

      setAssignments((prev) => {
        const customerIntId = parseInt(memberId.replace('M', ''));
        const updated = prev.filter((a) => a.customer !== customerIntId);
        persistAssignments(updated);
        return updated;
      });

      setPayments((prev) => {
        const updatedP = prev.filter((p) => p.memberId !== memberId);
        persistPayments(updatedP);
        return updatedP;
      });

      return { success: true, error: error.message || String(error) };
    }
  };

  // Assign a member to a group
  const registerMemberInGroup = async (
    groupId: string,
    memberId: string
  ): Promise<{ success: boolean; isFallback: boolean; error?: string }> => {
    const groupIntId = parseInt(groupId.replace('G', ''));
    const customerIntId = parseInt(memberId.replace('M', ''));
    
    const member = members.find((m) => m.id === memberId);
    const targetGroup = groups.find((g) => g.id === groupId);
    const totalCurrentMembers = targetGroup?.members.length ?? 0;
    const ticketNo = member?.groupTktNo && member.groupTktNo !== 'N/A' 
      ? member.groupTktNo 
      : `Tkt ${totalCurrentMembers + 1}`;

    const newEncodedTicket = encodeGroupTicketNo(ticketNo, []);

    try {
      const response = await fetch('https://guidance-glorifier-mango.ngrok-free.dev/api/customer-groups/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          customer: customerIntId,
          group: groupIntId,
          group_ticket_no: newEncodedTicket,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status code ${response.status}`);
      }

      const createdAssignment = await response.json();

      setAssignments((prev) => {
        const updated = [...prev, createdAssignment];
        persistAssignments(updated);
        return updated;
      });

      setGroups((prev) => {
        const updated = prev.map((g) => {
          if (g.id !== groupId) return g;
          if (g.members.includes(memberId)) return g;
          if (g.members.length >= g.totalMembers) return g;

          const updatedMembers = [...g.members, memberId];
          
          const placeholders: Payment[] = [];
          for (let m = 1; m <= g.durationMonths; m++) {
            placeholders.push({
              id: `P-${groupId}-M${m}-${memberId}`,
              groupId,
              memberId,
              monthNumber: m,
              amountPaid: 0,
              paymentDate: '',
              paymentMode: 'UPI',
              transactionRef: '',
              status: 'pending',
            });
          }
          setPayments((prevP) => {
            const updatedP = [...prevP, ...placeholders];
            persistPayments(updatedP);
            return updatedP;
          });

          return { ...g, members: updatedMembers };
        });
        persistGroupsMeta(updated);
        return updated;
      });

      return { success: true, isFallback: false };
    } catch (error: any) {
      console.error('Failed to assign subscriber in backend API, performing local fallback', error);

      setGroups((prev) => {
        const updated = prev.map((g) => {
          if (g.id !== groupId) return g;
          if (g.members.includes(memberId)) return g;
          if (g.members.length >= g.totalMembers) return g;

          const updatedMembers = [...g.members, memberId];
          
          const placeholders: Payment[] = [];
          for (let m = 1; m <= g.durationMonths; m++) {
            placeholders.push({
              id: `P-${groupId}-M${m}-${memberId}`,
              groupId,
              memberId,
              monthNumber: m,
              amountPaid: 0,
              paymentDate: '',
              paymentMode: 'UPI',
              transactionRef: '',
              status: 'pending',
            });
          }
          setPayments((prevP) => {
            const updatedP = [...prevP, ...placeholders];
            persistPayments(updatedP);
            return updatedP;
          });

          return { ...g, members: updatedMembers };
        });
        persistGroupsMeta(updated);
        return updated;
      });

      return { success: true, isFallback: true, error: error.message || String(error) };
    }
  };

  // Remove a member from a group
  const removeMemberFromGroup = async (
    groupId: string,
    memberId: string
  ): Promise<{ success: boolean; isFallback: boolean; error?: string }> => {
    const groupIntId = parseInt(groupId.replace('G', ''));
    const customerIntId = parseInt(memberId.replace('M', ''));

    const assignment = assignments.find(
      (a) => a.customer === customerIntId && a.group === groupIntId
    );

    try {
      if (assignment) {
        const response = await fetch(`https://guidance-glorifier-mango.ngrok-free.dev/api/customer-groups/${assignment.id}/`, {
          method: 'DELETE',
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Accept': 'application/json',
          },
        });

        if (!response.ok && response.status !== 404) {
          throw new Error(`Server returned status code ${response.status}`);
        }
      }

      setAssignments((prev) => {
        const updated = prev.filter((a) => !(a.customer === customerIntId && a.group === groupIntId));
        persistAssignments(updated);
        return updated;
      });

      setGroups((prev) => {
        const updated = prev.map((g) => {
          if (g.id !== groupId) return g;
          
          setPayments((prevP) => {
            const updatedP = prevP.filter((p) => !(p.groupId === groupId && p.memberId === memberId));
            persistPayments(updatedP);
            return updatedP;
          });
          
          const currentRemoved = g.removedMembers || [];
          const updatedRemoved = currentRemoved.includes(memberId)
            ? currentRemoved
            : [...currentRemoved, memberId];

          return {
            ...g,
            members: g.members.filter((id) => id !== memberId),
            removedMembers: updatedRemoved,
          };
        });
        persistGroupsMeta(updated);
        return updated;
      });

      return { success: true, isFallback: false };
    } catch (error: any) {
      console.error('Failed to remove subscriber from backend API, performing local fallback', error);

      setAssignments((prev) => {
        const updated = prev.filter((a) => !(a.customer === customerIntId && a.group === groupIntId));
        persistAssignments(updated);
        return updated;
      });

      setGroups((prev) => {
        const updated = prev.map((g) => {
          if (g.id !== groupId) return g;
          
          setPayments((prevP) => {
            const updatedP = prevP.filter((p) => !(p.groupId === groupId && p.memberId === memberId));
            persistPayments(updatedP);
            return updatedP;
          });
          
          const currentRemoved = g.removedMembers || [];
          const updatedRemoved = currentRemoved.includes(memberId)
            ? currentRemoved
            : [...currentRemoved, memberId];

          return {
            ...g,
            members: g.members.filter((id) => id !== memberId),
            removedMembers: updatedRemoved,
          };
        });
        persistGroupsMeta(updated);
        return updated;
      });

      return { success: true, isFallback: true, error: error.message || String(error) };
    }
  };

  // Replace a removed member with a new subscriber in a group
  const replaceMemberInGroup = async (
    groupId: string,
    removedMemberId: string,
    newMemberId: string
  ): Promise<{ success: boolean; isFallback: boolean; error?: string }> => {
    // 1. Remove the old member (this will delete their backend assignment and clear their local payments).
    const removeRes = await removeMemberFromGroup(groupId, removedMemberId);
    if (!removeRes.success) {
      return { success: false, isFallback: removeRes.isFallback, error: "Failed to remove the old subscriber: " + removeRes.error };
    }

    // 2. Register the new member into the group (creates the customer-group assignment on backend, sets up the payments).
    const addRes = await registerMemberInGroup(groupId, newMemberId);
    if (!addRes.success) {
      return { success: false, isFallback: addRes.isFallback, error: "Removed old subscriber, but failed to register replacement subscriber: " + addRes.error };
    }

    // 3. Ensure the removed member is kept in removedMembers
    setGroups((prev) => {
      const updated = prev.map((g) => {
        if (g.id !== groupId) return g;
        const removed = g.removedMembers || [];
        const updatedRemoved = removed.includes(removedMemberId) ? removed : [...removed, removedMemberId];
        return {
          ...g,
          removedMembers: updatedRemoved,
        };
      });
      persistGroupsMeta(updated);
      return updated;
    });

    return { success: true, isFallback: addRes.isFallback };
  };

  // Delete a group (from the backend API and local fallback state)
  const deleteGroup = async (groupId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const apiId = groupId.replace('G', '');
      
      const response = await fetch(`https://guidance-glorifier-mango.ngrok-free.dev/api/groups/${apiId}/`, {
        method: 'DELETE',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
        },
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`Server returned status code ${response.status}`);
      }

      // Successful deletion on backend, update local state
      setGroups((prev) => {
        const updated = prev.filter((g) => g.id !== groupId);
        persistGroupsMeta(updated);
        return updated;
      });

      setAssignments((prev) => {
        const groupIntId = parseInt(groupId.replace('G', ''));
        const updated = prev.filter((a) => a.group !== groupIntId);
        persistAssignments(updated);
        return updated;
      });

      setPayments((prev) => {
        const updatedP = prev.filter((p) => p.groupId !== groupId);
        persistPayments(updatedP);
        return updatedP;
      });

      return { success: true };
    } catch (error: any) {
      console.error('Failed to delete group on API, performing local fallback deletion', error);
      
      // Fallback local deletion in case of API failure or offline mode
      setGroups((prev) => {
        const updated = prev.filter((g) => g.id !== groupId);
        persistGroupsMeta(updated);
        return updated;
      });

      setAssignments((prev) => {
        const groupIntId = parseInt(groupId.replace('G', ''));
        const updated = prev.filter((a) => a.group !== groupIntId);
        persistAssignments(updated);
        return updated;
      });

      setPayments((prev) => {
        const updatedP = prev.filter((p) => p.groupId !== groupId);
        persistPayments(updatedP);
        return updatedP;
      });

      return { success: true, error: error.message || String(error) };
    }
  };

  // Calculate the custom installment for a specific month in a group
  const getGroupInstallmentForMonth = (groupId: string, monthNumber: number): number => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return 0;

    if (group.type === 'chit') {
      // Find if an auction was conducted for this specific month
      const auction = group.auctions.find((a) => a.monthNumber === monthNumber);
      if (auction) {
        // Dynamically recompute to fix any previously saved bad calculations
        const divPerMember = Math.round(auction.dividend / group.totalMembers);
        return group.monthlyInstallment - divPerMember;
      }
      // If auction not held yet, default installment is totalValue / totalMembers
      return group.monthlyInstallment;
    }

    // Default for kitty/savings is fixed monthly installment
    return group.monthlyInstallment;
  };

  // Record a Monthly Auction Winner for Chit Group
  const recordAuction = (groupId: string, winnerMemberId: string, bidAmount: number, date = new Date().toISOString().split('T')[0]) => {
    setGroups((prevGroups) => {
      const updated = prevGroups.map((g) => {
        if (g.id !== groupId) return g;
        
        const monthNumber = g.auctions.length + 1;
        if (monthNumber > g.durationMonths) return g;

        // Formula calculations:
        const commission = Math.round((g.totalValue * g.commissionPercent) / 100);
        const dividend = Math.max(0, bidAmount - commission);
        const netPayout = g.totalValue - bidAmount;
        const totalMembers = g.totalMembers;
        const dividendPerMember = Math.round(dividend / totalMembers);
        const actualInstallment = g.monthlyInstallment - dividendPerMember;

        const newAuction: Auction = {
          monthNumber,
          date,
          winnerMemberId,
          bidAmount,
          commission,
          dividend,
          netPayout,
          actualInstallment,
        };

        const updatedAuctions = [...g.auctions, newAuction];
        const isCompleted = updatedAuctions.length === g.durationMonths;

        // We must update the pending payments for THIS month to match the actual calculated installment
        setPayments((prevP) => {
          const updatedP = prevP.map((p) => {
            if (p.groupId === groupId && p.monthNumber === monthNumber) {
              if (p.status === 'pending') {
                // If it is pending, set the amount due
                return { ...p, amountPaid: 0 };
              }
            }
            return p;
          });
          persistPayments(updatedP);
          return updatedP;
        });

        return {
          ...g,
          auctions: updatedAuctions,
          status: (isCompleted ? 'completed' : 'active') as 'completed' | 'active',
        };
      });
      persistGroupsMeta(updated);
      return updated;
    });
  };

  // Record a Rotational Payout for Kitty Party
  const recordKittyPayout = (groupId: string, winnerMemberId: string, date = new Date().toISOString().split('T')[0]) => {
    setGroups((prevGroups) => {
      const updated = prevGroups.map((g) => {
        if (g.id !== groupId) return g;

        const monthNumber = g.kittyPayouts.length + 1;
        if (monthNumber > g.durationMonths) return g;

        const newPayout: KittyPayout = {
          monthNumber,
          date,
          winnerMemberId,
          payoutAmount: g.totalValue,
          actualInstallment: g.monthlyInstallment,
        };

        const updatedPayouts = [...g.kittyPayouts, newPayout];
        const isCompleted = updatedPayouts.length === g.durationMonths;

        return {
          ...g,
          kittyPayouts: updatedPayouts,
          status: (isCompleted ? 'completed' : 'active') as 'completed' | 'active',
        };
      });
      persistGroupsMeta(updated);
      return updated;
    });
  };

  // Record/Update a Payment
  const recordPayment = (payment: Omit<Payment, 'id'>): Payment => {
    const paymentId = `P-${payment.groupId}-M${payment.monthNumber}-${payment.memberId}`;
    const newPayment: Payment = {
      ...payment,
      id: paymentId,
    };

    setPayments((prev) => {
      const exists = prev.some((p) => p.id === paymentId);
      let updatedP: Payment[] = [];
      if (exists) {
        updatedP = prev.map((p) => (p.id === paymentId ? newPayment : p));
      } else {
        updatedP = [...prev, newPayment];
      }
      persistPayments(updatedP);
      return updatedP;
    });

    return newPayment;
  };

  // Save/update a monthly payment using /api/collections/ as the primary backend store
  const updatePaymentStatus = async (
    groupId: string,
    memberId: string,
    month: number,
    paid: boolean,
    details?: Partial<Payment>
  ): Promise<{ success: boolean; isFallback: boolean; error?: string }> => {
    const groupIntId = parseInt(groupId.replace('G', ''));
    const customerIntId = parseInt(memberId.replace('M', ''));
    const amountDue = getGroupInstallmentForMonth(groupId, month);
    const memberSuffix = memberId.includes('M') ? memberId.replace('M', '') : memberId;

    // Map our local payment mode format to the API's accepted values
    const modeToApi: Record<string, 'cash' | 'upi' | 'bank_transfer'> = {
      'Cash': 'cash',
      'UPI': 'upi',
      'Bank Transfer': 'bank_transfer',
    };

    // Map API payment mode back to local format
    const modeFromApi: Record<string, Payment['paymentMode']> = {
      cash: 'Cash',
      upi: 'UPI',
      bank_transfer: 'Bank Transfer',
    };

    // Find existing collection records for this customer+group+month
    const existingCollections = collections.filter(
      (c) => c.customer === customerIntId && c.group === groupIntId && c.month_number === month
    );

    const paymentId = `P-${groupId}-M${month}-${memberId}`;
    const txRef = details?.transactionRef || `TXN-M${memberSuffix}-${groupId}-${month}`;
    const paymentDate = details?.paymentDate ?? new Date().toISOString().split('T')[0];
    const selectedMode = details?.paymentMode ?? 'UPI';
    const apiMode = modeToApi[selectedMode] ?? 'upi';
    const amountPaid = details?.amountPaid !== undefined ? details.amountPaid : (paid ? amountDue : 0);

    try {
      let newCollection: CollectionRecord | null = null;
      
      const payload = {
        customer: customerIntId,
        group: groupIntId,
        month_number: month,
        amount: amountPaid.toString(),
        payment_mode: apiMode,
        transaction_ref: txRef || null,
        status: paid ? 'paid' : 'pending',
      };

      if (existingCollections.length > 0) {
        const primaryCollection = existingCollections[0];
        
        // Delete any extra duplicates just to be safe
        for (let i = 1; i < existingCollections.length; i++) {
          await fetch(`https://guidance-glorifier-mango.ngrok-free.dev/api/collections/${existingCollections[i].id}/`, {
            method: 'DELETE',
            headers: { 'ngrok-skip-browser-warning': 'true' },
          }).catch(() => {});
        }

        // PATCH the primary collection
        const patchRes = await fetch(
          `https://guidance-glorifier-mango.ngrok-free.dev/api/collections/${primaryCollection.id}/`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
              'Accept': 'application/json',
            },
            body: JSON.stringify(payload),
          }
        );

        if (!patchRes.ok) {
          const errBody = await patchRes.json().catch(() => ({}));
          throw new Error(`Failed to update collection: status ${patchRes.status} — ${JSON.stringify(errBody)}`);
        }
        
        newCollection = await patchRes.json();
      } else {
        // POST new collection
        const postRes = await fetch(
          'https://guidance-glorifier-mango.ngrok-free.dev/api/collections/',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
              'Accept': 'application/json',
            },
            body: JSON.stringify(payload),
          }
        );

        if (!postRes.ok) {
          const errBody = await postRes.json().catch(() => ({}));
          throw new Error(`Failed to create collection: status ${postRes.status} — ${JSON.stringify(errBody)}`);
        }

        newCollection = await postRes.json();
      }

      // Update local collections state
      setCollections((prev) => {
        const filtered = prev.filter(
          (c) => !(c.customer === customerIntId && c.group === groupIntId && c.month_number === month)
        );
        const updated = newCollection ? [...filtered, newCollection] : filtered;
        AsyncStorage.setItem('local_collections', JSON.stringify(updated)).catch(() => {});
        return updated;
      });

      // Update local payment record to reflect the new state
      setPayments((prev) => {
        const paymentData: Payment = {
          id: paymentId,
          groupId,
          memberId,
          monthNumber: month,
          amountPaid,
          paymentDate,
          paymentMode: selectedMode as Payment['paymentMode'],
          transactionRef: newCollection?.transaction_ref || txRef,
          status: paid ? 'paid' : 'pending',
        };

        const exists = prev.some((p) => p.id === paymentId);
        let updatedP: Payment[];
        if (exists) {
          updatedP = prev.map((p) => (p.id === paymentId ? paymentData : p));
        } else {
          updatedP = [...prev, paymentData];
        }
        persistPayments(updatedP);
        return updatedP;
      });

      return { success: true, isFallback: false };
    } catch (error: any) {
      console.error('Failed to sync payment via /api/collections/, performing local fallback', error);

      // Local-only fallback on network failure
      setPayments((prev) => {
        const paymentData: Payment = {
          id: paymentId,
          groupId,
          memberId,
          monthNumber: month,
          amountPaid,
          paymentDate,
          paymentMode: selectedMode as Payment['paymentMode'],
          transactionRef: txRef,
          status: paid ? 'paid' : 'pending',
        };

        const exists = prev.some((p) => p.id === paymentId);
        let updatedP: Payment[];
        if (exists) {
          updatedP = prev.map((p) => (p.id === paymentId ? paymentData : p));
        } else {
          updatedP = [...prev, paymentData];
        }
        persistPayments(updatedP);
        return updatedP;
      });

      return { success: true, isFallback: true, error: error.message || String(error) };
    }
  };

  // Generate complete member financial ledger profile
  const getMemberLedger = (memberId: string) => {
    const memberPayments = payments.filter((p) => p.memberId === memberId);
    const joinedGroups = groups.filter((g) => g.members.includes(memberId));

    let totalPaid = 0;
    let totalOutstanding = 0;
    let totalDividendsEarned = 0;

    // Calculate Paid amount
    memberPayments.forEach((p) => {
      if (p.status === 'paid') {
        totalPaid += p.amountPaid;
      }
    });

    // Calculate Outstanding amount and Dividends
    joinedGroups.forEach((g) => {
      for (let m = 1; m <= g.durationMonths; m++) {
        const payment = memberPayments.find((p) => p.groupId === g.id && p.monthNumber === m);
        const installmentDue = getGroupInstallmentForMonth(g.id, m);

        if (g.type === 'chit') {
          const auction = g.auctions.find((a) => a.monthNumber === m);
          if (auction) {
            const divPerMember = Math.round(auction.dividend / g.totalMembers);
            totalDividendsEarned += divPerMember;
          }
        }

        if (!payment || payment.status === 'pending') {
          totalOutstanding += installmentDue;
        }
      }
    });

    return {
      joinedGroupsCount: joinedGroups.length,
      totalPaid,
      totalOutstanding,
      totalDividendsEarned,
      paymentHistory: memberPayments.filter((p) => p.status === 'paid'),
    };
  };

  return (
    <FundsContext.Provider
      value={{
        groups,
        members,
        payments,
        assignments,
        collections,
        isDarkMode,
        toggleTheme,
        addGroup,
        deleteGroup,
        addMember,
        deleteMember,
        registerMemberInGroup,
        removeMemberFromGroup,
        replaceMemberInGroup,
        recordAuction,
        recordKittyPayout,
        recordPayment,
        updatePaymentStatus,
        getMemberLedger,
        getGroupInstallmentForMonth,
        refreshGroups,
        refreshMembers,
        refreshAssignments,
        refreshCollections,
      }}
    >
      {children}
    </FundsContext.Provider>
  );
};

export const useFunds = () => {
  const context = useContext(FundsContext);
  if (context === undefined) {
    throw new Error('useFunds must be used within a FundsProvider');
  }
  return context;
};
