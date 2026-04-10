import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = Layout.radius.sm,
  style,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: Colors.shimmer,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const TransactionSkeleton: React.FC = () => (
  <View style={skeletonStyles.transaction}>
    <Skeleton width={44} height={44} borderRadius={22} />
    <View style={skeletonStyles.transactionContent}>
      <Skeleton width="60%" height={16} />
      <Skeleton width="40%" height={12} style={{ marginTop: 8 }} />
    </View>
    <Skeleton width={80} height={16} />
  </View>
);

const skeletonStyles = StyleSheet.create({
  transaction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  transactionContent: {
    flex: 1,
  },
});
