import type { CongestionLevel } from '../types/models';

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatETA(minutes: number | null): string {
  if (minutes === null || minutes === undefined) return 'N/A';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours < 24) return `${hours}h ${mins}m`;
  const days = Math.floor(hours / 24);
  const remainHours = hours % 24;
  return `${days}d ${remainHours}h`;
}

export function formatSpeed(knots: number): string {
  return `${knots.toFixed(1)} kn`;
}

export function formatCoordinates(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lon).toFixed(4)}°${lonDir}`;
}

export function getCongestionColor(level: CongestionLevel): string {
  switch (level) {
    case 'LOW':
      return '#2ed573';
    case 'MEDIUM':
      return '#ffa502';
    case 'HIGH':
      return '#ff4757';
    default:
      return '#5b7fc0';
  }
}

export function getCongestionBg(level: CongestionLevel): string {
  switch (level) {
    case 'LOW':
      return 'bg-success-500/20 text-success-400';
    case 'MEDIUM':
      return 'bg-warning-500/20 text-warning-400';
    case 'HIGH':
      return 'bg-danger-500/20 text-danger-400';
    default:
      return 'bg-navy-600/20 text-navy-300';
  }
}

export function getVesselStatus(speed: number): 'moving' | 'anchored' | 'docked' | 'unknown' {
  if (speed > 1) return 'moving';
  if (speed > 0) return 'anchored';
  return 'docked';
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'moving':
      return '#00d4aa';
    case 'anchored':
      return '#ffa502';
    case 'docked':
      return '#5b7fc0';
    default:
      return '#8da8d9';
  }
}

export function getShipTypeName(type: number): string {
  const types: Record<number, string> = {
    20: 'Wing in Ground',
    30: 'Fishing',
    31: 'Towing',
    32: 'Towing (large)',
    33: 'Dredger',
    34: 'Diving Ops',
    35: 'Military Ops',
    36: 'Sailing',
    37: 'Pleasure Craft',
    40: 'High Speed Craft',
    50: 'Pilot Vessel',
    51: 'Search & Rescue',
    52: 'Tug',
    53: 'Port Tender',
    55: 'Law Enforcement',
    60: 'Passenger',
    70: 'Cargo',
    80: 'Tanker',
    90: 'Other',
  };
  return types[type] || `Type ${type}`;
}
