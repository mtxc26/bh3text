import { db } from '@/data';
import type { SettingsKey, SettingsValueTypes } from './settings';
import { SETTINGS_DEFAULTS } from './settings';

export async function getSettings<K extends SettingsKey>(key: K): Promise<SettingsValueTypes[K]> {
    const value = await db.get('config', key);
    return ((value == null) ? SETTINGS_DEFAULTS[key] : value) as SettingsValueTypes[K];
}

export async function putSettings<K extends SettingsKey>(key: K, value: SettingsValueTypes[K]): Promise<void> {
    await db.put('config', value, key);
}
