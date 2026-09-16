import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useFunds } from '../context/FundsContext';
import { useAlert } from '../context/AlertContext';
import { COLORS, BORDER_RADIUS, SPACING, SHADOWS } from '../utils/theme';
import { Button, TextInput, Card } from '../components/UI';

interface LoginScreenProps {
  onLoginSuccess: (role: 'admin' | 'staff', name: string, mobile: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { showAlert } = useAlert();
  const { isDarkMode } = useFunds();
  const activeColors = isDarkMode ? COLORS.dark : COLORS.light;
  
  // Selected Role Tab ('admin' | 'staff')
  const [selectedRole, setSelectedRole] = useState<'admin' | 'staff'>('admin');

  // Input fields state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Field focus states
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // API loading state
  const [loading, setLoading] = useState(false);

  // Authentication validation
  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      showAlert('Authentication Error', 'Please fill in all credential fields.');
      return;
    }

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    setLoading(true);

    try {
      // Connect to the remote ngrok backend API
      const response = await fetch('https://guidance-glorifier-mango.ngrok-free.dev/api/staff/', {
        method: 'GET',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json', 
        }
      });

      if (!response.ok) {
        throw new Error(`Server error: status code ${response.status}`);
      }

      const staffList = await response.json();
      
      if (Array.isArray(staffList)) {
        // Match user by mobile number or name (case-insensitive) and correct password
        const matchedUser = staffList.find(
          (s: any) => 
            (s.mobile_number === trimmedUser || s.name?.toLowerCase() === trimmedUser.toLowerCase()) &&
            s.password === trimmedPass
        );

        if (matchedUser) {
          const role = matchedUser.role === 'admin' ? 'admin' : 'staff';
          
          // Verify that their backend role matches the selected login portal
          if (role !== selectedRole) {
            showAlert(
              'Access Denied', 
              `This account has a '${role.toUpperCase()}' role. Please log in using the correct portal tab.`
            );
            setLoading(false);
            return;
          }

          onLoginSuccess(role, matchedUser.name || 'Anonymous', matchedUser.mobile_number || '');
          setLoading(false);
          return;
        }
      }

      // Local fallback for offline/development purposes if matching fetched users fails
      let localSuccess = false;
      if (selectedRole === 'admin') {
        if (trimmedUser.toLowerCase() === 'admin' && trimmedPass === 'admin123') {
          onLoginSuccess('admin', 'Admin User', '9876543210');
          localSuccess = true;
        }
      } else {
        if (trimmedUser.toLowerCase() === 'staff' && trimmedPass === 'staff123') {
          onLoginSuccess('staff', 'Staff Member', '9999999999');
          localSuccess = true;
        }
      }

      if (!localSuccess) {
        showAlert('Login Failed', 'Incorrect username, mobile number, or password.');
      }
    } catch (error: any) {
      console.warn('API connection failed. Trying local mock credentials.', error);
      
      // Fallback matching to keep application operational if local network is offline
      let localSuccess = false;
      if (selectedRole === 'admin') {
        if (trimmedUser.toLowerCase() === 'admin' && trimmedPass === 'admin123') {
          onLoginSuccess('admin', 'Admin User', '9876543210');
          localSuccess = true;
        }
      } else {
        if (trimmedUser.toLowerCase() === 'staff' && trimmedPass === 'staff123') {
          onLoginSuccess('staff', 'Staff Member', '9999999999');
          localSuccess = true;
        }
      }

      if (!localSuccess) {
        showAlert(
          'Access Alert', 
          'Backend service is unreachable and entered credentials do not match local offline files.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: activeColors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Brand Logo & Name */}
        <View style={styles.brandContainer}>
          <Image 
            source={require('../assets/logo.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
          <Text style={[styles.appName, { color: activeColors.primary }]}>Chit Funds</Text>
        </View>

        {/* Dynamic Glassmorphic Auth Box */}
        <Card style={[styles.authCard, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
          
          {/* Role Sliding Switcher */}
          <View style={[styles.roleSwitcherContainer, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
            <TouchableOpacity 
              style={[
                styles.roleTab, 
                selectedRole === 'admin' && [styles.activeRoleTab, { backgroundColor: activeColors.primary }]
              ]}
              onPress={() => {
                setSelectedRole('admin');
                setUsername('');
              }}
              disabled={loading}
              activeOpacity={0.9}
            >
              <Text 
                style={[
                  styles.roleTabText, 
                  { color: selectedRole === 'admin' ? '#FFFFFF' : activeColors.textSecondary }
                ]}
              >
                ADMIN
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.roleTab, 
                selectedRole === 'staff' && [styles.activeRoleTab, { backgroundColor: activeColors.primary }]
              ]}
              onPress={() => {
                setSelectedRole('staff');
                setUsername('');
              }}
              disabled={loading}
              activeOpacity={0.9}
            >
              <Text 
                style={[
                  styles.roleTabText, 
                  { color: selectedRole === 'staff' ? '#FFFFFF' : activeColors.textSecondary }
                ]}
              >
                STAFF
              </Text>
            </TouchableOpacity>
          </View>

          {/* Credentials Inputs */}
          <View style={styles.inputsWrapper}>
            <TextInput 
              label="Username or Mobile" 
              placeholder={selectedRole === 'admin' ? 'e.g. admin' : 'e.g. 9876543210'}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              editable={!loading}
              style={[
                isUsernameFocused && { borderColor: activeColors.primary }
              ]}
              onFocus={() => setIsUsernameFocused(true)}
              onBlur={() => setIsUsernameFocused(false)}
            />

            <TextInput 
              label="Password" 
              placeholder="••••••••" 
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              editable={!loading}
              style={[
                isPasswordFocused && { borderColor: activeColors.primary }
              ]}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
            />
          </View>

          {/* Submit Button */}
          <View style={{ position: 'relative' }}>
            <Button 
              title={loading ? 'Verifying...' : `Login as ${selectedRole.toUpperCase()}`}
              onPress={handleLogin}
              disabled={loading}
              style={styles.loginBtn}
            />
            {loading && (
              <ActivityIndicator 
                size="small" 
                color="#FFFFFF" 
                style={styles.btnLoader}
              />
            )}
          </View>
        </Card>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
    paddingTop: 60,
    paddingBottom: 40,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: SPACING.sm,
  },
  appName: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  authCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    ...SHADOWS.premium,
    marginBottom: SPACING.xl,
  },
  roleSwitcherContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
  },
  activeRoleTab: {
    ...SHADOWS.sm,
  },
  roleTabText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  inputsWrapper: {
    gap: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  loginBtn: {
    width: '100%',
  },
  btnLoader: {
    position: 'absolute',
    right: 20,
    top: 14,
  }
});
