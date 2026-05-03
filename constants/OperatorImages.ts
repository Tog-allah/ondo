import { ImageSourcePropType } from 'react-native';

export const OperatorImages: Record<string, { logo: ImageSourcePropType; money: ImageSourcePropType }> = {
  airtel: {
    logo: require('../assets/operators/airtel.png'),
    money: require('../assets/operators/airtel-money.png'),
  },
  moov: {
    logo: require('../assets/operators/moov-africa.png'),
    money: require('../assets/operators/moov-money.png'),
  },
};
