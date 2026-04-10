import { Stack } from 'expo-router';

export default function TransactionLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="buy-credit" />
      <Stack.Screen name="buy-bundle" />
      <Stack.Screen name="transfer" />
      <Stack.Screen name="confirm" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="success" options={{ animation: 'fade' }} />
    </Stack>
  );
}
