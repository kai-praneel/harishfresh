'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

interface MapPickerInnerProps {
  position: { lat: number; lng: number } | null;
  defaultCenter?: { lat: number; lng: number };
  onChange?: ((pos: { lat: number; lng: number }) => void) | null;
  readOnly?: boolean;
}

function LocationMarker({ position, onChange, readOnly }: MapPickerInnerProps) {
  useMapEvents({
    click(e) {
      if (!readOnly && onChange) {
        onChange(e.latlng);
      }
    },
  });

  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker position={position} />
  );
}

export default function MapPickerInner({ position, defaultCenter, onChange, readOnly = false }: MapPickerInnerProps) {
  const fallbackCenter = { lat: 20.5937, lng: 78.9629 }; // Default to India roughly
  const center = position || defaultCenter || fallbackCenter;

  return (
    <MapContainer 
      center={center} 
      zoom={13} 
      scrollWheelZoom={!readOnly} 
      style={{ height: '100%', width: '100%', minHeight: '300px', zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker position={position} onChange={onChange} readOnly={readOnly} />
    </MapContainer>
  );
}
