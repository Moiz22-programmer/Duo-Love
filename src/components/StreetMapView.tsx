import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapMemoryPin } from './LoveMapScreen';

interface StreetMapViewProps {
  pins: MapMemoryPin[];
  selectedPin: MapMemoryPin | null;
  onSelectPin: (pin: MapMemoryPin) => void;
  centerLat: number;
  centerLng: number;
  zoomLevel?: number;
  onMapClick: (lat: number, lng: number, placeName?: string) => void;
  mapType: 'street' | 'satellite' | 'terrain';
  onZoomOutToGlobe?: () => void;
}

export const StreetMapView: React.FC<StreetMapViewProps> = ({
  pins,
  selectedPin,
  onSelectPin,
  centerLat,
  centerLng,
  zoomLevel = 13,
  onMapClick,
  mapType,
  onZoomOutToGlobe,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const labelOverlayLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        zoomControl: false,
        minZoom: 3,
        maxZoom: 19,
      }).setView([centerLat, centerLng], zoomLevel);

      mapRef.current = map;

      // Listen for zoom out to trigger smooth return to 3D Globe view
      map.on('zoomend', () => {
        const currentZoom = map.getZoom();
        if (currentZoom <= 4 && onZoomOutToGlobe) {
          onZoomOutToGlobe();
        }
      });

      // Handle map clicks to drop pin & reverse geocode real place name
      map.on('click', async (e: L.LeafletMouseEvent) => {
        const lat = Number(e.latlng.lat.toFixed(4));
        const lng = Number(e.latlng.lng.toFixed(4));

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`
          );
          if (response.ok) {
            const data = await response.json();
            const placeName = data.display_name ? data.display_name.split(',').slice(0, 3).join(',') : undefined;
            onMapClick(lat, lng, placeName);
            return;
          }
        } catch {
          // fallback
        }
        onMapClick(lat, lng);
      });

      // Add Zoom control on bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);
    } else {
      mapRef.current.flyTo([centerLat, centerLng], zoomLevel, { animate: true, duration: 1.5 });
    }
  }, [centerLat, centerLng, zoomLevel]);

  // Update Tile Layer & Labels based on mapType
  useEffect(() => {
    if (!mapRef.current) return;

    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }
    if (labelOverlayLayerRef.current) {
      mapRef.current.removeLayer(labelOverlayLayerRef.current);
      labelOverlayLayerRef.current = null;
    }

    let tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    let attribution = '© OpenStreetMap contributors, © CARTO';

    if (mapType === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

      // Add Esri World Boundaries and Places overlay for real city names, country borders & roads on satellite
      const labelOverlay = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, pane: 'markerPane' }
      );
      labelOverlay.addTo(mapRef.current);
      labelOverlayLayerRef.current = labelOverlay;
    } else if (mapType === 'terrain') {
      tileUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      attribution = 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)';
    }

    const newTileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution,
    });

    newTileLayer.addTo(mapRef.current);
    tileLayerRef.current = newTileLayer;
  }, [mapType]);

  // Update Pins
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    pins.forEach((pin) => {
      const isSelected = selectedPin?.id === pin.id;

      // Custom HTML Pin Icon
      const customIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: `
          <div style="
            position: relative;
            transform: translate(-50%, -100%);
            display: flex;
            align-items: center;
            gap: 4px;
            background: rgba(18, 13, 43, 0.95);
            border: 2px solid ${isSelected ? '#fde047' : '#f472b6'};
            padding: 4px 8px;
            border-radius: 20px;
            color: white;
            font-size: 11px;
            font-weight: bold;
            box-shadow: 0 0 15px ${isSelected ? 'rgba(253, 224, 71, 0.8)' : 'rgba(244, 114, 182, 0.5)'};
            white-space: nowrap;
            cursor: pointer;
          ">
            <span>📍</span>
            <span>${pin.title}</span>
          </div>
        `,
        iconSize: [0, 0],
      });

      const marker = L.marker([pin.lat, pin.lng], { icon: customIcon }).addTo(mapRef.current!);
      marker.on('click', () => {
        onSelectPin(pin);
      });

      markersRef.current.push(marker);
    });
  }, [pins, selectedPin]);

  return <div ref={containerRef} className="w-full h-full min-h-[450px] z-10" />;
};
