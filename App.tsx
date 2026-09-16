/**
 * ChitFunds Admin Orchestrator App
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import { StatusBar, StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { FundsProvider, useFunds } from './src/context/FundsContext';
import { AlertProvider } from './src/context/AlertContext';
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING } from './src/utils/theme';

// Screens
import { GroupsScreen } from './src/screens/GroupsScreen';
import { MembersScreen } from './src/screens/MembersScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { FundCalculationsScreen } from './src/screens/FundCalculationsScreen';
import { MenuScreen } from './src/screens/MenuScreen';
import { ComingSoonScreen } from './src/screens/ComingSoonScreen';
import { TransactionsScreen } from './src/screens/TransactionsScreen';
import { AccountingScreen } from './src/screens/AccountingScreen';

// Custom Visual Vector Icons
import { GroupsIcon, SubscribersIcon, ProfileIcon, LogoutIcon, MoneyIcon, MenuIcon } from './src/components/Icons';

type ScreenName = 'Groups' | 'Members' | 'Calculations' | 'Profile' | 'Menu' | 'Transactions' | 'Arrears' | 'Accounting' | 'Collections' | 'Subscribers' | 'SpecialFeatures';

function App() {
  return (
    <SafeAreaProvider>
      <FundsProvider>
        <AlertProvider>
          <AppContent />
        </AlertProvider>
      </FundsProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const { isDarkMode } = useFunds();
  const safeAreaInsets = useSafeAreaInsets();
  const activeColors = isDarkMode ? COLORS.dark : COLORS.light;

  // Global Auth Session State & Loading State
  const [userRole, setUserRole] = useState<'admin' | 'staff' | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userMobile, setUserMobile] = useState<string>('');
  const [sessionLoading, setSessionLoading] = useState(true);
  const [calcGroupId, setCalcGroupId] = useState<string | null>(null);

  // Custom Navigation Router State
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('Groups');

  // Load session from AsyncStorage on app mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedSession = await AsyncStorage.getItem('user_session');
        if (savedSession) {
          const { role, name, mobile } = JSON.parse(savedSession);
          if (role === 'admin' || role === 'staff') {
            setUserRole(role);
            setUserName(name || '');
            setUserMobile(mobile || '');
          }
        }
      } catch (e) {
        console.error('Failed to load session from storage', e);
      } finally {
        setSessionLoading(false);
      }
    };
    loadSession();
  }, []);

  // Save session when logged in successfully
  const handleLoginSuccess = async (role: 'admin' | 'staff', name: string, mobile: string) => {
    setUserRole(role);
    setUserName(name);
    setUserMobile(mobile);
    try {
      await AsyncStorage.setItem('user_session', JSON.stringify({ role, name, mobile }));
    } catch (e) {
      console.error('Failed to save session to storage', e);
    }
  };

  // Remove session when logging out
  const handleLogout = async () => {
    setUserRole(null);
    setUserName('');
    setUserMobile('');
    try {
      await AsyncStorage.removeItem('user_session');
    } catch (e) {
      console.error('Failed to remove session from storage', e);
    }
  };

  // Synchronize and update profile details dynamically
  const handleProfileSync = async (name: string, mobile: string) => {
    setUserName(name);
    setUserMobile(mobile);
    try {
      const savedSession = await AsyncStorage.getItem('user_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        await AsyncStorage.setItem('user_session', JSON.stringify({
          ...parsed,
          name,
          mobile
        }));
      }
    } catch (e) {
      console.error('Failed to sync session to storage', e);
    }
  };

  // Render active screen with active role permissions passed down
  const renderScreen = () => {
    switch (currentScreen) {
      case 'Groups':
        return <GroupsScreen userRole={userRole || 'staff'} onNavigateToCalculations={(groupId) => { setCalcGroupId(groupId); setCurrentScreen('Calculations'); }} />;
      case 'Members':
        return <MembersScreen userRole={userRole || 'staff'} onLogout={handleLogout} />;
      case 'Calculations':
        return <FundCalculationsScreen initialGroupId={calcGroupId} onBack={() => { setCalcGroupId(null); setCurrentScreen('Groups'); }} />;
      case 'Profile':
        return (
          <ProfileScreen 
            userRole={userRole || 'staff'} 
            userName={userName}
            userMobile={userMobile}
            onLogout={handleLogout}
            onProfileSync={handleProfileSync}
          />
        );
      case 'Menu':
        return <MenuScreen userRole={userRole || 'staff'} onNavigateToScreen={(s) => setCurrentScreen(s as ScreenName)} />;
      case 'Transactions':
        return <TransactionsScreen onBack={() => setCurrentScreen('Menu')} />;
      case 'Arrears':
        return <ComingSoonScreen title="Arrear Reports" onBack={() => setCurrentScreen('Menu')} />;
      case 'Accounting':
        return <AccountingScreen onBack={() => setCurrentScreen('Menu')} />;
      case 'Collections':
        return <ComingSoonScreen title="Daily Collections" onBack={() => setCurrentScreen('Menu')} />;
      case 'Subscribers':
        return <ComingSoonScreen title="Subscribers & Guarantors" onBack={() => setCurrentScreen('Menu')} />;
      case 'SpecialFeatures':
        return <ComingSoonScreen title="Special Features" onBack={() => setCurrentScreen('Menu')} />;
      default:
        return <GroupsScreen userRole={userRole || 'staff'} onNavigateToCalculations={(groupId) => { setCalcGroupId(groupId); setCurrentScreen('Calculations'); }} />;
    }
  };

  const tabs: { name: ScreenName; label: string }[] = [
    { name: 'Groups', label: 'Groups' },
    { name: 'Members', label: 'Members' },
    { name: 'Calculations', label: 'Fund Calc' },
    { name: 'Profile', label: 'Profile' },
    { name: 'Menu', label: 'More' },
  ];

  // While checking the AsyncStorage session, render a premium loading splash screen to prevent flashing
  if (sessionLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: activeColors.background, justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
          backgroundColor={activeColors.background}
        />
        <Image 
          source={require('./src/assets/logo.png')} 
          style={{ width: 80, height: 80 }} 
          resizeMode="contain"
        />
      </View>
    );
  }

  // If user is not authenticated, load our gorgeous custom Login screen gateway
  if (userRole === null) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
          backgroundColor={activeColors.background}
        />
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: activeColors.background }]}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={activeColors.surface}
      />
      
      {/* Top Header Bar */}
      <View 
        style={[
          styles.topHeader, 
          { 
            backgroundColor: activeColors.surface, 
            borderBottomColor: activeColors.border,
            paddingTop: safeAreaInsets.top + SPACING.sm,
          }
        ]}
      >
        <View style={[styles.headerTitleRow, { justifyContent: 'space-between', width: '100%' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image 
              source={require('./src/assets/logo.png')} 
              style={styles.topLogo} 
              resizeMode="contain"
            />
            <Text style={[styles.topHeaderTitle, { color: activeColors.primary }]}>Chit Funds</Text>
          </View>

          {/* User Session Badge & Logout Button */}
          <View style={styles.sessionContainer}>
            <View 
              style={[
                styles.roleBadge, 
                { 
                  backgroundColor: userRole === 'admin' ? activeColors.primaryLight : (isDarkMode ? '#2D2010' : '#FFFBEB'),
                  borderColor: userRole === 'admin' ? activeColors.primary + '30' : '#F59E0B40'
                }
              ]}
            >
              <Text 
                style={[
                  styles.roleBadgeText, 
                  { 
                    color: userRole === 'admin' ? activeColors.primary : (isDarkMode ? '#FBBF24' : '#B45309') 
                  }
                ]}
              >
                {userRole === 'admin' ? 'ADMIN' : 'STAFF'}
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.logoutBtn, { borderColor: activeColors.border, backgroundColor: activeColors.background }]} 
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <LogoutIcon color={activeColors.textSecondary} size={18} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Screen Area */}
      <View style={styles.screenArea}>
        {renderScreen()}
      </View>

      {/* Floating Glassmorphism Tab Bar with Safe Area Bottom Padding */}
      <View 
        style={[
          styles.tabBar, 
          { 
            backgroundColor: activeColors.glass, 
            borderColor: activeColors.border,
            paddingBottom: Math.max(safeAreaInsets.bottom, SPACING.sm),
          }
        ]}
      >
        {tabs.map((tab) => {
          const isActive = currentScreen === tab.name;
          const iconColor = isActive ? activeColors.primary : activeColors.textSecondary;
          
          return (
            <TouchableOpacity
              key={tab.name}
              style={[
                styles.tabItem,
                isActive && [styles.activeTabItem, { backgroundColor: activeColors.primaryLight }]
              ]}
              onPress={() => setCurrentScreen(tab.name)}
              activeOpacity={0.85}
            >
              <View style={{ marginBottom: 4 }}>
                {tab.name === 'Groups' ? (
                  <GroupsIcon color={iconColor} size={24} />
                ) : tab.name === 'Members' ? (
                  <SubscribersIcon color={iconColor} size={24} />
                ) : tab.name === 'Calculations' ? (
                  <MoneyIcon color={iconColor} size={24} />
                ) : tab.name === 'Menu' ? (
                  <MenuIcon color={iconColor} size={24} />
                ) : (
                  <ProfileIcon color={iconColor} size={24} />
                )}
              </View>
              <Text 
                style={[
                  styles.tabLabel, 
                  { color: iconColor }
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topLogo: {
    width: 64,
    height: 64,
    marginRight: SPACING.sm,
  },
  topHeaderTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  screenArea: {
    flex: 1,
  },
  sessionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  roleBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  logoutBtn: {
    padding: 6,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: SPACING.sm,
    ...SHADOWS.lg,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 72,
  },
  activeTabItem: {
    transform: [{ scale: 1.05 }],
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 4,
  },
});

export default App;
