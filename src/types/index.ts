export interface Member {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  joiningDate: string;

  // New Chit Enrollment Form Fields
  branchName?: string;
  agentName?: string;
  chitValue?: string;
  groupTktNo?: string;
  duration?: string;
  monthlyInstAmt?: string;
  admissionFees?: string;
  fatherHusbandName?: string;
  dob?: string;
  gender?: 'Male' | 'Female' | 'Other';
  maritalStatus?: string;
  subscriberStatus?: 'Individual' | 'Firm';
  gstNo?: string;
  incomeSource?: 'Salary' | 'Business' | 'Others';
  incomeSourceOthers?: string;
  bankName?: string;
  bankBranch?: string;
  accountType?: 'SB' | 'CA';
  accountNo?: string;
  ifscCode?: string;
  officeAddress?: string;
  nomineeName?: string;
  nomineeAge?: string;
  nomineeRelationship?: string;
  witness1NameAddress?: string;
  witness2NameAddress?: string;
  identityProofType?: 'PAN' | 'AADHAR' | 'VOTER ID';
  identityProofNo?: string;
  place?: string;
  date?: string;
}

export type FundType = 'chit' | 'kitty' | 'savings';

export interface Auction {
  monthNumber: number;
  date: string;
  winnerMemberId: string;
  bidAmount: number; // Discount bid by winner
  commission: number; // Admin commission
  dividend: number; // Dividend distributed (bidAmount - commission)
  netPayout: number; // Net amount received by winner (totalValue - bidAmount)
  actualInstallment: number; // Final installment paid by all members (monthlyInstallment - dividend/totalMembers)
}

export interface KittyPayout {
  monthNumber: number;
  date: string;
  winnerMemberId: string;
  payoutAmount: number; // Total value of the kitty
  actualInstallment: number; // Equal to monthlyInstallment
}

export interface FundGroup {
  id: string;
  name: string;
  type: FundType;
  totalValue: number;
  durationMonths: number;
  totalMembers: number;
  monthlyInstallment: number;
  commissionPercent: number; // Applicable only to 'chit'
  interestRate: number; // Applicable only to 'savings' (annual interest rate e.g., 8)
  startDate: string;
  status: 'active' | 'completed';
  members: string[]; // List of Member IDs joined (index + 1 corresponds to ticket number)
  auctions: Auction[]; // Auctions held (only for 'chit' groups)
  kittyPayouts: KittyPayout[]; // Kitty payouts held (only for 'kitty' groups)
  removedMembers?: string[]; // List of Member IDs historically removed
  branchCode?: string;
  branchName?: string;
  auctionTime?: string;
}

export interface Payment {
  id: string;
  groupId: string;
  memberId: string;
  monthNumber: number;
  amountPaid: number;
  paymentDate: string;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer';
  transactionRef: string;
  status: 'paid' | 'pending';
}

export interface CustomerGroupAssignment {
  id: number;
  customer: number;
  group: number;
  group_ticket_no: string;
  joined_at?: string;
}

export interface CollectionRecord {
  id: number;
  month_number: number;
  status: 'paid' | 'pending';
  amount: string; // decimal string from DRF
  payment_mode: 'cash' | 'upi' | 'bank_transfer';
  transaction_ref: string | null;
  created_at?: string;
  customer: number;
  group: number;
}

