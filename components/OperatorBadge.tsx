import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Layout } from '../constants/Layout';

interface OperatorBadgeProps {
  operator: 'airtel' | 'moov' | null;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export const OperatorBadge: React.FC<OperatorBadgeProps> = ({
  operator,
  size = 'medium',
  showLabel = true,
}) => {
  if (!operator) return null;

  const config = {
    airtel: {
      color: Colors.airtel,
      bgColor: Colors.airtel + '15',
      label: 'Airtel',
      icon: '📱',
    },
    moov: {
      color: Colors.moov,
      bgColor: Colors.moov + '15',
      label: 'Moov Africa',
      icon: '📱',
    },
  };

  const c = config[operator];
  const sizeMap = { small: 24, medium: 32, large: 44 };
  const iconSize = sizeMap[size];
  const fontSize = size === 'small' ? 10 : size === 'medium' ? 12 : 14;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.badge,
          {
            width: iconSize,
            height: iconSize,
            borderRadius: iconSize / 2,
            backgroundColor: c.bgColor,
            borderColor: c.color + '30',
          },
        ]}
      >
        <Text style={{ fontSize: iconSize * 0.5 }}>{c.icon}</Text>
      </View>
      {showLabel && (
        <Text
          style={[styles.label, { color: c.color, fontSize }]}
        >
          {c.label}
        </Text>
      )}
    </View>
  );
};

interface OperatorSelectorProps {
  selected: 'airtel' | 'moov' | null;
  onSelect: (op: 'airtel' | 'moov') => void;
}

export const OperatorSelector: React.FC<OperatorSelectorProps> = ({
  selected,
  onSelect,
}) => {
  return (
    <View style={styles.selectorContainer}>
      {(['airtel', 'moov'] as const).map((op) => {
        const isSelected = selected === op;
        const color = op === 'airtel' ? Colors.airtel : Colors.moov;
        const label = op === 'airtel' ? 'Airtel Money' : 'Moov Money';

        return (
          <View
            key={op}
            style={[
              styles.selectorOption,
              {
                borderColor: isSelected ? color : Colors.border,
                backgroundColor: isSelected ? color + '10' : Colors.surface,
              },
            ]}
          >
            <View
              style={[
                styles.selectorRadio,
                {
                  borderColor: isSelected ? color : Colors.textTertiary,
                },
              ]}
            >
              {isSelected && (
                <View
                  style={[styles.selectorRadioInner, { backgroundColor: color }]}
                />
              )}
            </View>
            <Text
              style={[
                styles.selectorLabel,
                { color: isSelected ? color : Colors.textPrimary },
              ]}
              onPress={() => onSelect(op)}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  label: {
    ...Typography.captionMedium,
  },
  selectorContainer: {
    gap: 10,
  },
  selectorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.padding.md,
    borderRadius: Layout.radius.md,
    borderWidth: 1.5,
    gap: 12,
  },
  selectorRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  selectorLabel: {
    ...Typography.bodyMedium,
  },
});
