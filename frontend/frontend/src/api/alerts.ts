import { apiClient, USE_MOCK, simulateDelay } from './client';
import { mockAlerts } from '../mock';
import type { Alert } from '../types/models';

export async function getAlerts(): Promise<Alert[]> {
  if (USE_MOCK) {
    return simulateDelay(mockAlerts);
  }
  const { data } = await apiClient.get<Alert[]>('/detections/alerts/');
  return data;
}
