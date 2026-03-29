import { apiClient, USE_MOCK, simulateDelay } from './client';
import { mockDetections } from '../mock';
import type { DetectionFeature, SatelliteDetectResponse } from '../types/models';

/**
 * GET /api/detections/?source=satellite
 * Returns a list of satellite-sourced DetectionFeatures for the Satellite page gallery.
 */
export async function getSatelliteDetections(): Promise<DetectionFeature[]> {
  if (USE_MOCK) {
    const satelliteFeats = mockDetections.features
      .filter((f) => f.properties.source === 'satellite')
      .slice(0, 10);
    return simulateDelay(satelliteFeats);
  }

  const { data } = await apiClient.get<{ type: string; features: DetectionFeature[] }>(
    '/detections/?source=satellite'
  );
  return data.features ?? [];
}

/**
 * POST /api/satellite/detect/
 * Runs Roboflow vessel detection on a Mapbox satellite tile for the given coordinates.
 */
export async function runSatelliteDetect(lat: number, lon: number): Promise<SatelliteDetectResponse> {
  if (USE_MOCK) {
    return simulateDelay<SatelliteDetectResponse>({
      source: 'Mock',
      count: 2,
      detections: [
        { xmin: 100, ymin: 200, xmax: 150, ymax: 240, conf: 0.85 },
        { xmin: 400, ymin: 300, xmax: 450, ymax: 340, conf: 0.62 },
      ],
      image_url: '',
      coordinates: { lat, lon },
    });
  }

  const { data } = await apiClient.post<SatelliteDetectResponse>('/satellite/detect/', { lat, lon });
  return data;
}
