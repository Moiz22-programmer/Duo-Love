import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import * as THREE from 'three';
import { MapMemoryPin } from './LoveMapScreen';

export type GlobeMapMode = 'satellite' | 'night' | 'terrain' | 'street';

export interface WorldCity {
  id: string;
  name: string;
  country: string;
  flag: string;
  lat: number;
  lng: number;
  population?: string;
  description?: string;
}

interface Globe3DProps {
  pins: MapMemoryPin[];
  selectedPin: MapMemoryPin | null;
  onSelectPin: (pin: MapMemoryPin) => void;
  onGlobeClick: (lat: number, lng: number, placeName?: string) => void;
  autoRotate: boolean;
  mapMode: GlobeMapMode;
  showWorldCities?: boolean;
  onAutoSwitchToStreet?: (lat: number, lng: number) => void;
  showGridLines?: boolean;
  measurePoints?: Array<{ lat: number; lng: number; label?: string }>;
  onUpdateCameraStatus?: (status: { lat: number; lng: number; altitudeKm: number; headingDeg: number }) => void;
  sunMode?: 'day' | 'sunset' | 'night';
}

export interface Globe3DRef {
  flyTo: (lat: number, lng: number, zoomDistance?: number) => void;
  resetView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  orientNorth: () => void;
}

// Major World Cities dataset with flags and precise lat/lng
export const WORLD_CITIES: WorldCity[] = [
  // Europe
  { id: 'c_paris', name: 'Paris', country: 'France', flag: '🇫🇷', lat: 48.8566, lng: 2.3522, population: '2.1M', description: 'City of Love & Eiffel Tower' },
  { id: 'c_london', name: 'London', country: 'United Kingdom', flag: '🇬🇧', lat: 51.5074, lng: -0.1278, population: '9M', description: 'Big Ben & Thames River' },
  { id: 'c_rome', name: 'Rome', country: 'Italy', flag: '🇮🇹', lat: 41.9028, lng: 12.4964, population: '2.8M', description: 'Colosseum & Trevi Fountain' },
  { id: 'c_venice', name: 'Venice', country: 'Italy', flag: '🇮🇹', lat: 45.4408, lng: 12.3155, population: '260K', description: 'Grand Canal & Gondolas' },
  { id: 'c_santorini', name: 'Santorini', country: 'Greece', flag: '🇬🇷', lat: 36.3932, lng: 25.4615, population: '15K', description: 'White Cliffside Sunset & Aegean Sea' },
  { id: 'c_berlin', name: 'Berlin', country: 'Germany', flag: '🇩🇪', lat: 52.5200, lng: 13.4050, population: '3.6M', description: 'Brandenburg Gate & Historic Wall' },
  { id: 'c_madrid', name: 'Madrid', country: 'Spain', flag: '🇪🇸', lat: 40.4168, lng: -3.7038, population: '3.2M', description: 'Royal Palace & Plaza Mayor' },
  { id: 'c_barcelona', name: 'Barcelona', country: 'Spain', flag: '🇪🇸', lat: 41.3879, lng: 2.1699, population: '1.6M', description: 'Sagrada Família & Park Güell' },
  { id: 'c_amsterdam', name: 'Amsterdam', country: 'Netherlands', flag: '🇳🇱', lat: 52.3676, lng: 4.9041, population: '870K', description: 'Canals & Tulips' },
  { id: 'c_vienna', name: 'Vienna', country: 'Austria', flag: '🇦🇹', lat: 48.2082, lng: 16.3738, population: '1.9M', description: 'Schönbrunn Palace & Classical Music' },
  { id: 'c_prague', name: 'Prague', country: 'Czechia', flag: '🇨🇿', lat: 50.0755, lng: 14.4378, population: '1.3M', description: 'Charles Bridge & Astronomical Clock' },
  { id: 'c_zurich', name: 'Zurich', country: 'Switzerland', flag: '🇨🇭', lat: 47.3769, lng: 8.5417, population: '430K', description: 'Swiss Alps & Lake Zurich' },
  { id: 'c_athens', name: 'Athens', country: 'Greece', flag: '🇬🇷', lat: 37.9838, lng: 23.7275, population: '660K', description: 'Parthenon & Ancient Acropolis' },
  { id: 'c_dublin', name: 'Dublin', country: 'Ireland', flag: '🇮🇪', lat: 53.3498, lng: -6.2603, population: '544K', description: 'Trinity College & Temple Bar' },
  { id: 'c_istanbul', name: 'Istanbul', country: 'Turkey', flag: '🇹🇷', lat: 41.0082, lng: 28.9784, population: '15.5M', description: 'Hagia Sophia & Bosphorus Strait' },
  { id: 'c_moscow', name: 'Moscow', country: 'Russia', flag: '🇷🇺', lat: 55.7558, lng: 37.6173, population: '12.5M', description: 'Red Square & St. Basil Cathedral' },

  // Asia & Middle East (Pakistan Cities & Major World Hubs)
  { id: 'c_islamabad', name: 'Islamabad', country: 'Pakistan', flag: '🇵🇰', lat: 33.6844, lng: 73.0479, population: '1.2M', description: 'Capital City & Margalla Hills' },
  { id: 'c_lahore', name: 'Lahore', country: 'Pakistan', flag: '🇵🇰', lat: 31.5204, lng: 74.3587, population: '13M', description: 'Cultural Heart & Badshahi Mosque' },
  { id: 'c_karachi', name: 'Karachi', country: 'Pakistan', flag: '🇵🇰', lat: 24.8607, lng: 67.0011, population: '16M', description: 'City of Lights & Arabian Coast' },
  { id: 'c_rawalpindi', name: 'Rawalpindi', country: 'Pakistan', flag: '🇵🇰', lat: 33.5651, lng: 73.0169, population: '2.3M', description: 'Historic Twin City & Raja Bazaar' },
  { id: 'c_peshawar', name: 'Peshawar', country: 'Pakistan', flag: '🇵🇰', lat: 34.0151, lng: 71.5249, population: '2.0M', description: 'Gateway to Khyber Pass' },
  { id: 'c_multan', name: 'Multan', country: 'Pakistan', flag: '🇵🇰', lat: 30.1575, lng: 71.5249, population: '1.9M', description: 'City of Sufi Saints & Shrines' },
  { id: 'c_faisalabad', name: 'Faisalabad', country: 'Pakistan', flag: '🇵🇰', lat: 31.4504, lng: 73.1350, population: '3.2M', description: 'Manchester of Pakistan' },
  { id: 'c_quetta', name: 'Quetta', country: 'Pakistan', flag: '🇵🇰', lat: 30.1798, lng: 66.9750, population: '1.0M', description: 'Fruit Garden & Valley Capital' },
  { id: 'c_sialkot', name: 'Sialkot', country: 'Pakistan', flag: '🇵🇰', lat: 32.4945, lng: 74.5229, population: '920K', description: 'City of Iqbal & Export Hub' },
  { id: 'c_gujranwala', name: 'Gujranwala', country: 'Pakistan', flag: '🇵🇰', lat: 32.1877, lng: 74.1945, population: '2.2M', description: 'City of Wrestlers & Pehlwans' },
  { id: 'c_hyderabad', name: 'Hyderabad', country: 'Pakistan', flag: '🇵🇰', lat: 25.3960, lng: 68.3578, population: '1.7M', description: 'Historic Indus City & Pacco Qillo' },
  { id: 'c_abbottabad', name: 'Abbottabad', country: 'Pakistan', flag: '🇵🇰', lat: 34.1688, lng: 73.2215, population: '250K', description: 'Pine Valley & Military Academy' },
  { id: 'c_hunza', name: 'Hunza Valley', country: 'Pakistan', flag: '🇵🇰', lat: 36.3167, lng: 74.6500, population: '70K', description: 'Karakoram Mountain Paradise' },
  { id: 'c_skardu', name: 'Skardu', country: 'Pakistan', flag: '🇵🇰', lat: 35.2971, lng: 75.6333, population: '214K', description: 'Shangrila Resort & Deosai Plains' },
  { id: 'c_gilgit', name: 'Gilgit', country: 'Pakistan', flag: '🇵🇰', lat: 35.9208, lng: 74.3144, population: '216K', description: 'Karakoram Highway Crossroads' },
  { id: 'c_murree', name: 'Murree', country: 'Pakistan', flag: '🇵🇰', lat: 33.9070, lng: 73.3943, population: '35K', description: 'Mall Road & Snowy Hill Station' },
  { id: 'c_swat', name: 'Swat Valley', country: 'Pakistan', flag: '🇵🇰', lat: 34.7717, lng: 72.3600, population: '330K', description: 'Switzerland of Pakistan & Mingora' },
  { id: 'c_gwadar', name: 'Gwadar', country: 'Pakistan', flag: '🇵🇰', lat: 25.1264, lng: 62.3225, population: '138K', description: 'Deep Sea Port & Hammerhead Peninsula' },
  { id: 'c_sukkur', name: 'Sukkur', country: 'Pakistan', flag: '🇵🇰', lat: 27.7052, lng: 68.8574, population: '500K', description: 'Lansdowne Bridge & Sukkur Barrage' },
  { id: 'c_bahawalpur', name: 'Bahawalpur', country: 'Pakistan', flag: '🇵🇰', lat: 29.3544, lng: 71.6911, population: '760K', description: 'Noor Mahal & Royal Palace City' },
  { id: 'c_tokyo', name: 'Tokyo', country: 'Japan', flag: '🇯🇵', lat: 35.6762, lng: 139.6503, population: '14M', description: 'Shibuya Crossing & Cherry Blossoms' },
  { id: 'c_kyoto', name: 'Kyoto', country: 'Japan', flag: '🇯🇵', lat: 35.0037, lng: 135.7772, population: '1.4M', description: 'Ancient Shrines & Bamboo Groves' },
  { id: 'c_seoul', name: 'Seoul', country: 'South Korea', flag: '🇰🇷', lat: 37.5665, lng: 126.9780, population: '9.7M', description: 'N Seoul Tower & Gyeongbokgung' },
  { id: 'c_beijing', name: 'Beijing', country: 'China', flag: '🇨🇳', lat: 39.9042, lng: 116.4074, population: '21.5M', description: 'Great Wall of China & Forbidden City' },
  { id: 'c_shanghai', name: 'Shanghai', country: 'China', flag: '🇨🇳', lat: 31.2304, lng: 121.4737, population: '24M', description: 'The Bund & Oriental Pearl' },
  { id: 'c_singapore', name: 'Singapore', country: 'Singapore', flag: '🇸🇬', lat: 1.3521, lng: 103.8198, population: '5.6M', description: 'Marina Bay Sands & Gardens by the Bay' },
  { id: 'c_bangkok', name: 'Bangkok', country: 'Thailand', flag: '🇹🇭', lat: 13.7563, lng: 100.5018, population: '10.5M', description: 'Grand Palace & Floating Markets' },
  { id: 'c_mumbai', name: 'Mumbai', country: 'India', flag: '🇮🇳', lat: 19.0760, lng: 72.8777, population: '20M', description: 'Gateway of India & Marine Drive' },
  { id: 'c_dubai', name: 'Dubai', country: 'United Arab Emirates', flag: '🇦🇪', lat: 25.2048, lng: 55.2708, population: '3.3M', description: 'Burj Khalifa & Desert Safaris' },
  { id: 'c_bali', name: 'Bali', country: 'Indonesia', flag: '🇮🇩', lat: -8.3405, lng: 115.0920, population: '4.3M', description: 'Tropical Beaches & Sacred Temples' },

  // Americas
  { id: 'c_ny', name: 'New York', country: 'United States', flag: '🇺🇸', lat: 40.7128, lng: -74.0060, population: '8.4M', description: 'Times Square & Central Park' },
  { id: 'c_la', name: 'Los Angeles', country: 'United States', flag: '🇺🇸', lat: 34.0522, lng: -118.2437, population: '3.8M', description: 'Hollywood & Santa Monica Pier' },
  { id: 'c_sf', name: 'San Francisco', country: 'United States', flag: '🇺🇸', lat: 37.7749, lng: -122.4194, population: '815K', description: 'Golden Gate Bridge & Cable Cars' },
  { id: 'c_toronto', name: 'Toronto', country: 'Canada', flag: '🇨🇦', lat: 43.6532, lng: -79.3832, population: '2.9M', description: 'CN Tower & Lake Ontario' },
  { id: 'c_mexico', name: 'Mexico City', country: 'Mexico', flag: '🇲🇽', lat: 19.4326, lng: -99.1332, population: '9.2M', description: 'Zócalo & Aztec Pyramids' },
  { id: 'c_rio', name: 'Rio de Janeiro', country: 'Brazil', flag: '🇧🇷', lat: -22.9068, lng: -43.1729, population: '6.7M', description: 'Christ the Redeemer & Copacabana' },
  { id: 'c_buenosaires', name: 'Buenos Aires', country: 'Argentina', flag: '🇦🇷', lat: -34.6037, lng: -58.3816, population: '3M', description: 'Tango Capital & Obelisco' },

  // Africa & Oceania
  { id: 'c_cairo', name: 'Cairo', country: 'Egypt', flag: '🇪🇬', lat: 30.0444, lng: 31.2357, population: '10M', description: 'Great Pyramids of Giza' },
  { id: 'c_capetown', name: 'Cape Town', country: 'South Africa', flag: '🇿🇦', lat: -33.9249, lng: 18.4241, population: '4.6M', description: 'Table Mountain & Cape Peninsula' },
  { id: 'c_sydney', name: 'Sydney', country: 'Australia', flag: '🇦🇺', lat: -33.8688, lng: 151.2093, population: '5.3M', description: 'Opera House & Bondi Beach' },
  { id: 'c_auckland', name: 'Auckland', country: 'New Zealand', flag: '🇳🇿', lat: -36.8485, lng: 174.7633, population: '1.6M', description: 'Sky Tower & Hauraki Gulf' },
];

// Major Country Labels with Lat/Lng centers
const WORLD_COUNTRIES = [
  { name: 'UNITED STATES', lat: 39.8, lng: -98.5, flag: '🇺🇸' },
  { name: 'CANADA', lat: 56.1, lng: -106.3, flag: '🇨🇦' },
  { name: 'BRAZIL', lat: -14.2, lng: -51.9, flag: '🇧🇷' },
  { name: 'MEXICO', lat: 23.6, lng: -102.5, flag: '🇲🇽' },
  { name: 'UNITED KINGDOM', lat: 55.3, lng: -3.4, flag: '🇬🇧' },
  { name: 'FRANCE', lat: 46.2, lng: 2.2, flag: '🇫🇷' },
  { name: 'GERMANY', lat: 51.1, lng: 10.4, flag: '🇩🇪' },
  { name: 'ITALY', lat: 41.8, lng: 12.5, flag: '🇮🇹' },
  { name: 'SPAIN', lat: 40.4, lng: -3.7, flag: '🇪🇸' },
  { name: 'GREECE', lat: 39.0, lng: 22.0, flag: '🇬🇷' },
  { name: 'EGYPT', lat: 26.8, lng: 30.8, flag: '🇪🇬' },
  { name: 'SOUTH AFRICA', lat: -30.5, lng: 22.9, flag: '🇿🇦' },
  { name: 'RUSSIA', lat: 61.5, lng: 105.3, flag: '🇷🇺' },
  { name: 'PAKISTAN', lat: 30.3753, lng: 69.3451, flag: '🇵🇰' },
  { name: 'INDIA', lat: 20.5, lng: 78.9, flag: '🇮🇳' },
  { name: 'CHINA', lat: 35.8, lng: 104.1, flag: '🇨🇳' },
  { name: 'JAPAN', lat: 36.2, lng: 138.2, flag: '🇯🇵' },
  { name: 'AUSTRALIA', lat: -25.2, lng: 133.7, flag: '🇦🇺' },
  { name: 'ARGENTINA', lat: -38.4, lng: -63.6, flag: '🇦🇷' },
  { name: 'TURKEY', lat: 38.9, lng: 35.2, flag: '🇹🇷' },
  { name: 'SAUDI ARABIA', lat: 23.8, lng: 45.0, flag: '🇸🇦' },
  { name: 'UNITED ARAB EMIRATES', lat: 23.4, lng: 53.8, flag: '🇦🇪' },
  { name: 'IRAN', lat: 32.4, lng: 53.7, flag: '🇮🇷' },
  { name: 'INDONESIA', lat: -0.78, lng: 113.9, flag: '🇮🇩' },
  { name: 'MALAYSIA', lat: 4.2, lng: 101.9, flag: '🇲🇾' },
  { name: 'SWITZERLAND', lat: 46.8, lng: 8.2, flag: '🇨🇭' },
  { name: 'SOUTH KOREA', lat: 35.9, lng: 127.7, flag: '🇰🇷' },
  { name: 'THAILAND', lat: 15.8, lng: 100.9, flag: '🇹🇭' },
];

// Helper to calculate shortest rotation angle distance
function unwrapAngle(current: number, target: number): number {
  const TWO_PI = Math.PI * 2;
  let diff = (target - current) % TWO_PI;
  if (diff < -Math.PI) diff += TWO_PI;
  if (diff > Math.PI) diff -= TWO_PI;
  return current + diff;
}

// Convert Lat/Lng to 3D Cartesian Vector on Sphere of radius R
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

// Convert 3D Vector on Sphere back to Lat/Lng
function vector3ToLatLng(vec: THREE.Vector3, radius: number): { lat: number; lng: number } {
  const normalized = vec.clone().normalize();
  const lat = 90 - Math.acos(Math.max(-1, Math.min(1, normalized.y))) * (180 / Math.PI);
  const lng = ((Math.atan2(normalized.z, -normalized.x) * (180 / Math.PI)) - 180 + 540) % 360 - 180;
  return { lat, lng };
}

// Draw realistic high-detail Earth texture canvas with real country outlines, country labels & major cities
function createProceduralEarthCanvas(mode: GlobeMapMode): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 4096;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d')!;

  const isNight = mode === 'night';
  const isTerrain = mode === 'terrain';
  const isStreet = mode === 'street';

  // Base Deep Blue Oceans
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, 2048);
  if (isNight) {
    oceanGrad.addColorStop(0, '#040212');
    oceanGrad.addColorStop(0.5, '#090624');
    oceanGrad.addColorStop(1, '#02010a');
  } else if (isTerrain) {
    oceanGrad.addColorStop(0, '#0e243a');
    oceanGrad.addColorStop(0.5, '#163b5f');
    oceanGrad.addColorStop(1, '#081726');
  } else if (isStreet) {
    oceanGrad.addColorStop(0, '#152c48');
    oceanGrad.addColorStop(0.5, '#20436b');
    oceanGrad.addColorStop(1, '#0d1d30');
  } else { // satellite default
    oceanGrad.addColorStop(0, '#08172e');
    oceanGrad.addColorStop(0.5, '#10274c');
    oceanGrad.addColorStop(1, '#050f20');
  }
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, 4096, 2048);

  // Lat/Lng Grid Lines
  ctx.strokeStyle = isNight ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1.5;
  for (let x = 0; x <= 4096; x += 256) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 2048);
    ctx.stroke();
  }
  for (let y = 0; y <= 2048; y += 128) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(4096, y);
    ctx.stroke();
  }

  // Equator Line
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 1024);
  ctx.lineTo(4096, 1024);
  ctx.stroke();

  // Helper lat/lng mapping
  const mapCoord = (lat: number, lng: number): [number, number] => {
    const x = ((lng + 180) / 360) * 4096;
    const y = ((90 - lat) / 180) * 2048;
    return [x, y];
  };

  const drawPoly = (coords: Array<[number, number]>) => {
    ctx.beginPath();
    coords.forEach(([lat, lng], idx) => {
      const [cx, cy] = mapCoord(lat, lng);
      if (idx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  // Draw Realistic Continent Landmasses with vibrant borders
  ctx.fillStyle = isNight ? '#1b123d' : isTerrain ? '#294e2e' : isStreet ? '#2a3547' : '#1e482b';
  ctx.strokeStyle = isNight ? '#a855f7' : isTerrain ? '#34d399' : isStreet ? '#38bdf8' : '#10b981';
  ctx.lineWidth = 3.5;

  // North America
  drawPoly([[75, -165], [72, -140], [65, -125], [60, -100], [52, -55], [45, -60], [30, -80], [15, -90], [8, -78], [15, -105], [30, -120], [55, -135], [65, -168]]);
  // Greenland
  drawPoly([[82, -40], [80, -10], [68, -25], [60, -45], [75, -60]]);
  // South America
  drawPoly([[12, -75], [8, -60], [5, -50], [-5, -35], [-20, -40], [-40, -60], [-55, -68], [-40, -75], [-18, -70], [0, -80]]);
  // Europe
  drawPoly([[71, 25], [60, 30], [55, 10], [45, -10], [36, -10], [38, 15], [42, 28], [50, 45], [60, 50], [68, 40]]);
  // British Isles
  drawPoly([[58, -6], [55, 1], [50, -5], [54, -10]]);
  // Scandinavia
  drawPoly([[70, 20], [65, 30], [58, 15], [60, 5], [70, 15]]);
  // Africa
  drawPoly([[37, 10], [32, 32], [12, 44], [-12, 40], [-34, 20], [-33, 18], [0, 9], [12, -16], [30, -10]]);
  // Asia
  drawPoly([[75, 60], [75, 175], [60, 170], [45, 142], [30, 120], [20, 110], [10, 105], [12, 75], [25, 65], [40, 50], [60, 55]]);
  // India
  drawPoly([[25, 70], [22, 88], [8, 77], [18, 72]]);
  // Japan
  drawPoly([[45, 142], [38, 140], [34, 135], [40, 140]]);
  // Australia
  drawPoly([[-12, 130], [-15, 148], [-35, 150], [-38, 140], [-32, 115], [-20, 115], [-12, 130]]);

  // Draw Country Names on the Texture
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  WORLD_COUNTRIES.forEach((c) => {
    const [cx, cy] = mapCoord(c.lat, c.lng);
    ctx.fillText(`${c.flag} ${c.name}`, cx, cy);
  });

  // Draw World City Markers and Labels on Texture
  WORLD_CITIES.forEach((c) => {
    const [cx, cy] = mapCoord(c.lat, c.lng);
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`${c.flag} ${c.name}`, cx, cy - 20);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

export const Globe3D = forwardRef<Globe3DRef, Globe3DProps>(({
  pins,
  selectedPin,
  onSelectPin,
  onGlobeClick,
  autoRotate,
  mapMode,
  showWorldCities = true,
  onAutoSwitchToStreet,
  showGridLines = true,
  measurePoints = [],
  onUpdateCameraStatus,
  sunMode = 'day',
}, ref) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [screenOverlayPins, setScreenOverlayPins] = useState<Array<{ pin: MapMemoryPin; x: number; y: number; visible: boolean }>>([]);
  const [screenOverlayCities, setScreenOverlayCities] = useState<Array<{ city: WorldCity; x: number; y: number; visible: boolean }>>([]);

  const globeRadius = 3;
  const targetAnim = useRef<{ x: number; y: number; zoom: number } | null>(null);
  
  // Parabolic Swoop Arc Flight Animation Ref (Google Earth style)
  const flightAnim = useRef<{
    startX: number;
    startY: number;
    startZoom: number;
    targetX: number;
    targetY: number;
    targetZoom: number;
    midZoom: number | null;
    progress: number;
    durationFrames: number;
  } | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeMeshRef = useRef<THREE.Mesh | null>(null);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const pinMarkersGroupRef = useRef<THREE.Group | null>(null);
  const arcsGroupRef = useRef<THREE.Group | null>(null);

  const onUpdateCameraStatusRef = useRef(onUpdateCameraStatus);
  useEffect(() => {
    onUpdateCameraStatusRef.current = onUpdateCameraStatus;
  }, [onUpdateCameraStatus]);

  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const rotationVelocityRef = useRef({ x: 0, y: 0 });

  // Camera zoom bounds (Google Earth style zoom in/out limits)
  const minZoomDistance = 3.3;
  const maxZoomDistance = 15.0;

  useImperativeHandle(ref, () => ({
    flyTo: (lat: number, lng: number, zoomDistance = 3.8) => {
      if (!globeGroupRef.current || !cameraRef.current) return;
      const targetX = lat * (Math.PI / 180);
      const rawTargetY = (-90 - lng) * (Math.PI / 180);
      const targetY = unwrapAngle(globeGroupRef.current.rotation.y, rawTargetY);

      const startX = globeGroupRef.current.rotation.x;
      const startY = globeGroupRef.current.rotation.y;
      const startZoom = cameraRef.current.position.z;

      const dx = targetX - startX;
      const dy = targetY - startY;
      const angleDist = Math.sqrt(dx * dx + dy * dy);

      const clampedZoom = Math.max(minZoomDistance, Math.min(maxZoomDistance, zoomDistance));
      const midZoom = angleDist > 0.35 ? Math.min(9.5, Math.max(startZoom, clampedZoom) + Math.min(3.2, angleDist * 1.6)) : null;

      flightAnim.current = {
        startX,
        startY,
        startZoom,
        targetX,
        targetY,
        targetZoom: clampedZoom,
        midZoom,
        progress: 0,
        durationFrames: Math.min(90, Math.max(40, Math.round(angleDist * 32))),
      };

      // Also set targetAnim as fallback
      targetAnim.current = {
        x: targetX,
        y: targetY,
        zoom: clampedZoom,
      };
    },
    resetView: () => {
      if (!globeGroupRef.current) return;
      const targetX = 0.2;
      const targetY = unwrapAngle(globeGroupRef.current.rotation.y, -Math.PI / 2);

      targetAnim.current = {
        x: targetX,
        y: targetY,
        zoom: 8.5,
      };
    },
    orientNorth: () => {
      if (!globeGroupRef.current) return;
      const currentY = globeGroupRef.current.rotation.y;
      targetAnim.current = {
        x: 0, // level horizon facing equator
        y: currentY,
        zoom: cameraRef.current ? cameraRef.current.position.z : 6.0,
      };
    },
    zoomIn: () => {
      if (!cameraRef.current) return;
      const currentZoom = targetAnim.current ? targetAnim.current.zoom : cameraRef.current.position.z;

      if (currentZoom <= 3.7 && onAutoSwitchToStreet && globeGroupRef.current) {
        const normY = ((-globeGroupRef.current.rotation.y % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const lat = Number((globeGroupRef.current.rotation.x * (180 / Math.PI)).toFixed(4));
        const lng = Number((((normY - Math.PI) * (180 / Math.PI))).toFixed(4));
        onAutoSwitchToStreet(lat, lng);
        return;
      }

      const newZoom = Math.max(minZoomDistance, currentZoom - 1.2);
      if (targetAnim.current) {
        targetAnim.current.zoom = newZoom;
      } else if (globeGroupRef.current) {
        targetAnim.current = {
          x: globeGroupRef.current.rotation.x,
          y: globeGroupRef.current.rotation.y,
          zoom: newZoom,
        };
      }
    },
    zoomOut: () => {
      if (!cameraRef.current) return;
      const currentZoom = targetAnim.current ? targetAnim.current.zoom : cameraRef.current.position.z;
      const newZoom = Math.min(maxZoomDistance, currentZoom + 1.2);
      if (targetAnim.current) {
        targetAnim.current.zoom = newZoom;
      } else if (globeGroupRef.current) {
        targetAnim.current = {
          x: globeGroupRef.current.rotation.x,
          y: globeGroupRef.current.rotation.y,
          zoom: newZoom,
        };
      }
    },
  }));

  // Setup Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || 500;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8.5);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.4);
    sunLight.position.set(15, 12, 15);
    scene.add(sunLight);

    const backLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    backLight.position.set(-15, -10, -15);
    scene.add(backLight);

    // 5. Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // 6. Earth Mesh setup
    const globeGeometry = new THREE.SphereGeometry(globeRadius, 64, 64);
    const proceduralFallback = createProceduralEarthCanvas(mapMode);

    const globeMaterial = new THREE.MeshPhongMaterial({
      map: proceduralFallback,
      shininess: 30,
      specular: new THREE.Color(0x38bdf8),
    });

    const globeMesh = new THREE.Mesh(globeGeometry, globeMaterial);
    globeGroup.add(globeMesh);
    globeMeshRef.current = globeMesh;

    // Load High-Res NASA / Satellite Texture
    const textureLoader = new THREE.TextureLoader();
    let textureUrl = 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
    if (mapMode === 'night') textureUrl = 'https://unpkg.com/three-globe/example/img/earth-night.jpg';
    else if (mapMode === 'terrain') textureUrl = 'https://unpkg.com/three-globe/example/img/earth-topology.png';
    else if (mapMode === 'street') textureUrl = 'https://unpkg.com/three-globe/example/img/earth-day.jpg';

    textureLoader.setCrossOrigin('anonymous');
    textureLoader.load(
      textureUrl,
      (loadedTexture) => {
        loadedTexture.wrapS = THREE.RepeatWrapping;
        loadedTexture.wrapT = THREE.ClampToEdgeWrapping;
        globeMaterial.map = loadedTexture;
        globeMaterial.needsUpdate = true;
      },
      undefined,
      (err) => {
        console.warn('Real satellite texture fallback to procedural canvas', err);
      }
    );

    // 7. Dynamic Atmosphere Clouds Layer
    const cloudsGeometry = new THREE.SphereGeometry(globeRadius * 1.018, 64, 64);
    const cloudsMaterial = new THREE.MeshPhongMaterial({
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
    globeGroup.add(cloudsMesh);
    cloudsMeshRef.current = cloudsMesh;

    textureLoader.load(
      'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png',
      (cloudTex) => {
        cloudTex.wrapS = THREE.RepeatWrapping;
        cloudTex.wrapT = THREE.ClampToEdgeWrapping;
        cloudsMaterial.map = cloudTex;
        cloudsMaterial.needsUpdate = true;
      }
    );

    // 8. Rayleigh Atmospheric Blue Horizon Halo Glow
    const atmosphereGeometry = new THREE.SphereGeometry(globeRadius * 1.07, 64, 64);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
      side: THREE.BackSide,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    globeGroup.add(atmosphereMesh);

    // 9. Outer Starfield
    const starsCount = 1000;
    const starsGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 150;
      starPositions[i + 1] = (Math.random() - 0.5) * 150;
      starPositions[i + 2] = (Math.random() - 0.5) * 150;
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.7,
      transparent: true,
      opacity: 0.85,
    });
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);

    // Groups for Markers & Arcs
    const pinMarkersGroup = new THREE.Group();
    globeGroup.add(pinMarkersGroup);
    pinMarkersGroupRef.current = pinMarkersGroup;

    const arcsGroup = new THREE.Group();
    globeGroup.add(arcsGroup);
    arcsGroupRef.current = arcsGroup;

    // ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width || container.clientWidth;
        const h = entry.contentRect.height || container.clientHeight;
        if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Rotate Cloud Layer continuously relative to Earth
      if (cloudsMeshRef.current) {
        cloudsMeshRef.current.rotation.y += 0.0004;
      }

      // Smooth Google Earth Parabolic Flight Arc Motion
      if (flightAnim.current && globeGroupRef.current && cameraRef.current) {
        const flight = flightAnim.current;
        flight.progress += 1 / flight.durationFrames;

        if (flight.progress >= 1.0) {
          flight.progress = 1.0;
          globeGroupRef.current.rotation.x = flight.targetX;
          globeGroupRef.current.rotation.y = flight.targetY;
          cameraRef.current.position.z = flight.targetZoom;
          flightAnim.current = null;
          targetAnim.current = null;
        } else {
          // Cubic Ease In Out curve for silky smooth acceleration and deceleration
          const t = flight.progress;
          const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

          globeGroupRef.current.rotation.x = THREE.MathUtils.lerp(flight.startX, flight.targetX, easeT);
          globeGroupRef.current.rotation.y = THREE.MathUtils.lerp(flight.startY, flight.targetY, easeT);

          if (flight.midZoom !== null) {
            // Smooth sinusoidal arc curve for Google Earth parabolic swoop
            const peak = Math.sin(t * Math.PI);
            const baseZoom = THREE.MathUtils.lerp(flight.startZoom, flight.targetZoom, easeT);
            cameraRef.current.position.z = baseZoom + (flight.midZoom - Math.max(flight.startZoom, flight.targetZoom)) * peak;
          } else {
            cameraRef.current.position.z = THREE.MathUtils.lerp(flight.startZoom, flight.targetZoom, easeT);
          }
        }
      } else if (targetAnim.current && globeGroupRef.current && cameraRef.current) {
        const target = targetAnim.current;
        globeGroupRef.current.rotation.x = THREE.MathUtils.lerp(globeGroupRef.current.rotation.x, target.x, 0.08);
        globeGroupRef.current.rotation.y = THREE.MathUtils.lerp(globeGroupRef.current.rotation.y, target.y, 0.08);
        cameraRef.current.position.z = THREE.MathUtils.lerp(cameraRef.current.position.z, target.zoom, 0.08);

        if (
          Math.abs(globeGroupRef.current.rotation.x - target.x) < 0.003 &&
          Math.abs(globeGroupRef.current.rotation.y - target.y) < 0.003 &&
          Math.abs(cameraRef.current.position.z - target.zoom) < 0.01
        ) {
          targetAnim.current = null;
        }
      } else if (autoRotate && globeGroupRef.current && !isDraggingRef.current) {
        globeGroupRef.current.rotation.y += 0.002;
      }

      // Inertial Rotation decay after drag
      if (!isDraggingRef.current && globeGroupRef.current) {
        globeGroupRef.current.rotation.y += rotationVelocityRef.current.x;
        globeGroupRef.current.rotation.x += rotationVelocityRef.current.y;
        rotationVelocityRef.current.x *= 0.92;
        rotationVelocityRef.current.y *= 0.92;
      }

      // Animate shockwave rings on selected 3D pins
      if (pinMarkersGroupRef.current) {
        pinMarkersGroupRef.current.children.forEach((child) => {
          if (child.name === 'selected_shockwave_ring') {
            const time = Date.now() * 0.0035;
            const pulseScale = 1 + Math.sin(time * 3) * 0.28;
            child.scale.set(pulseScale, pulseScale, 1);
            (child as THREE.Mesh).rotation.z += 0.02;
          }
        });
      }

      // Report Realtime Google Earth Status (Lat, Lng, Alt, Heading)
      if (globeGroupRef.current && cameraRef.current && onUpdateCameraStatusRef.current) {
        const normY = ((-globeGroupRef.current.rotation.y % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const lat = Number((globeGroupRef.current.rotation.x * (180 / Math.PI)).toFixed(4));
        const lng = Number((((normY - Math.PI) * (180 / Math.PI))).toFixed(4));
        const cameraZ = cameraRef.current.position.z;
        const altitudeKm = Math.round(Math.max(150, (cameraZ - globeRadius) * 2120));
        const headingDeg = Math.round((((normY) * (180 / Math.PI)) % 360 + 360) % 360);

        onUpdateCameraStatusRef.current({ lat, lng, altitudeKm, headingDeg });
      }

      // Project 3D Memory Pins & World Cities to 2D HTML Screen Badges
      if (cameraRef.current && container && globeGroupRef.current) {
        const w = container.clientWidth;
        const h = container.clientHeight;
        globeGroupRef.current.updateMatrixWorld(true);

        // Memory Pins
        const projectedPins: Array<{ pin: MapMemoryPin; x: number; y: number; visible: boolean }> = [];
        pins.forEach((pin) => {
          const worldPos = latLngToVector3(pin.lat, pin.lng, globeRadius + 0.1);
          worldPos.applyMatrix4(globeGroupRef.current!.matrixWorld);

          const projected = worldPos.clone().project(cameraRef.current!);
          const isFront = projected.z < 1.0;
          const camDir = cameraRef.current!.position.clone().normalize();
          const dot = worldPos.clone().normalize().dot(camDir);

          projectedPins.push({
            pin,
            x: (projected.x * 0.5 + 0.5) * w,
            y: (-projected.y * 0.5 + 0.5) * h,
            visible: isFront && dot > 0.1,
          });
        });
        setScreenOverlayPins(projectedPins);

        // World Cities Overlay Badges
        if (showWorldCities) {
          const projectedCities: Array<{ city: WorldCity; x: number; y: number; visible: boolean }> = [];
          WORLD_CITIES.forEach((city) => {
            const worldPos = latLngToVector3(city.lat, city.lng, globeRadius + 0.06);
            worldPos.applyMatrix4(globeGroupRef.current!.matrixWorld);

            const projected = worldPos.clone().project(cameraRef.current!);
            const isFront = projected.z < 1.0;
            const camDir = cameraRef.current!.position.clone().normalize();
            const dot = worldPos.clone().normalize().dot(camDir);

            projectedCities.push({
              city,
              x: (projected.x * 0.5 + 0.5) * w,
              y: (-projected.y * 0.5 + 0.5) * h,
              visible: isFront && dot > 0.15,
            });
          });
          setScreenOverlayCities(projectedCities);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [pins, autoRotate, mapMode, showWorldCities]);

  // Update 3D Pins & Arcs
  useEffect(() => {
    if (!pinMarkersGroupRef.current || !arcsGroupRef.current) return;

    while (pinMarkersGroupRef.current.children.length > 0) {
      pinMarkersGroupRef.current.remove(pinMarkersGroupRef.current.children[0]);
    }
    while (arcsGroupRef.current.children.length > 0) {
      arcsGroupRef.current.remove(arcsGroupRef.current.children[0]);
    }

    const points: THREE.Vector3[] = [];

    pins.forEach((pin) => {
      const pos = latLngToVector3(pin.lat, pin.lng, globeRadius + 0.08);
      points.push(pos);

      const isSelected = selectedPin?.id === pin.id;

      // 1. Glowing Pin Sphere Beacon
      const pinGeom = new THREE.SphereGeometry(isSelected ? 0.14 : 0.09, 16, 16);
      const pinMat = new THREE.MeshStandardMaterial({
        color: isSelected ? 0xfde047 : 0xef4444,
        emissive: isSelected ? 0xf59e0b : 0xd97706,
        emissiveIntensity: 0.9,
        roughness: 0.2,
      });
      const pinMesh = new THREE.Mesh(pinGeom, pinMat);
      pinMesh.position.copy(pos);
      pinMesh.userData = { pin };
      pinMarkersGroupRef.current?.add(pinMesh);

      // 2. Pulsing Base Ring & Outer Shockwave
      const ringGeom = new THREE.RingGeometry(0.06, 0.16, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0xfde047 : 0xfbbf24,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isSelected ? 0.95 : 0.75,
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.position.copy(pos.clone().multiplyScalar(1.005));
      ringMesh.lookAt(pos.clone().multiplyScalar(2));
      pinMarkersGroupRef.current?.add(ringMesh);

      if (isSelected) {
        // Outer Shockwave Ripple Ring
        const shockGeom = new THREE.RingGeometry(0.12, 0.38, 32);
        const shockMat = new THREE.MeshBasicMaterial({
          color: 0xfde047,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
        });
        const shockMesh = new THREE.Mesh(shockGeom, shockMat);
        shockMesh.position.copy(pos.clone().multiplyScalar(1.007));
        shockMesh.lookAt(pos.clone().multiplyScalar(2));
        shockMesh.name = 'selected_shockwave_ring';
        pinMarkersGroupRef.current?.add(shockMesh);

        // Vertical Stardust Beam Column
        const beamGeom = new THREE.CylinderGeometry(0.015, 0.06, 0.75, 16);
        const beamMat = new THREE.MeshBasicMaterial({
          color: 0xfde047,
          transparent: true,
          opacity: 0.6,
        });
        const beamMesh = new THREE.Mesh(beamGeom, beamMat);
        beamMesh.position.copy(pos.clone().multiplyScalar(1.12));
        beamMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());
        pinMarkersGroupRef.current?.add(beamMesh);
      }

      // 3. Vertical Light Beam
      const lineGeom = new THREE.BufferGeometry().setFromPoints([
        pos,
        pos.clone().multiplyScalar(1.16)
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: isSelected ? 0xfde047 : 0xf472b6,
        linewidth: 2,
        transparent: true,
        opacity: 0.8,
      });
      const beamLine = new THREE.Line(lineGeom, lineMat);
      pinMarkersGroupRef.current?.add(beamLine);
    });

    // Flight Arcs
    if (points.length > 1) {
      for (let i = 0; i < points.length - 1; i++) {
        const start = points[i];
        const end = points[i + 1];

        const mid = start.clone().add(end).multiplyScalar(0.5);
        const distance = start.distanceTo(end);
        mid.normalize().multiplyScalar(globeRadius + Math.min(distance * 0.4, 2.0));

        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const curvePoints = curve.getPoints(40);
        const curveGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);

        const curveMaterial = new THREE.LineBasicMaterial({
          color: 0xfbbf24,
          transparent: true,
          opacity: 0.85,
        });

        const arcLine = new THREE.Line(curveGeometry, curveMaterial);
        arcsGroupRef.current.add(arcLine);
      }
    }
  }, [pins, selectedPin]);

  // Mouse Wheel Zoom Handler
  const handleWheel = (e: React.WheelEvent) => {
    if (!cameraRef.current) return;
    e.preventDefault();

    const zoomStep = e.deltaY * 0.005;
    const currentZ = targetAnim.current ? targetAnim.current.zoom : cameraRef.current.position.z;

    // Scrolling IN close to Earth surface
    if (e.deltaY < 0 && currentZ <= 3.4 && onAutoSwitchToStreet && globeGroupRef.current) {
      const normY = ((-globeGroupRef.current.rotation.y % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const lat = Number((globeGroupRef.current.rotation.x * (180 / Math.PI)).toFixed(4));
      const lng = Number((((normY - Math.PI) * (180 / Math.PI))).toFixed(4));
      onAutoSwitchToStreet(lat, lng);
      return;
    }

    const newZ = Math.max(minZoomDistance, Math.min(maxZoomDistance, currentZ + zoomStep));

    if (globeGroupRef.current) {
      targetAnim.current = {
        x: globeGroupRef.current.rotation.x,
        y: globeGroupRef.current.rotation.y,
        zoom: newZ,
      };
    }
  };

  // Pointer Rotation Dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    targetAnim.current = null;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !globeGroupRef.current) return;

    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    globeGroupRef.current.rotation.y += deltaX * 0.005;
    globeGroupRef.current.rotation.x += deltaY * 0.005;

    rotationVelocityRef.current = {
      x: deltaX * 0.002,
      y: deltaY * 0.002,
    };

    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Single Click to Raycast Earth or Pin
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rendererRef.current || !cameraRef.current || !globeMeshRef.current) return;

    const rect = mountRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    // 1. Check if 3D Pin clicked
    if (pinMarkersGroupRef.current) {
      const pinIntersects = raycaster.intersectObjects(pinMarkersGroupRef.current.children);
      if (pinIntersects.length > 0) {
        const hitObj = pinIntersects[0].object;
        if (hitObj.userData && hitObj.userData.pin) {
          onSelectPin(hitObj.userData.pin);
          return;
        }
      }
    }

    // 2. Check if Earth Surface clicked
    const intersects = raycaster.intersectObject(globeMeshRef.current);
    if (intersects.length > 0) {
      const hitPoint = intersects[0].point;
      const localHit = globeMeshRef.current.worldToLocal(hitPoint.clone());
      const { lat, lng } = vector3ToLatLng(localHit, globeRadius);

      const latFixed = Number(lat.toFixed(4));
      const lngFixed = Number(lng.toFixed(4));

      // Check if near any World City
      const nearestCity = WORLD_CITIES.find(
        (c) => Math.abs(c.lat - latFixed) < 3.0 && Math.abs(c.lng - lngFixed) < 3.0
      );

      onGlobeClick(latFixed, lngFixed, nearestCity ? `${nearestCity.name}, ${nearestCity.country}` : undefined);
    }
  };

  // Double Click Handler to Fly To & Zoom In on Clicked Location (Google Earth Style)
  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rendererRef.current || !cameraRef.current || !globeMeshRef.current || !globeGroupRef.current) return;

    const rect = mountRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    const intersects = raycaster.intersectObject(globeMeshRef.current);
    if (intersects.length > 0) {
      const hitPoint = intersects[0].point;
      const localHit = globeMeshRef.current.worldToLocal(hitPoint.clone());
      const { lat, lng } = vector3ToLatLng(localHit, globeRadius);

      // Rotate globe to center lat/lng AND zoom in camera close-up!
      const targetX = lat * (Math.PI / 180);
      const rawTargetY = (-90 - lng) * (Math.PI / 180);
      const targetY = unwrapAngle(globeGroupRef.current.rotation.y, rawTargetY);

      targetAnim.current = {
        x: targetX,
        y: targetY,
        zoom: 4.0, // Close Zoom
      };

      onGlobeClick(Number(lat.toFixed(4)), Number(lng.toFixed(4)));
    }
  };

  return (
    <div
      ref={mountRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleCanvasClick}
      onDoubleClick={handleDoubleClick}
      className="w-full h-full min-h-[450px] relative cursor-grab active:cursor-grabbing select-none"
    >
      {/* HTML Projected Memory Pin Badges on Globe */}
      {screenOverlayPins.map(({ pin, x, y, visible }) => {
        if (!visible) return null;
        const isSelected = selectedPin?.id === pin.id;

        return (
          <div
            key={pin.id}
            style={{ left: `${x}px`, top: `${y}px` }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectPin(pin);
            }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-transform duration-200 ${
              isSelected ? 'scale-125 z-30' : 'hover:scale-110'
            }`}
          >
            <div className="relative flex flex-col items-center group">
              <div className="absolute -inset-2 rounded-full bg-red-500/30 animate-ping pointer-events-none" />
              <div className="relative px-2.5 py-1 rounded-full bg-[#120D2B]/95 border-2 border-amber-300 text-white shadow-[0_0_22px_rgba(251,191,36,0.8)] flex items-center gap-1.5 font-bold text-xs whitespace-nowrap">
                <span className="text-sm">📍</span>
                <span className="max-w-[110px] truncate text-[11px] text-amber-200">{pin.title}</span>
              </div>
              <div className="w-2 h-2 bg-[#120D2B] border-r border-b border-amber-300 rotate-45 -mt-1 shadow-md" />
            </div>
          </div>
        );
      })}

      {/* HTML Projected World Cities Badges on Globe */}
      {showWorldCities && screenOverlayCities.map(({ city, x, y, visible }) => {
        if (!visible) return null;

        return (
          <div
            key={city.id}
            style={{ left: `${x}px`, top: `${y}px` }}
            onClick={(e) => {
              e.stopPropagation();
              if (globeGroupRef.current) {
                const targetX = city.lat * (Math.PI / 180);
                const rawTargetY = (-90 - city.lng) * (Math.PI / 180);
                const targetY = unwrapAngle(globeGroupRef.current.rotation.y, rawTargetY);
                targetAnim.current = { x: targetX, y: targetY, zoom: 4.2 };
              }
              onGlobeClick(city.lat, city.lng, `${city.name}, ${city.country}`);
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer hover:scale-110 transition-transform duration-200 opacity-90 hover:opacity-100"
          >
            <div className="px-2 py-0.5 rounded-full bg-purple-950/90 border border-amber-400/60 text-white shadow-md flex items-center gap-1 text-[10px] font-bold whitespace-nowrap">
              <span>{city.flag}</span>
              <span className="text-amber-200">{city.name}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
});
