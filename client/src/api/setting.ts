import { apiClient } from './client';
import type { Settings } from './types';

export const settingApi = {
  getSettings: async () => {
    return await apiClient.get<Settings>('/settings');
  },

  updateSettings: async (settings: Settings) => {
    return await apiClient.post<Settings>('/settings', settings);
  }
};