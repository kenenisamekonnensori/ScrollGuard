/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('react-native-mmkv', () => {
  class MMKVStorage {
    private store = new Map<string, string>();

    set(key: string, value: string | number | boolean): void {
      this.store.set(key, String(value));
    }

    getString(key: string): string | undefined {
      return this.store.get(key);
    }

    getNumber(key: string): number | undefined {
      const value = this.store.get(key);
      if (value === undefined || Number.isNaN(Number(value))) {
        return undefined;
      }

      return Number(value);
    }

    getBoolean(key: string): boolean | undefined {
      const value = this.store.get(key);
      if (value === undefined) {
        return undefined;
      }

      if (value === 'true') {
        return true;
      }

      if (value === 'false') {
        return false;
      }

      return undefined;
    }

    contains(key: string): boolean {
      return this.store.has(key);
    }

    remove(key: string): void {
      this.store.delete(key);
    }
  }

  return {
    createMMKV: () => new MMKVStorage(),
  };
});

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
