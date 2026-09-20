
import { loadDB } from './db';
import { User } from './types';

const KEY = 'orison_session';

export function getSessionUser(): User | null {
  if (typeof window === 'undefined') return null;
  const id = window.localStorage.getItem(KEY);
  if (!id) return null;
  return loadDB().users.find(u => u.id === id) || null;
}

export function setSessionUser(id: string | null): void {
  if (typeof window === 'undefined') return;
  if (id) window.localStorage.setItem(KEY, id);
  else window.localStorage.removeItem(KEY);
}

export function authenticate(name: string, pin: string): User | null {
  return loadDB().users.find(u => u.name.toLowerCase() === name.toLowerCase() && u.pin === pin) || null;
}
