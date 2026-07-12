'use client';

import dynamic from 'next/dynamic';

const MapPickerInner = dynamic(() => import('./MapPickerInner'), {
  ssr: false,
  loading: () => <div className="h-full w-full min-h-[300px] bg-gray-100 animate-pulse rounded-md flex items-center justify-center">Loading map...</div>
});

interface MapPickerProps {
  position: { lat: number; lng: number } | null;
  defaultCenter?: { lat: number; lng: number };
  onChange?: (pos: { lat: number; lng: number }) => void;
  readOnly?: boolean;
}

export default function MapPicker(props: MapPickerProps) {
  return <MapPickerInner {...props} />;
}
