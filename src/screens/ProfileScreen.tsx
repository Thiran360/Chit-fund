import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity,
  Platform
} from 'react-native';
import { useFunds } from '../context/FundsContext';
import { useAlert } from '../context/AlertContext';
import { COLORS, BORDER_RADIUS, SPACING, SHADOWS } from '../utils/theme';
import { Card, Button, Badge } from '../components/UI';
import { PhoneIcon, LogoutIcon } from '../components/Icons';

interface Staff {
  id: number;
  name: string;
  mobile_number: string;
  role: string;
  created_at: string;
}

interface ProfileScreenProps {
  userRole: 'admin' | 'staff';
  userName: string;
  userMobile: string;
  onLogout: () => void;
  onProfileSync?: (name: string, mobile: string) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ 
  userRole, 
  userName, 
  userMobile, 
  onLogout,
  onProfileSync
}) => {
  const { showAlert } = useAlert();
  const { isDarkMode, toggleTheme } = useFunds();
  const activeColors = isDarkMode ? COLORS.dark : COLORS.light;

  // Profile details state (initially loaded from local cache props)
  const [profileData, setProfileData] = useState<Staff>({
    id: 0,
    name: userName || (userRole === 'admin' ? 'Admin User' : 'Staff Member'),
    mobile_number: userMobile || '9876543210',
    role: userRole,
    created_at: new Date().toISOString()
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch live staff profiles to sync full details
  const fetchLiveProfile = async () => {
    try {
      const response = await fetch('https://guidance-glorifier-mango.ngrok-free.dev/api/staff/', {
        method: 'GET',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Server returned status code ${response.status}`);
      }

      const staffList = await response.json();
      
      if (Array.isArray(staffList)) {
        // Find matching staff member by mobile or name (case-insensitive)
        let matched = staffList.find(
          (s: any) => 
            (userMobile && s.mobile_number === userMobile) ||
            (userName && s.name?.toLowerCase() === userName.toLowerCase())
        );

        // Smart Fallback: If no match was found (e.g. empty or default session),
        // try to find by role to sync the correct backend profile
        if (!matched && userRole) {
          matched = staffList.find(
            (s: any) => s.role?.toLowerCase() === userRole.toLowerCase()
          );
        }

        if (matched) {
          setProfileData({
            id: matched.id,
            name: matched.name,
            mobile_number: matched.mobile_number,
            role: matched.role === 'admin' ? 'admin' : 'staff',
            created_at: matched.created_at || new Date().toISOString(),
          });

          // Sync back to parent shell if name or mobile changed/were missing
          if (onProfileSync && (matched.name !== userName || matched.mobile_number !== userMobile)) {
            onProfileSync(matched.name, matched.mobile_number);
          }
        }
      }
    } catch (error) {
      console.warn('Unable to sync live profile from API. Using local session data.', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveProfile();
  }, [userMobile, userName]);

  // Extract initials for the avatar monogram
  const getInitials = (fullName: string) => {
    if (!fullName) return 'U';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Format creation timestamp
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: activeColors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      
      {/* 👤 Large Monogram Avatar & Core Bio */}
      <View style={styles.avatarCardWrapper}>
        <Card style={[styles.avatarCard, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
          <View style={styles.avatarContainer}>
            {/* Pulsing visual outer glow */}
            <View style={[styles.avatarGlow, { backgroundColor: activeColors.primary + '12' }]}>
              <View style={[styles.avatarBadge, { backgroundColor: activeColors.primary }]}>
                <Text style={styles.avatarBadgeText}>
                  {getInitials(profileData.name)}
                </Text>
              </View>
            </View>
            
            <Text style={[styles.profileName, { color: activeColors.text }]}>
              {profileData.name}
            </Text>
            
            <View style={styles.badgeRow}>
              <Badge 
                label={profileData.role.toUpperCase()}
                type={profileData.role === 'admin' ? 'completed' : 'savings'}
                style={styles.roleBadge}
              />
              <Badge 
                label="ACTIVE"
                type="active"
                style={styles.statusBadge}
              />
            </View>
          </View>
        </Card>
      </View>

      {/* 📄 Profile Details Card */}
      <Card style={[styles.detailsCard, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
        <View style={[styles.sectionHeader, { borderLeftColor: activeColors.primary }]}>
          <Text style={[styles.sectionTitle, { color: activeColors.text }]}>Personal Details</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={activeColors.primary} style={styles.loader} />
        ) : (
          <View style={styles.detailsGrid}>
            <View style={[styles.gridRow, { borderBottomColor: activeColors.border }]}>
              <Text style={[styles.gridLabel, { color: activeColors.textSecondary }]}>Full Name</Text>
              <Text style={[styles.gridValue, { color: activeColors.text }]}>{profileData.name}</Text>
            </View>

            <View style={[styles.gridRow, { borderBottomColor: activeColors.border }]}>
              <Text style={[styles.gridLabel, { color: activeColors.textSecondary }]}>Mobile Number</Text>
              <View style={styles.phoneValueRow}>
                <PhoneIcon color={activeColors.primary} size={14} />
                <Text style={[styles.gridValue, { color: activeColors.text, marginLeft: 6 }]}>
                  {profileData.mobile_number}
                </Text>
              </View>
            </View>

            <View style={[styles.gridRow, { borderBottomColor: activeColors.border }]}>
              <Text style={[styles.gridLabel, { color: activeColors.textSecondary }]}>System Role</Text>
              <Text style={[styles.gridValue, { color: activeColors.text, textTransform: 'capitalize' }]}>
                {profileData.role}
              </Text>
            </View>

            <View style={[styles.gridRow, { borderBottomColor: 'transparent' }]}>
              <Text style={[styles.gridLabel, { color: activeColors.textSecondary }]}>Joined Date</Text>
              <Text style={[styles.gridValue, { color: activeColors.text }]}>
                {formatDate(profileData.created_at)}
              </Text>
            </View>
          </View>
        )}
      </Card>

      {/* ⚙️ Theme Settings & Actions */}
      <Card style={[styles.actionsCard, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
        <View style={[styles.sectionHeader, { borderLeftColor: activeColors.primary }]}>
          <Text style={[styles.sectionTitle, { color: activeColors.text }]}>Settings & Security</Text>
        </View>

        <View style={styles.actionsList}>
          {/* Toggle Theme Action */}
          <TouchableOpacity 
            style={[styles.actionRow, { borderBottomColor: activeColors.border }]} 
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <View>
              <Text style={[styles.actionLabel, { color: activeColors.text }]}>Display Theme</Text>
              <Text style={[styles.actionSub, { color: activeColors.textSecondary }]}>
                Switch between Light and Dark mode
              </Text>
            </View>
            <Badge 
              label={isDarkMode ? 'DARK MODE' : 'LIGHT MODE'}
              type="completed"
            />
          </TouchableOpacity>

          {/* Secure Authentication Gateway */}
          <View style={styles.actionRow}>
            <View>
              <Text style={[styles.actionLabel, { color: activeColors.text }]}>Authentication Mode</Text>
              <Text style={[styles.actionSub, { color: activeColors.textSecondary }]}>
                Remote Secure API Handshake
              </Text>
            </View>
            <Badge 
              label="SECURED"
              type="active"
            />
          </View>
        </View>
      </Card>

      {/* 🚪 Large Premium Sign Out Action */}
      <View style={styles.logoutWrapper}>
        <Button 
          title="Sign Out Account" 
          onPress={() => {
            showAlert(
              'Sign Out',
              'Are you sure you want to end your current session?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Sign Out', 
                  style: 'destructive',
                  onPress: onLogout
                }
              ]
            );
          }}
          variant="danger"
          style={styles.logoutBtn}
        />
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 110, // tab bar clearance
  },
  avatarCardWrapper: {
    marginBottom: SPACING.md,
    marginTop: SPACING.xs,
  },
  avatarCard: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.premium,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatarGlow: {
    width: 104,
    height: 104,
    borderRadius: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarBadge: {
    width: 86,
    height: 86,
    borderRadius: 43,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  avatarBadgeText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: SPACING.xs,
    letterSpacing: 0.2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  roleBadge: {
    paddingHorizontal: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
  },
  detailsCard: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  sectionHeader: {
    borderLeftWidth: 4,
    paddingLeft: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  loader: {
    paddingVertical: SPACING.lg,
  },
  detailsGrid: {
    marginTop: SPACING.xs,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  gridLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  gridValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  phoneValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionsCard: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  actionsList: {
    marginTop: SPACING.xs,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  actionSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  logoutWrapper: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  logoutBtn: {
    width: '100%',
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
  },
});
