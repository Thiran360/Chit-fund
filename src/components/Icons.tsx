import React from 'react';
import { View, StyleSheet } from 'react-native';

interface IconProps {
  color: string;
  size?: number;
}

// 🏛️ Groups Icon: Classic Columned Building
export const GroupsIcon: React.FC<IconProps> = ({ color, size = 20 }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Roof Pediment (Triangle) */}
      <View style={{
        width: size,
        height: 0,
        borderBottomWidth: size * 0.25,
        borderBottomColor: color,
        borderLeftWidth: size * 0.5,
        borderLeftColor: 'transparent',
        borderRightWidth: size * 0.5,
        borderRightColor: 'transparent',
      }} />
      {/* Architrave (Lintel bar) */}
      <View style={{ width: size * 0.9, height: size * 0.08, backgroundColor: color, marginTop: 1, borderRadius: 1 }} />
      {/* Columns */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-around', 
        width: size * 0.76, 
        height: size * 0.45, 
        marginVertical: 1 
      }}>
        <View style={{ width: size * 0.12, height: '100%', backgroundColor: color, borderRadius: 1 }} />
        <View style={{ width: size * 0.12, height: '100%', backgroundColor: color, borderRadius: 1 }} />
        <View style={{ width: size * 0.12, height: '100%', backgroundColor: color, borderRadius: 1 }} />
      </View>
      {/* Stylobate (Floor base) */}
      <View style={{ width: size, height: size * 0.12, backgroundColor: color, borderRadius: 1 }} />
    </View>
  );
};

// 👥 Subscribers Icon: Overlapping user silhouettes
export const SubscribersIcon: React.FC<IconProps> = ({ color, size = 20 }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background Person (Secondary User) */}
      <View style={{ 
        position: 'absolute', 
        left: size * 0.05, 
        bottom: size * 0.1, 
        alignItems: 'center', 
        opacity: 0.65 
      }}>
        {/* Head */}
        <View style={{ width: size * 0.35, height: size * 0.35, borderRadius: 999, backgroundColor: color }} />
        {/* Torso */}
        <View style={{ 
          width: size * 0.55, 
          height: size * 0.26, 
          borderTopLeftRadius: size * 0.15, 
          borderTopRightRadius: size * 0.15, 
          backgroundColor: color, 
          marginTop: 1 
        }} />
      </View>

      {/* Foreground Person (Primary User) */}
      <View style={{ 
        position: 'absolute', 
        right: size * 0.05, 
        bottom: 0, 
        alignItems: 'center' 
      }}>
        {/* Head */}
        <View style={{ 
          width: size * 0.42, 
          height: size * 0.42, 
          borderRadius: 999, 
          backgroundColor: color,
          borderWidth: size * 0.06,
          borderColor: '#FFFFFF'
        }} />
        {/* Torso */}
        <View style={{ 
          width: size * 0.68, 
          height: size * 0.32, 
          borderTopLeftRadius: size * 0.2, 
          borderTopRightRadius: size * 0.2, 
          backgroundColor: color,
          borderWidth: size * 0.06,
          borderColor: '#FFFFFF',
          marginTop: 0.5
        }} />
      </View>
    </View>
  );
};

// 📞 Phone Icon: Classic Tilted Receiver
export const PhoneIcon: React.FC<IconProps> = ({ color, size = 16 }) => {
  return (
    <View style={[styles.container, { width: size, height: size, justifyContent: 'center', alignItems: 'center' }]}>
      <View style={{
        width: size * 0.75,
        height: size * 0.75,
        borderRadius: size * 0.15,
        borderWidth: 2,
        borderColor: color,
        transform: [{ rotate: '45deg' }],
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 1,
      }}>
        {/* Ear Piece dot */}
        <View style={{ width: size * 0.15, height: size * 0.15, borderRadius: 999, backgroundColor: color }} />
        {/* Mouth Piece dot */}
        <View style={{ width: size * 0.15, height: size * 0.15, borderRadius: 999, backgroundColor: color }} />
      </View>
    </View>
  );
};

// ✉️ Email Icon: Closed Letter Envelope
export const EmailIcon: React.FC<IconProps> = ({ color, size = 16 }) => {
  return (
    <View style={[styles.container, { width: size, height: size, justifyContent: 'center', alignItems: 'center' }]}>
      <View style={{
        width: size * 0.85,
        height: size * 0.6,
        borderRadius: 2,
        borderWidth: 1.5,
        borderColor: color,
        position: 'relative',
        justifyContent: 'flex-start',
      }}>
        {/* Envelope Flap drawing */}
        <View style={{
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.36,
          borderLeftColor: 'transparent',
          borderRightWidth: size * 0.36,
          borderRightColor: 'transparent',
          borderTopWidth: size * 0.22,
          borderTopColor: color,
          alignSelf: 'center',
        }} />
      </View>
    </View>
  );
};

// 📍 Address/Location Icon: Sleek Pin
export const LocationIcon: React.FC<IconProps> = ({ color, size = 16 }) => {
  return (
    <View style={[styles.container, { width: size, height: size, alignItems: 'center', justifyContent: 'flex-start' }]}>
      {/* Head & Center Pin Hole */}
      <View style={{
        width: size * 0.75,
        height: size * 0.75,
        borderRadius: 999,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <View style={{ width: size * 0.25, height: size * 0.25, borderRadius: 999, backgroundColor: '#FFFFFF' }} />
      </View>
      {/* Down Point */}
      <View style={{
        width: 0,
        height: 0,
        borderLeftWidth: size * 0.22,
        borderLeftColor: 'transparent',
        borderRightWidth: size * 0.22,
        borderRightColor: 'transparent',
        borderTopWidth: size * 0.32,
        borderTopColor: color,
        marginTop: -2,
      }} />
    </View>
  );
};

// 💰 Money / Cash / Collection Icon: Stack of Coins
export const MoneyIcon: React.FC<IconProps> = ({ color, size = 18 }) => {
  return (
    <View style={[styles.container, { width: size, height: size, justifyContent: 'center', alignItems: 'center' }]}>
      <View style={{ gap: 2 }}>
        {/* Top Coin */}
        <View style={{ width: size * 0.8, height: size * 0.18, borderRadius: 999, borderWidth: 1.5, borderColor: color, backgroundColor: '#FFFFFF' }} />
        {/* Middle Coin */}
        <View style={{ width: size * 0.8, height: size * 0.18, borderRadius: 999, borderWidth: 1.5, borderColor: color, backgroundColor: '#FFFFFF' }} />
        {/* Bottom Coin */}
        <View style={{ width: size * 0.8, height: size * 0.18, borderRadius: 999, borderWidth: 1.5, borderColor: color, backgroundColor: '#FFFFFF' }} />
      </View>
    </View>
  );
};

// Chevron Arrow right (→)
export const ChevronRightIcon: React.FC<IconProps> = ({ color, size = 14 }) => {
  return (
    <View style={[styles.container, { width: size, height: size, justifyContent: 'center', alignItems: 'center' }]}>
      <View style={{
        width: size * 0.5,
        height: size * 0.5,
        borderTopWidth: 2,
        borderRightWidth: 2,
        borderColor: color,
        transform: [{ rotate: '45deg' }],
      }} />
    </View>
  );
};

// Chevron Arrow left (←)
export const ChevronLeftIcon: React.FC<IconProps> = ({ color, size = 14 }) => {
  return (
    <View style={[styles.container, { width: size, height: size, justifyContent: 'center', alignItems: 'center' }]}>
      <View style={{
        width: size * 0.5,
        height: size * 0.5,
        borderBottomWidth: 2,
        borderLeftWidth: 2,
        borderColor: color,
        transform: [{ rotate: '45deg' }],
      }} />
    </View>
  );
};

// 🚪 Logout Icon: Classic bracket with arrow pointing right
export const LogoutIcon: React.FC<IconProps> = ({ color, size = 20 }) => {
  return (
    <View style={[styles.container, { width: size, height: size, justifyContent: 'center', alignItems: 'center' }]}>
      {/* Outer bracket/frame */}
      <View style={{
        position: 'absolute',
        width: size * 0.65,
        height: size * 0.85,
        borderWidth: 2,
        borderColor: color,
        borderRightWidth: 0,
        borderRadius: 2,
        left: size * 0.05,
      }} />
      {/* Arrow shaft */}
      <View style={{
        position: 'absolute',
        width: size * 0.55,
        height: 2,
        backgroundColor: color,
        right: size * 0.15,
      }} />
      {/* Arrow head */}
      <View style={{
        position: 'absolute',
        width: size * 0.22,
        height: size * 0.22,
        borderTopWidth: 2,
        borderRightWidth: 2,
        borderColor: color,
        transform: [{ rotate: '45deg' }],
        right: size * 0.12,
      }} />
    </View>
  );
};

// 👤 Profile Icon: Single user silhouette
export const ProfileIcon: React.FC<IconProps> = ({ color, size = 20 }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Head */}
      <View style={{ 
        width: size * 0.42, 
        height: size * 0.42, 
        borderRadius: 999, 
        backgroundColor: color 
      }} />
      {/* Torso */}
      <View style={{ 
        width: size * 0.72, 
        height: size * 0.32, 
        borderTopLeftRadius: size * 0.18, 
        borderTopRightRadius: size * 0.18, 
        backgroundColor: color, 
        marginTop: 1.5 
      }} />
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// ☰ Menu Icon (Hamburger lines)
export const MenuIcon: React.FC<IconProps> = ({ color, size = 20 }) => {
  return (
    <View style={[styles.container, { width: size, height: size, justifyContent: 'space-evenly', alignItems: 'center' }]}>
      <View style={{ width: size * 0.8, height: 2.5, backgroundColor: color, borderRadius: 2 }} />
      <View style={{ width: size * 0.8, height: 2.5, backgroundColor: color, borderRadius: 2 }} />
      <View style={{ width: size * 0.8, height: 2.5, backgroundColor: color, borderRadius: 2 }} />
    </View>
  );
};
