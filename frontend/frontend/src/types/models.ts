// ==========================================
// TypeScript interfaces mirroring Django models
// ==========================================

// --- GeoJSON types for Detection API ---
export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface DetectionProperties {
  id: number;
  source: 'ais' | 'satellite';
  timestamp: string;
  mmsi: string;
  speed: number;
  heading?: number; // AIS specific
  eta_minutes?: number | null;
  ship_type?: number;
}

export interface DetectionFeature {
  id: number;
  type: 'Feature';
  geometry: GeoJSONPoint;
  properties: DetectionProperties;
}

export interface DetectionCollection {
  type: 'FeatureCollection';
  features: DetectionFeature[];
}

// --- Boat (from bateaux app) ---
export interface Boat {
  id: number;
  mmsi: string;
  name: string | null;
  ship_type: number;
  length: number;
  width: number;
  tonnage: number;
  last_seen: string;
}

// --- Port (from ports app) ---
export interface Port {
  id: number;
  name: string;
  capacity: number;
  boundary?: GeoJSONPolygon;
}

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

// --- AIS Position (from ais app) ---
export interface AISPosition {
  id: number;
  mmsi: string;
  location: GeoJSONPoint;
  speed: number | null;
  heading: number | null;
  timestamp: string;
}

// --- Port Event (from events app) ---
export interface PortEvent {
  id: number;
  boat: number;
  boat_mmsi?: string;
  mmsi?: string; // Unified mmsi field for filtering
  boat_name?: string;
  port: number;
  port_name?: string;
  event_type: 'entry' | 'exit';
  timestamp: string;
}

// --- Alert (from detection app) ---
export interface Alert {
  id: number;
  type: string;
  severity: 'low' | 'medium' | 'high';
  mmsi: string;
  timestamp: string;
  status: 'new' | 'reviewed' | 'resolved';
  description: string;
}

// --- Satellite Detection (from satellite app) ---
export interface SatelliteDetection {
  id: number;
  location: GeoJSONPoint;
  confidence: number;
  image_source: string | null;
  timestamp: string;
}

// --- Port Metrics (from analytics app) ---
export interface PortMetrics {
  id: number;
  port: number;
  boats_in_port: number;
  entries: number;
  exits: number;
  congestion_level: string;
  timestamp: string;
}

// ==========================================
// API Response types (exact shapes from Django views)
// ==========================================

// GET /api/analytics/{port_id}/
export interface PortHistoricalPoint {
  time: string;
  boats: number;
  congestion: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface PortAnalyticsResponse {
  port_id: number;
  boats_in_port: number;
  congestion_level: 'LOW' | 'MEDIUM' | 'HIGH';
  // Extended fields only present in mock / future backend:
  port_name?: string;
  congestion?: 'LOW' | 'MEDIUM' | 'HIGH';
  avg_eta_minutes?: number;
  historical_data?: PortHistoricalPoint[];
}

// GET /api/eta/{mmsi}/
export interface BoatETAResponse {
  mmsi: string;
  nom: string;
  type?: number;
  vitesse_actuelle: number;
  port_destination: string;
  eta_predite_minutes: number;
  timestamp_actuel: string;
  // Optional fields that may or may not be present:
  type_bateau?: string;
  confidence_score?: number;
  last_seen?: string;
}

// GET /api/port/status/{port_id}/
export interface PortStatusResponse {
  port_id: number;
  boats_in_port: number;
  boats: string[];
  avg_eta_minutes: number;
  congestion: 'LOW' | 'MEDIUM' | 'HIGH';
  // Fields only in mock / future backend:
  port_name?: string;
  coordinates?: [number, number];
  vessels_list?: Array<{
    mmsi: string;
    name: string;
    eta_minutes: number;
    status: string;
  }>;
  arrival_timeline?: Array<{
    time: string;
    vessel: string;
    type: 'ARRIVÉE' | 'DÉPART';
  }>;
}

// GET /api/analytics/congestion/{port_id}/
export interface PortCongestionIAResponse {
  port_name: string;
  congestion_predictive_ia: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence_score: number;
  last_update: string;
  details: {
    port_id: number;
    port_name: string;
    boats_count: number;
    fishing_hours: number;
    hour: number;
    congestion: string;
    confidence: number;
  };
  // Optional fields from mock:
  port_id?: number;
  boats_in_port?: number;
  model_info?: string;
}

// GET /api/video/stats/
export interface VideoDetectionRecord {
  id: number;
  vitesse: number;
  heure: string;
  confiance: number;
}

export interface VideoStatsResponse {
  status: string;
  total_records: number;
  last_detections: VideoDetectionRecord[];
}

// POST /api/satellite/detect/ (from screenshot)
export interface SatelliteDetectResponse {
  source: string;
  count: number;
  detections: Array<{
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
    conf: number;
  }>;
  image_url: string;
  coordinates: {
    lat: number;
    lon: number;
  };
}

// --- Derived types for the frontend ---
export interface VesselOnMap {
  mmsi: string;
  lat: number;
  lon: number;
  speed: number;
  source: 'ais' | 'satellite';
  timestamp: string;
  eta_minutes: number | null;
  status: 'moving' | 'anchored' | 'docked' | 'unknown';
}

export type CongestionLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';

export interface PortInfo {
  id: number;
  name: string;
  lat: number;
  lon: number;
  congestion: CongestionLevel;
  boats_in_port: number;
  capacity: number;
}

// Known ports with coordinates
export const KNOWN_PORTS: PortInfo[] = [
  {
    id: 6,
    name: 'Tanger Ville',
    lat: 35.788,
    lon: -5.808,
    congestion: 'LOW',
    boats_in_port: 0,
    capacity: 10,
  },
  {
    id: 7,
    name: 'Tanger Med',
    lat: 35.890,
    lon: -5.500,
    congestion: 'LOW',
    boats_in_port: 0,
    capacity: 10,
  },
];
