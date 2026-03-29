import { apiClient } from './client';
import type { VideoStatsResponse } from '../types/models';

/**
 * GET /api/video/stats/
 * Returns speed/confidence stats from the live CCTV detection pipeline.
 */
export async function getVideoStats(): Promise<VideoStatsResponse> {
  const { data } = await apiClient.get<VideoStatsResponse>('/video/stats/');
  return data;
}

/**
 * Returns the URL for the MJPEG video stream.
 * Used directly as <img src={...} /> for live feed display.
 */
export function getVideoStreamUrl(): string {
  return '/api/video/stream/';
}
