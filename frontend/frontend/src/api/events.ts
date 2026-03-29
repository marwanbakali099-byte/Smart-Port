import { apiClient, USE_MOCK, simulateDelay } from './client';
import { mockEventsData } from '../mock';
import type { PortEvent } from '../types/models';

export async function getEvents(): Promise<PortEvent[]> {
  if (USE_MOCK) {
    return simulateDelay(mockEventsData);
  }
  const { data } = await apiClient.get<PortEvent[]>('/events/');
  return data;
}
