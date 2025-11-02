import { createContext, useContext, useState, ReactNode } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react-native';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [opacity] = useState(new Animated.Value(0));

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });

    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  };

  const getToastConfig = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          iconColor: '#10B981',
          bgColor: 'rgba(16, 185, 129, 0.15)',
          borderColor: '#10B981',
          textColor: '#10B981',
        };
      case 'error':
        return {
          icon: XCircle,
          iconColor: '#EF4444',
          bgColor: 'rgba(239, 68, 68, 0.15)',
          borderColor: '#EF4444',
          textColor: '#EF4444',
        };
      case 'warning':
        return {
          icon: AlertCircle,
          iconColor: '#F59E0B',
          bgColor: 'rgba(245, 158, 11, 0.15)',
          borderColor: '#F59E0B',
          textColor: '#F59E0B',
        };
      case 'info':
        return {
          icon: Info,
          iconColor: '#3B82F6',
          bgColor: 'rgba(59, 130, 246, 0.15)',
          borderColor: '#3B82F6',
          textColor: '#3B82F6',
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              opacity,
              backgroundColor: getToastConfig(toast.type).bgColor,
              borderColor: getToastConfig(toast.type).borderColor,
            },
          ]}
        >
          <View style={styles.toastContent}>
            {(() => {
              const Icon = getToastConfig(toast.type).icon;
              return <Icon size={20} color={getToastConfig(toast.type).iconColor} />;
            })()}
            <Text style={[styles.toastMessage, { color: getToastConfig(toast.type).textColor }]}>
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 9999,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toastMessage: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
});
