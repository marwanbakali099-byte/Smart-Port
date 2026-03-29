import { apiClient, USE_MOCK, simulateDelay } from './client';
import type {
  PortAnalyticsResponse,
  BoatETAResponse,
  PortStatusResponse,
  PortCongestionIAResponse,
} from '../types/models';
import { mockPortAnalytics, mockETA, mockPortStatus, mockCongestionIA } from '../mock';

export async function getPortAnalytics(portId: number): Promise<PortAnalyticsResponse> {
  if (USE_MOCK) return simulateDelay(mockPortAnalytics(portId));
  const { data } = await apiClient.get<PortAnalyticsResponse>(`/analytics/${portId}/`);
  return data;
}

export async function getBoatETA(mmsi: string): Promise<BoatETAResponse> {
  if (USE_MOCK) return simulateDelay(mockETA(mmsi));
  const { data } = await apiClient.get<BoatETAResponse>(`/eta/${mmsi}/`);
  return data;
}

export async function getPortStatus(portId: number): Promise<PortStatusResponse> {
  if (USE_MOCK) return simulateDelay(mockPortStatus(portId));
  const { data } = await apiClient.get<PortStatusResponse>(`/port/status/${portId}/`);
  return data;
}

export async function getPortCongestionIA(portId: number): Promise<PortCongestionIAResponse> {
  if (USE_MOCK) return simulateDelay(mockCongestionIA(portId));
  const { data } = await apiClient.get<PortCongestionIAResponse>(`/analytics/congestion/${portId}/`);
  return data;
}
