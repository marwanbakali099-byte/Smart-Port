import { apiClient, USE_MOCK, simulateDelay } from './client';
import { mockVessels } from '../mock';
import type { Boat } from '../types/models';

export async function getVessels(): Promise<Boat[]> {
  if (USE_MOCK) {
    return simulateDelay(mockVessels);
  }
  // No direct backend endpoint exists for this currently,
  // typically derived from detections or a future /bateaux/ api
  const { data } = await apiClient.get<Boat[]>('/bateaux/');
  return data;
}

export async function getVesselByMmsi(mmsi: string): Promise<Boat | undefined> {
  if (USE_MOCK) {
    return simulateDelay(mockVessels.find((v) => v.mmsi === mmsi));
  }
  const { data } = await apiClient.get<Boat>(`/bateaux/${mmsi}/`);
  return data;
}
