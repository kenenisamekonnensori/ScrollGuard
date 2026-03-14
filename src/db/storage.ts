import { createMMKV } from 'react-native-mmkv';

const JSON_PREFIX = '__MMKV_JSON__:';

/**
 * Shared MMKV storage instance used across the app.
 */
export const storage = createMMKV({
  id: 'scrollguard-shared-storage',
});

/**
 * Reads a value by key with type-safe generics.
 * Supports booleans, numbers, strings, and JSON-serialized objects.
 */
export function getValue<T>(key: string): T | undefined {
  if (!storage.contains(key)) {
    return undefined;
  }

  const booleanValue = storage.getBoolean(key);
  if (booleanValue !== undefined) {
    return booleanValue as T;
  }

  const numberValue = storage.getNumber(key);
  if (numberValue !== undefined) {
    return numberValue as T;
  }

  const stringValue = storage.getString(key);
  if (stringValue === undefined) {
    return undefined;
  }

  if (stringValue.startsWith(JSON_PREFIX)) {
    const jsonValue = stringValue.slice(JSON_PREFIX.length);

    try {
      return JSON.parse(jsonValue) as T;
    } catch {
      return undefined;
    }
  }

  return stringValue as T;
}

/**
 * Persists a value by key with type-safe generics.
 * Writes primitives natively and serializes objects as JSON.
 */
export function setValue<T>(key: string, value: T): void {
  if (value === undefined) {
    storage.remove(key);
    return;
  }

  if (
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'string'
  ) {
    storage.set(key, value);
    return;
  }

  try {
    storage.set(key, `${JSON_PREFIX}${JSON.stringify(value)}`);
  } catch {
    storage.remove(key);
  }
}

/**
 * Removes a stored value by key.
 */
export function deleteValue(key: string): void {
  storage.remove(key);
}
