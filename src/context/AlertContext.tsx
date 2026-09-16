import React, { createContext, useContext, useState } from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { Card, Button } from '../components/UI';
import { useFunds } from './FundsContext';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../utils/theme';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertContextProps {
  showAlert: (title: string, message: string, buttons?: AlertButton[]) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextProps | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDarkMode } = useFunds();
  const activeColors = isDarkMode ? COLORS.dark : COLORS.light;

  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [buttons, setButtons] = useState<AlertButton[]>([]);

  const showAlert = (alertTitle: string, alertMessage: string, alertButtons?: AlertButton[]) => {
    setTitle(alertTitle);
    setMessage(alertMessage);
    
    if (alertButtons && alertButtons.length > 0) {
      setButtons(alertButtons);
    } else {
      // Default to a single "OK" button if none provided
      setButtons([{ text: 'OK', style: 'default' }]);
    }
    
    setVisible(true);
  };

  const hideAlert = () => {
    setVisible(false);
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={hideAlert}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <Card
            style={[
              styles.modalContent,
              {
                backgroundColor: activeColors.surface,
                borderColor: activeColors.border,
                padding: SPACING.lg,
              },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: activeColors.text, fontSize: 18, marginBottom: SPACING.sm }
              ]}
            >
              {title}
            </Text>
            
            <Text
              style={[
                styles.modalMessage,
                { color: activeColors.textSecondary }
              ]}
            >
              {message}
            </Text>
            
            <View style={[
              styles.buttonRow,
              { gap: SPACING.sm }
            ]}>
              {buttons.map((btn, idx) => {
                const isDestructive = btn.style === 'destructive';
                const isCancel = btn.style === 'cancel';
                
                return (
                  <Button
                    key={idx}
                    title={btn.text}
                    onPress={() => {
                      hideAlert();
                      if (btn.onPress) btn.onPress();
                    }}
                    variant={isDestructive ? 'danger' : isCancel ? 'outline' : 'primary'}
                    style={{
                      flex: buttons.length > 1 ? 1 : 0,
                      minWidth: buttons.length === 1 ? 120 : undefined,
                      borderColor: isCancel ? activeColors.border : undefined,
                      height: 38,
                    }}
                    textStyle={{
                      fontSize: 12,
                      color: isCancel ? activeColors.textSecondary : '#FFFFFF',
                    }}
                  />
                );
              })}
            </View>
          </Card>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...SHADOWS.premium,
    borderWidth: 1.5,
  },
  modalTitle: {
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  modalMessage: {
    fontSize: TYPOGRAPHY.size.xs,
    lineHeight: 18,
    marginBottom: SPACING.lg,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
});
