import { getRandomBytes } from 'expo-crypto';

const TOKEN_BYTES = 32;

export function createToken(): string {
  return Array.from(getRandomBytes(TOKEN_BYTES), byte => byte.toString(16).padStart(2, '0')).join(
    '',
  );
}
