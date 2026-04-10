import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../constants/Colors';
import { Layout, Shadows } from '../constants/Layout';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'flat' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'elevated',
  padding = 'medium',
}) => {
  const getPadding = () => {
    switch (padding) {
      case 'none': return 0;
      case 'small': return Layout.padding.sm;
      case 'medium': return Layout.padding.md;
      case 'large': return Layout.padding.lg;
    }
  };

  return (
    <View
      style={[
        styles.base,
        { padding: getPadding() },
        variant === 'elevated' && styles.elevated,
        variant === 'outlined' && styles.outlined,
        variant === 'flat' && styles.flat,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Layout.radius.lg,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  elevated: {
    ...Shadows.md,
  },
  outlined: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  flat: {
    backgroundColor: Colors.background,
  },
});
