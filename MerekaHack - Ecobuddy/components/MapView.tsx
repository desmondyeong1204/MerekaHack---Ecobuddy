
import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, MapPin, ChevronLeft, RefreshCw, Navigation } from 'lucide-react';
import { findNearbyRecycling } from '../services/gemini';
import { EcoPoint } from '../types';
import L from 'leaflet';

interface MapViewProps {
  onBack: () => void;
}

const MapView: React.FC<MapViewProps> = ({ onBack }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [userLoc, setUserLoc] = useState<{ lat: number, lng: number } | null>(null);
  const [points, setPoints] = useState<EcoPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  
  const filters = ['all', 'plastic', 'glass', 'paper', 'e-waste'];

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLoc(loc);
          initMap(loc);
        },
        () => {
          console.warn("Geolocation denied");
          const defaultLoc = { lat: 3.1390, lng: 101.6869 }; // KL default
          setUserLoc(defaultLoc);
          initMap(defaultLoc);
        }
      );
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  const initMap = (center: { lat: number, lng: number }) => {
    if (mapRef.current && !leafletMapRef.current) {
      leafletMapRef.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([center.lat, center.lng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(leafletMapRef.current);

      // User location marker
      const userIcon = L.divIcon({
        className: 'custom-user-icon',
        html: `<div style="width: 20px; height: 20px; background: #3B82F6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      L.marker([center.lat, center.lng], { icon: userIcon, title: "You are here" }).addTo(leafletMapRef.current);
    }
  };

  const clearMarkers = () => {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
  };

  const handleSearchNearby = async () => {
    if (!userLoc || !leafletMapRef.current) return;
    setLoading(true);
    const category = activeFilter === 'all' ? 'general' : activeFilter;
    try {
      const realPoints = await findNearbyRecycling(category, userLoc.lat, userLoc.lng);
      const mappedPoints: EcoPoint[] = realPoints.map((p: any, idx: number) => ({
        id: `real-${idx}`,
        name: p.name,
        address: p.address,
        lat: p.lat,
        lng: p.lng,
        category: (activeFilter === 'all' ? 'plastic' : activeFilter) as any
      }));
      setPoints(mappedPoints);

      clearMarkers();
      const bounds: L.LatLngExpression[] = [[userLoc.lat, userLoc.lng]];

      mappedPoints.forEach(point => {
        const marker = L.marker([point.lat, point.lng], {
          title: point.name
        }).addTo(leafletMapRef.current!);
        
        marker.bindPopup(`<b>${point.name}</b><br>${point.address}`);
        markersRef.current.push(marker);
        bounds.push([point.lat, point.lng]);
      });

      if (mappedPoints.length > 0 && leafletMapRef.current) {
        leafletMapRef.current.fitBounds(L.latLngBounds(bounds), { padding: [50, 50] });
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen relative flex flex-col bg-gray-100 animate-in slide-in-from-right duration-500">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 w-full z-10 p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <button onClick={onBack} className="bg-white p-3 rounded-2xl shadow-lg active:scale-90 border border-gray-100 transition-transform">
            <ChevronLeft size={24} className="text-gray-800" />
          </button>
          <div className="flex-1 bg-white px-4 py-3 rounded-2xl shadow-lg flex items-center space-x-3 border border-gray-100">
            <Search size={20} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Search area..." 
              className="bg-transparent border-none outline-none text-sm w-full font-bold"
            />
          </div>
        </div>

        {/* Filters Scroll */}
        <div className="flex space-x-2 overflow-x-auto pb-2 no-scrollbar">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`whitespace-nowrap px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md transition-all border ${
                activeFilter === f 
                  ? 'bg-green-500 text-white border-green-400' 
                  : 'bg-white text-gray-400 border-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Google Map Container */}
      <div ref={mapRef} className="flex-1 bg-[#E8F5E9]" />

      {/* Action UI */}
      <div className="absolute bottom-32 left-6 right-6 space-y-4">
        <button 
          onClick={handleSearchNearby}
          disabled={loading || !userLoc}
          className="w-full bg-white/90 backdrop-blur-md py-4 rounded-2xl font-black text-gray-800 shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-3 border border-white"
        >
          {loading ? (
            <RefreshCw className="animate-spin text-green-500" size={20} />
          ) : (
            <Navigation className="text-green-500" size={20} />
          )}
          <span>{loading ? 'Finding Centers...' : 'Scan Nearby centers'}</span>
        </button>

        {points.length > 0 && (
          <div className="bg-white p-6 rounded-[35px] shadow-2xl space-y-4 animate-in slide-in-from-bottom-6 duration-500">
            <div className="flex justify-between items-start">
              <div className="max-w-[70%]">
                <h4 className="font-black text-lg text-gray-800 truncate">{points[0].name}</h4>
                <p className="text-gray-400 text-xs font-bold truncate">{points[0].address}</p>
              </div>
              <div className="bg-green-100 text-green-600 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight">
                +100 pts
              </div>
            </div>
            <button className="w-full bg-[#A0E8AF] py-4 rounded-2xl font-black text-green-900 shadow-lg active:scale-95 transition-all border border-green-300">
              Start Navigation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
