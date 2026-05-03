import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  color: string;
}

interface ParticleCelebrationProps {
  trigger: boolean;
  onComplete?: () => void;
}

const { width, height } = Dimensions.get('window');
const PARTICLE_COUNT = 30;
const COLORS = [Colors.accentBright, Colors.primary, Colors.accent, Colors.accentLight];

export const ParticleCelebration: React.FC<ParticleCelebrationProps> = ({
  trigger,
  onComplete,
}) => {
  const particlesRef = useRef<Particle[]>([]);

  // Initialiser les particules
  if (particlesRef.current.length === 0) {
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      x: new Animated.Value(width / 2),
      y: new Animated.Value(height / 2),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));
  }

  useEffect(() => {
    if (trigger) {
      // Animation de célébration
      const animations = particlesRef.current.map((particle) => {
        const angle = (Math.PI * 2 * particle.id) / PARTICLE_COUNT;
        const distance = 100 + Math.random() * 150;
        const targetX = width / 2 + Math.cos(angle) * distance;
        const targetY = height / 2 + Math.sin(angle) * distance;

        return Animated.parallel([
          // Position
          Animated.timing(particle.x, {
            toValue: targetX,
            duration: 1500 + Math.random() * 500,
            useNativeDriver: true,
          }),
          Animated.timing(particle.y, {
            toValue: targetY,
            duration: 1500 + Math.random() * 500,
            useNativeDriver: true,
          }),
          // Apparition puis disparition
          Animated.sequence([
            Animated.timing(particle.opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: 1000,
              delay: 500,
              useNativeDriver: true,
            }),
          ]),
          // Scale
          Animated.sequence([
            Animated.spring(particle.scale, {
              toValue: 1,
              tension: 50,
              friction: 7,
              useNativeDriver: true,
            }),
            Animated.timing(particle.scale, {
              toValue: 0,
              duration: 500,
              delay: 1000,
              useNativeDriver: true,
            }),
          ]),
        ]);
      });

      Animated.parallel(animations).start(() => {
        // Reset
        particlesRef.current.forEach((particle) => {
          particle.x.setValue(width / 2);
          particle.y.setValue(height / 2);
          particle.opacity.setValue(0);
          particle.scale.setValue(0);
        });
        onComplete?.();
      });
    }
  }, [trigger, onComplete]);

  return (
    <View style={styles.container} pointerEvents="none">
      {particlesRef.current.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              backgroundColor: particle.color,
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
              ],
              opacity: particle.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    left: -4,
    top: -4,
  },
});
