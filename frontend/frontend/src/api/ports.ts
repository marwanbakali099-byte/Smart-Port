import { KNOWN_PORTS } from '../types/models';
import type { PortInfo } from '../types/models';

/**
 * The Django backend has no /api/ports/ list endpoint.
 * We use KNOWN_PORTS (static) as the port catalog.
 * Individual port status/congestion comes from /api/port/status/ and /api/analytics/congestion/
 */
export async function getPorts(): Promise<PortInfo[]> {
  return Promise.resolve(KNOWN_PORTS);
}

export async function getPortById(id: number): Promise<PortInfo | undefined> {
  return Promise.resolve(KNOWN_PORTS.find((p) => p.id === id));
}
