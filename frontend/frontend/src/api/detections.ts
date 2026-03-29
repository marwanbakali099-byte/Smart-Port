import { apiClient, USE_MOCK, simulateDelay } from './client';
import type { DetectionCollection } from '../types/models';
import { mockDetections } from '../mock';

export async function getDetections(): Promise<DetectionCollection> {
  if (USE_MOCK) {
    return simulateDelay(mockDetections);
  }
  const { data } = await apiClient.get<DetectionCollection>('/detections/');
  return data;
}

export async function createDetection(detection: {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: {
    source: string;
    timestamp: string;
    mmsi: string;
    speed: number;
    ship_type?: number;
  };
}) {
  if (USE_MOCK) {
    return simulateDelay(detection, 300); // just simulated success
  }
  const { data } = await apiClient.post('/detections/', detection);
  return data;
}
