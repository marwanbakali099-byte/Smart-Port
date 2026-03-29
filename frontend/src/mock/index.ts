import type {
  Alert,
  Boat,
  BoatETAResponse,
  DetectionCollection,
  PortAnalyticsResponse,
  PortCongestionIAResponse,
  PortEvent,
  PortInfo,
  PortStatusResponse,
  SatelliteDetectResponse,
} from '../types/models';

// ==========================================
// 1. PORTS
// ==========================================
export const mockPorts: PortInfo[] = [
  { id: 6, name: 'Tanger Ville', lat: 35.788, lon: -5.808, congestion: 'MEDIUM', boats_in_port: 11, capacity: 15 },
  { id: 7, name: 'Tanger Med', lat: 35.890, lon: -5.500, congestion: 'HIGH', boats_in_port: 18, capacity: 25 },
  { id: 8, name: 'Casablanca', lat: 33.605, lon: -7.595, congestion: 'LOW', boats_in_port: 12, capacity: 50 },
  { id: 9, name: 'Agadir', lat: 30.418, lon: -9.633, congestion: 'LOW', boats_in_port: 5, capacity: 20 },
  { id: 10, name: 'Nador', lat: 35.266, lon: -2.933, congestion: 'MEDIUM', boats_in_port: 2, capacity: 10 },
  { id: 11, name: 'Dakhla', lat: 23.705, lon: -15.938, congestion: 'LOW', boats_in_port: 4, capacity: 12 },
];

// ==========================================
// 2. VESSELS (Boats)
// ==========================================
export const mockVessels: Boat[] = [
  { id: 1, mmsi: '242000001', name: 'MSC TANGER', ship_type: 70, length: 150, width: 25, tonnage: 12000, last_seen: new Date().toISOString() },
  { id: 2, mmsi: '242000002', name: 'TANGER EXPRESS', ship_type: 60, length: 140, width: 22, tonnage: 11000, last_seen: new Date().toISOString() },
  { id: 3, mmsi: '242000003', name: 'MARSA CARGO II', ship_type: 70, length: 300, width: 40, tonnage: 85000, last_seen: new Date().toISOString() },
  { id: 4, mmsi: '242000004', name: 'MEDITERRANEAN SEA', ship_type: 80, length: 250, width: 35, tonnage: 60000, last_seen: new Date().toISOString() },
  { id: 5, mmsi: '242000005', name: 'ATLAS FERRY', ship_type: 60, length: 35, width: 8, tonnage: 200, last_seen: new Date().toISOString() },
  { id: 6, mmsi: '242000006', name: 'CASA TRADER', ship_type: 70, length: 180, width: 28, tonnage: 32000, last_seen: new Date().toISOString() },
  { id: 7, mmsi: '242000007', name: 'NADOR TRANSPORTER', ship_type: 70, length: 160, width: 25, tonnage: 28000, last_seen: new Date().toISOString() },
  { id: 8, mmsi: '242000008', name: 'AGADIR SUN', ship_type: 30, length: 45, width: 10, tonnage: 350, last_seen: new Date().toISOString() },
  { id: 9, mmsi: '242000009', name: 'DAKHLA OCEAN', ship_type: 30, length: 50, width: 12, tonnage: 400, last_seen: new Date().toISOString() },
  { id: 10, mmsi: '242000010', name: 'EUROPA BRIDGE', ship_type: 60, length: 200, width: 30, tonnage: 45000, last_seen: new Date().toISOString() },
];

export const getVesselByMmsi = (mmsi: string) => mockVessels.find(v => v.mmsi === mmsi) || mockVessels[0];

// ==========================================
// 3. DETECTIONS
// ==========================================
export const mockDetections: DetectionCollection = {
  type: 'FeatureCollection',
  features: [
    {
      id: 101,
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-5.500, 35.890] },
      properties: { id: 101, mmsi: '242000001', source: 'ais', speed: 12.4, heading: 180, timestamp: new Date().toISOString() }
    },
    {
      id: 102,
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-5.600, 35.950] },
      properties: { id: 102, mmsi: '242000002', source: 'ais', speed: 15.2, heading: 270, timestamp: new Date().toISOString() }
    },
    {
      id: 103,
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-5.450, 35.850] },
      properties: { id: 103, mmsi: '242000003', source: 'satellite', speed: 18.5, heading: 90, timestamp: new Date().toISOString() }
    },
    {
      id: 104,
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-5.700, 35.800] },
      properties: { id: 104, mmsi: '242000004', source: 'ais', speed: 0, heading: 45, timestamp: new Date().toISOString() }
    },
    {
      id: 105,
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-5.300, 36.000] },
      properties: { id: 105, mmsi: '242000005', source: 'ais', speed: 4.2, heading: 220, timestamp: new Date().toISOString() }
    },
    {
      id: 109,
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-6.000, 35.700] },
      properties: { id: 109, mmsi: '242000009', source: 'satellite', speed: 0, heading: 220, timestamp: new Date().toISOString() }
    }
  ]
};

// ==========================================
// 4. ANALYTICS (Section 2)
// ==========================================
export const mockAnalyticsData: Record<number, PortAnalyticsResponse> = {
  6: {
    port_id: 6,
    port_name: "Tanger Ville",
    boats_in_port: 11,
    congestion_level: "MEDIUM",
    avg_eta_minutes: 24,
  },
  7: {
    port_id: 7,
    port_name: "Tanger Med",
    boats_in_port: 18,
    congestion_level: "HIGH",
    avg_eta_minutes: 47,
  }
};

export const mockPortAnalytics = (portId: number): PortAnalyticsResponse => {
  return mockAnalyticsData[portId] || mockAnalyticsData[7];
};

// ==========================================
// 5. PORT STATUS (Section 3)
// ==========================================
export const mockPortStatusData: Record<number, PortStatusResponse> = {
  7: {
    port_id: 7,
    port_name: "Tanger Med",
    boats_in_port: 18,
    congestion: "HIGH",
    avg_eta_minutes: 47,
    coordinates: [-5.5068, 35.8847],
    boats: [
      "242000001",
      "242000003",
      "242000005",
      "242000002",
      "242000004",
    ]
  }
};

export const mockPortStatus = (portId: number): PortStatusResponse => {
  return mockPortStatusData[portId] || mockPortStatusData[7];
};

// ==========================================
// 6. IA PREDICTION (Section 4)
// ==========================================
export const mockCongestionIA = (portId: number): PortCongestionIAResponse => {
  const port = mockPorts.find(p => p.id === portId) || mockPorts[1];
  return {
    port_id: port.id,
    port_name: port.name,
    congestion_predictive_ia: port.congestion as 'LOW' | 'MEDIUM' | 'HIGH',
    confidence_score: 0.9664,
    boats_in_port: port.boats_in_port,
    last_update: new Date().toISOString(),
    model_info: "XGBoost v2.1 — entraîné sur 18 mois de données AIS",
    details: {
      port_id: port.id,
      port_name: port.name,
      boats_count: port.boats_in_port,
      fishing_hours: port.congestion === 'HIGH' ? 120 : 45,
      hour: new Date().getHours(),
      congestion: port.congestion,
      confidence: 0.9664,
    }
  };
};

// ==========================================
// 7. ETA PREDICTIONS (Section 1.1)
// ==========================================
export const mockETAData: Record<string, BoatETAResponse> = {
  "242000001": {
    mmsi: "242000001",
    nom: "MSC TANGER",
    type_bateau: "Cargo",
    vitesse_actuelle: 12.4,
    port_destination: "Tanger Med",
    eta_predite_minutes: 47,
    confidence_score: 0.9421,
    last_seen: "2026-03-22T14:22:00Z",
    timestamp_actuel: new Date().toISOString(),
  },
  "242000003": {
    mmsi: "242000003",
    nom: "MARSA CARGO II",
    type_bateau: "Cargo",
    vitesse_actuelle: 18.5,
    port_destination: "Tanger Med",
    eta_predite_minutes: 38,
    confidence_score: 0.9155,
    last_seen: new Date().toISOString(),
    timestamp_actuel: new Date().toISOString(),
  }
};

export const mockETA = (mmsi: string): BoatETAResponse => {
  return mockETAData[mmsi] || {
    mmsi,
    nom: "Unknown Vessel",
    type_bateau: "Unknown",
    vitesse_actuelle: 10,
    port_destination: "Tanger Med",
    eta_predite_minutes: 60,
    confidence_score: 0.85,
    last_seen: new Date().toISOString(),
    timestamp_actuel: new Date().toISOString(),
  };
};

// ==========================================
// 8. SATELLITE DETECTION (Section 6)
// ==========================================
export const mockSatelliteDetection: SatelliteDetectResponse = {
  source: "Satellite Multi-Sensor",
  count: 7,
  image_url: "https://picsum.photos/800/600?grayscale",
  detections: [
    { xmin: 120, ymin: 80, xmax: 200, ymax: 140, conf: 0.94 },
    { xmin: 340, ymin: 200, xmax: 520, ymax: 320, conf: 0.78 },
  ],
  coordinates: {
    lat: 35.7595,
    lon: -5.9017
  }
};

// ==========================================
// 9. EVENTS & ALERTS (Section 8)
// ==========================================
export const mockEventsData: PortEvent[] = [];
export const mockAlerts: Alert[] = [];
