import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Heart, 
  Sparkles, 
  Plus, 
  Compass, 
  X, 
  Calendar, 
  Wand2, 
  Trash2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Search,
  Globe,
  Loader2,
  Navigation,
  Play,
  CheckCircle2,
  Bookmark,
  Layers,
  Map as MapIcon,
  Sun,
  Moon,
  Mountain
} from 'lucide-react';

import { User, CoupleSpace } from '../types';
import { sounds } from '../lib/audio';
import { SpellAnimationOverlay, SpellEffect } from './SpellAnimationOverlay';
import { Globe3D, Globe3DRef, GlobeMapMode } from './Globe3D';
import { StreetMapView } from './StreetMapView';

export interface MapMemoryPin {
  id: string;
  title: string;
  locationName: string;
  category: 'first_met' | 'first_date' | 'proposal' | 'dream' | 'vacation' | 'secret';
  lat: number;
  lng: number;
  dateStr: string;
  storyNote: string;
  imageUrl?: string;
  createdBy: string;
  createdAt: number;
}

interface Props {
  currentUser: User;
  partner?: User | null;
  coupleSpace?: CoupleSpace | null;
}

const CATEGORIES = [
  { id: 'first_met', label: 'First Met', emoji: '💖', color: 'from-pink-500 to-rose-600', ring: 'ring-pink-400' },
  { id: 'first_date', label: 'First Date', emoji: '🌹', color: 'from-amber-400 to-rose-500', ring: 'ring-amber-300' },
  { id: 'proposal', label: 'Proposal Spot', emoji: '💍', color: 'from-yellow-300 to-amber-500', ring: 'ring-yellow-300' },
  { id: 'dream', label: 'Dream Destination', emoji: '✈️', color: 'from-cyan-400 to-blue-600', ring: 'ring-cyan-300' },
  { id: 'vacation', label: 'Favorite Vacation', emoji: '🏖️', color: 'from-emerald-400 to-teal-600', ring: 'ring-emerald-300' },
  { id: 'secret', label: 'Secret Haven', emoji: '🗝️', color: 'from-purple-500 to-indigo-600', ring: 'ring-purple-300' },
];

const PAKISTAN_CITIES_EXPLORER = [
  { name: 'Islamabad', fullName: 'Islamabad, Pakistan', lat: 33.6844, lng: 73.0479, desc: 'Faisal Mosque & Margalla Hills' },
  { name: 'Lahore', fullName: 'Lahore, Pakistan', lat: 31.5204, lng: 74.3587, desc: 'Badshahi Mosque & Old City' },
  { name: 'Karachi', fullName: 'Karachi, Pakistan', lat: 24.8607, lng: 67.0011, desc: 'Clifton Beach & Arabian Coast' },
  { name: 'Rawalpindi', fullName: 'Rawalpindi, Pakistan', lat: 33.5651, lng: 73.0169, desc: 'Raja Bazaar & Twin City' },
  { name: 'Peshawar', fullName: 'Peshawar, Pakistan', lat: 34.0151, lng: 71.5249, desc: 'Qissa Khwani & Khyber Pass' },
  { name: 'Multan', fullName: 'Multan, Pakistan', lat: 30.1575, lng: 71.5249, desc: 'City of Saints & Shrines' },
  { name: 'Faisalabad', fullName: 'Faisalabad, Pakistan', lat: 31.4504, lng: 73.1350, desc: 'Clock Tower & Textiles' },
  { name: 'Quetta', fullName: 'Quetta, Pakistan', lat: 30.1798, lng: 66.9750, desc: 'Fruit Valley & Hanna Lake' },
  { name: 'Sialkot', fullName: 'Sialkot, Pakistan', lat: 32.4945, lng: 74.5229, desc: 'City of Iqbal & Crafts' },
  { name: 'Gujranwala', fullName: 'Gujranwala, Pakistan', lat: 32.1877, lng: 74.1945, desc: 'City of Pehlwans & Food' },
  { name: 'Hyderabad', fullName: 'Hyderabad, Pakistan', lat: 25.3960, lng: 68.3578, desc: 'Indus River & Pacco Qillo' },
  { name: 'Abbottabad', fullName: 'Abbottabad, Pakistan', lat: 34.1688, lng: 73.2215, desc: 'Pine Valley & Shimla Peak' },
  { name: 'Hunza Valley', fullName: 'Hunza Valley, Pakistan', lat: 36.3167, lng: 74.6500, desc: 'Attabad Lake & Baltit Fort' },
  { name: 'Skardu', fullName: 'Skardu, Pakistan', lat: 35.2971, lng: 75.6333, desc: 'Shangrila & Cold Desert' },
  { name: 'Gilgit', fullName: 'Gilgit, Pakistan', lat: 35.9208, lng: 74.3144, desc: 'Karakoram Highway Hub' },
  { name: 'Murree', fullName: 'Murree, Pakistan', lat: 33.9070, lng: 73.3943, desc: 'Mall Road & Patriata' },
  { name: 'Swat Valley', fullName: 'Swat Valley, Pakistan', lat: 34.7717, lng: 72.3600, desc: 'Mingora & Fizagat Park' },
  { name: 'Gwadar', fullName: 'Gwadar, Pakistan', lat: 25.1264, lng: 62.3225, desc: 'Hammerhead & Sea Port' },
  { name: 'Sukkur', fullName: 'Sukkur, Pakistan', lat: 27.7052, lng: 68.8574, desc: 'Lansdowne Bridge & Indus' },
  { name: 'Bahawalpur', fullName: 'Bahawalpur, Pakistan', lat: 29.3544, lng: 71.6911, desc: 'Noor Mahal & Royal Palaces' },
];

const PRESET_CITIES = [
  { name: 'Pakistan', lat: 30.3753, lng: 69.3451, category: 'vacation', title: 'Land of High Peaks & Warm Hospitality', note: 'Karakoram Highway, Hunza Valley & Rich Heritage.' },
  { name: 'Islamabad, Pakistan', lat: 33.6844, lng: 73.0479, category: 'first_date', title: 'Faisal Mosque & Margalla View', note: 'Sunset coffee overlooking Margalla Hills at Monal.' },
  { name: 'Lahore, Pakistan', lat: 31.5204, lng: 74.3587, category: 'first_met', title: 'Badshahi Mosque & Haveli Sunset', note: 'Magical evening lights in Old City Lahore.' },
  { name: 'Karachi, Pakistan', lat: 24.8607, lng: 67.0011, category: 'vacation', title: 'Clifton Beach & Sea View', note: 'Breezy evening stroll along the Arabian Coast.' },
  { name: 'Rawalpindi, Pakistan', lat: 33.5651, lng: 73.0169, category: 'secret', title: 'Raja Bazaar & Ayub Park', note: 'Bustling markets and vibrant street food.' },
  { name: 'Peshawar, Pakistan', lat: 34.0151, lng: 71.5249, category: 'dream', title: 'Qissa Khwani Bazaar', note: 'Storytellers market & traditional Peshawari kehwa.' },
  { name: 'Hunza Valley, Pakistan', lat: 36.3167, lng: 74.6500, category: 'dream', title: 'Baltit Fort Paradise', note: 'Snowy Karakoram peaks reflected in turquoise Attabad Lake.' },
  { name: 'Kyoto, Japan', lat: 35.0037, lng: 135.7772, category: 'first_met', title: 'Cherry Blossom Promise', note: 'A chance encounter near Kiyomizu-dera during spring sakura bloom.' },
  { name: 'Venice, Italy', lat: 45.4408, lng: 12.3155, category: 'first_date', title: 'Gondola Gelato Date', note: 'Sharing pistachio gelato while drifting down the Grand Canal at sunset.' },
  { name: 'Paris, France', lat: 48.8566, lng: 2.3522, category: 'proposal', title: 'Eiffel Tower Sparkles', note: 'Where we got down on one knee as the Eiffel Tower lit up the midnight sky.' },
  { name: 'Santorini, Greece', lat: 36.3932, lng: 25.4615, category: 'dream', title: 'Oia Aegean Wish', note: 'Watching the famous blue-domed sunset over the Aegean caldera.' },
  { name: 'New York, USA', lat: 40.7128, lng: -74.0060, category: 'secret', title: 'Central Park Autumn Picnic', note: 'Hidden grassy lawn surrounded by glowing yellow maple trees.' },
  { name: 'Maui, Hawaii', lat: 20.7984, lng: -156.3319, category: 'vacation', title: 'Haleakala Sunrise', note: 'Wrapped in a cozy blanket watching the sun break over the sea of clouds.' },
  { name: 'Bali, Indonesia', lat: -8.4095, lng: 115.1889, category: 'dream', title: 'Ubud Waterfall Escape', note: 'Floating through serene jungle infinity pools surrounded by lush greenery.' },
  { name: 'Rome, Italy', lat: 41.9028, lng: 12.4964, category: 'vacation', title: 'Trevi Fountain Wish', note: 'Tossing shiny coins over our shoulders for a lifetime of adventure together.' },
  { name: 'London, UK', lat: 51.5074, lng: -0.1278, category: 'first_date', title: 'Tower Bridge Stroll', note: 'Walking along the Thames with warm hot cocoa late in November.' },
  { name: 'Sydney, Australia', lat: -33.8688, lng: 151.2093, category: 'dream', title: 'Harbour Bridge Lights', note: 'Watching the harbor fireworks reflect off the Opera House sails.' },
  { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503, category: 'vacation', title: 'Shibuya Neon Walk', note: 'Exploring bustling streets under glowing colorful billboards.' },
  { name: 'Cairo, Egypt', lat: 30.0444, lng: 31.2357, category: 'dream', title: 'Giza Pyramids Wish', note: 'Riding camels under golden desert sunsets near ancient wonders.' }
];

const INITIAL_PINS: MapMemoryPin[] = [
  {
    id: 'pin_1',
    title: 'Cherry Blossom Promise',
    locationName: 'Kyoto, Japan',
    category: 'first_met',
    lat: 35.0037,
    lng: 135.7772,
    dateStr: '2023-04-12',
    storyNote: 'The instant our eyes met under falling sakura petals, I knew you were my soulmate.',
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&auto=format&fit=crop&q=80',
    createdBy: 'partner',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 300,
  },
  {
    id: 'pin_2',
    title: 'Gondola Gelato Date',
    locationName: 'Venice, Italy',
    category: 'first_date',
    lat: 45.4408,
    lng: 12.3155,
    dateStr: '2023-06-20',
    storyNote: 'We talked for 5 hours straight along the Grand Canal sharing pistachio gelato.',
    imageUrl: 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=600&auto=format&fit=crop&q=80',
    createdBy: 'user',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 250,
  },
  {
    id: 'pin_3',
    title: 'Eiffel Tower Proposal',
    locationName: 'Paris, France',
    category: 'proposal',
    lat: 48.8566,
    lng: 2.3522,
    dateStr: '2024-10-14',
    storyNote: 'Right as the Eiffel Tower burst into twinkling golden lights, tears of joy fell!',
    imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&auto=format&fit=crop&q=80',
    createdBy: 'partner',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 100,
  },
  {
    id: 'pin_4',
    title: 'Oia Aegean Wish',
    locationName: 'Santorini, Greece',
    category: 'dream',
    lat: 36.3932,
    lng: 25.4615,
    dateStr: '2025-09-01',
    storyNote: 'Our next big romantic journey to watch the Aegean sunset from Oia cliffside.',
    imageUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&auto=format&fit=crop&q=80',
    createdBy: 'user',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
  },
];

export const LoveMapScreen: React.FC<Props> = ({ currentUser, partner, coupleSpace }) => {
  const [pins, setPins] = useState<MapMemoryPin[]>(() => {
    const spaceId = coupleSpace?.id || 'default';
    const stored = localStorage.getItem(`duolove_map_pins_${spaceId}`);
    if (!stored) return INITIAL_PINS;
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) && parsed.length > 0 && parsed[0].lat !== undefined ? parsed : INITIAL_PINS;
    } catch {
      return INITIAL_PINS;
    }
  });

  const [selectedPin, setSelectedPin] = useState<MapMemoryPin | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeSpell, setActiveSpell] = useState<SpellEffect | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [activeToolbarTab, setActiveToolbarTab] = useState<'none' | 'pins' | 'categories' | 'layers' | 'cities'>('pins');

  // Map Mode and View Type
  const [viewType, setViewType] = useState<'3d_globe' | '2d_street'>('3d_globe');
  const [mapMode, setMapMode] = useState<GlobeMapMode>('satellite');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ name: string; lat: number; lng: number }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchedTarget, setSearchedTarget] = useState<{ name: string; lat: number; lng: number } | null>(null);

  // Map Center State & Street Map Zoom
  const [centerLat, setCenterLat] = useState<number>(48.8566);
  const [centerLng, setCenterLng] = useState<number>(2.3522);
  const [streetZoom, setStreetZoom] = useState<number>(15);

  // New Pin form coordinates
  const [formLat, setFormLat] = useState<number>(48.8566);
  const [formLng, setFormLng] = useState<number>(2.3522);
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newCategory, setNewCategory] = useState<MapMemoryPin['category']>('first_date');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newNote, setNewNote] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  // Story Tour mode state
  const [tourIndex, setTourIndex] = useState<number | null>(null);

  // Google Earth specific states
  const [cameraStatus, setCameraStatus] = useState<{ lat: number; lng: number; altitudeKm: number; headingDeg: number }>({
    lat: 33.6844,
    lng: 73.0479,
    altitudeKm: 6371,
    headingDeg: 0,
  });
  const [sunMode, setSunMode] = useState<'day' | 'sunset' | 'night'>('day');
  const [showMeasureDrawer, setShowMeasureDrawer] = useState(false);
  const [measurePointA, setMeasurePointA] = useState<{ lat: number; lng: number; name: string } | null>({
    lat: 33.6844,
    lng: 73.0479,
    name: 'Islamabad, Pakistan',
  });
  const [measurePointB, setMeasurePointB] = useState<{ lat: number; lng: number; name: string } | null>({
    lat: 48.8566,
    lng: 2.3522,
    name: 'Paris, France',
  });
  const [luckyBanner, setLuckyBanner] = useState<string | null>(null);
  const [isLocatingGps, setIsLocatingGps] = useState(false);

  const globeRef = useRef<Globe3DRef | null>(null);

  // I'm Feeling Lucky (Google Earth Dice)
  const handleFeelingLucky = () => {
    const allOptions = [...PRESET_CITIES, ...PAKISTAN_CITIES_EXPLORER];
    const picked = allOptions[Math.floor(Math.random() * allOptions.length)];
    setCenterLat(picked.lat);
    setCenterLng(picked.lng);
    setLuckyBanner(`🎲 Google Earth Voyager: Flying to ${picked.name}!`);

    if (globeRef.current) {
      globeRef.current.flyTo(picked.lat, picked.lng, 3.8);
    }
    sounds.playSpellSound('fireworks');

    setTimeout(() => {
      setLuckyBanner(null);
    }, 4500);
  };

  // GPS My Location
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingGps(false);
        const { latitude, longitude } = pos.coords;
        setCenterLat(latitude);
        setCenterLng(longitude);
        if (globeRef.current) {
          globeRef.current.flyTo(latitude, longitude, 3.8);
        }
        sounds.playSpellSound('default');
      },
      () => {
        setIsLocatingGps(false);
        alert('Unable to retrieve your location.');
      }
    );
  };

  // Smooth Parabolic Arc FlyTo Pin Selection
  const handleSelectPin = (pin: MapMemoryPin) => {
    setSelectedPin(pin);
    setCenterLat(pin.lat);
    setCenterLng(pin.lng);
    sounds.playSpellSound('default');

    setLuckyBanner(`✨ Flying to Memory: ${pin.title}`);
    setTimeout(() => {
      setLuckyBanner((prev) => (prev?.includes(pin.title) ? null : prev));
    }, 3800);

    if (viewType === '3d_globe' && globeRef.current) {
      globeRef.current.flyTo(pin.lat, pin.lng, 3.8);
    } else if (viewType === '2d_street') {
      setStreetZoom(16);
    }
  };

  // Sync pins to local storage
  useEffect(() => {
    localStorage.setItem(`duolove_map_pins_${coupleSpace.id}`, JSON.stringify(pins));
  }, [pins, coupleSpace.id]);

  // Filtered pins
  const filteredPins = useMemo(() => {
    if (filterCategory === 'all') return pins;
    return pins.filter((p) => p.category === filterCategory);
  }, [pins, filterCategory]);

  // Search location handler using OpenStreetMap Nominatim geocoding
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setShowSearchDropdown(true);

      // Filter local preset list first
      const localMatches = PRESET_CITIES.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
      ).map((c) => ({ name: c.name, lat: c.lat, lng: c.lng }));

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(searchQuery)}`
        );
        if (response.ok) {
          const data = await response.json();
          const apiMatches = data.map((item: any) => ({
            name: item.display_name.split(',').slice(0, 3).join(','),
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          }));

          const merged = [...localMatches];
          apiMatches.forEach((apiItem: any) => {
            if (!merged.some((m) => Math.abs(m.lat - apiItem.lat) < 0.1 && Math.abs(m.lng - apiItem.lng) < 0.1)) {
              merged.push(apiItem);
            }
          });

          setSearchResults(merged);
        } else {
          setSearchResults(localMatches);
        }
      } catch (err) {
        setSearchResults(localMatches);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Jump & Zoom into exact City Location (Real Street & Building View)
  const handleJumpToCity = (location: { name: string; lat: number; lng: number }, targetZoom: number = 16) => {
    setSearchedTarget(location);
    setShowSearchDropdown(false);
    setSearchQuery(location.name);
    setCenterLat(location.lat);
    setCenterLng(location.lng);

    // Automatically switch to Street View at high zoom (16+) so real existing buildings and roads are rendered
    setViewType('2d_street');
    setStreetZoom(targetZoom);

    // Rotate 3D Globe as well if active
    if (globeRef.current) {
      globeRef.current.flyTo(location.lat, location.lng, 4.2);
    }

    sounds.playSpellSound('default');
  };

  // Select Search Result location
  const handleSelectSearchResult = (location: { name: string; lat: number; lng: number }) => {
    handleJumpToCity(location, 16);
  };

  // Click on globe surface or city marker to select city or place
  const handleGlobeClick = (lat: number, lng: number, placeName?: string) => {
    const locName = placeName || `Location (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`;
    setCenterLat(lat);
    setCenterLng(lng);

    setSearchedTarget({
      name: locName,
      lat,
      lng,
    });

    // Spin globe to center clicked spot
    if (globeRef.current) {
      globeRef.current.flyTo(lat, lng, 4.2);
    }
  };

  // Pin Memory Submit
  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const createdPin: MapMemoryPin = {
      id: `pin_${Date.now()}`,
      title: newTitle.trim(),
      locationName: newLocation.trim() || 'Special Memory Spot',
      category: newCategory,
      lat: formLat,
      lng: formLng,
      dateStr: newDate,
      storyNote: newNote.trim(),
      imageUrl: newImageUrl.trim() || undefined,
      createdBy: currentUser.uid,
      createdAt: Date.now(),
    };

    setPins((prev) => [...prev, createdPin]);
    setShowAddModal(false);
    setSelectedPin(createdPin);
    setSearchedTarget(null);

    sounds.playSpellSound('fireworks');

    setActiveSpell({
      id: 'fireworks',
      label: 'New Memory Pinned on Globe!',
      emoji: '📍',
      timestamp: Date.now(),
    });

    if (globeRef.current) {
      globeRef.current.flyTo(formLat, formLng, 4.2);
    }
  };

  // Delete Pin
  const handleDeletePin = (pinId: string) => {
    setPins((prev) => prev.filter((p) => p.id !== pinId));
    if (selectedPin?.id === pinId) setSelectedPin(null);
  };

  // Cast Memory Stardust Spell
  const handleCastMemorySpell = (pin: MapMemoryPin) => {
    sounds.playSpellSound('shooting_stars');
    setActiveSpell({
      id: 'shooting_stars',
      label: `Sending ${pin.title} Stardust!`,
      emoji: CATEGORIES.find((c) => c.id === pin.category)?.emoji || '💖',
      timestamp: Date.now(),
    });
  };

  // Reset View
  const handleResetView = () => {
    if (globeRef.current) {
      globeRef.current.resetView();
    }
    setSelectedPin(null);
    setSearchedTarget(null);
    setTourIndex(null);
  };

  // Story Tour step
  const handleNextTourStep = () => {
    if (pins.length === 0) return;

    let nextIndex = 0;
    if (tourIndex !== null) {
      nextIndex = (tourIndex + 1) % pins.length;
    }
    setTourIndex(nextIndex);

    const pin = pins[nextIndex];
    setSelectedPin(pin);
    setCenterLat(pin.lat);
    setCenterLng(pin.lng);

    if (globeRef.current) {
      globeRef.current.flyTo(pin.lat, pin.lng, 4.2);
    }

    sounds.playSpellSound('thinking');
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-[550px] bg-[#0b0914] text-slate-100 relative overflow-hidden select-none">
      
      {/* Top Header & Search Bar (Clean, Spacious, Balanced) */}
      <div className="bg-[#0e0b1c]/95 backdrop-blur-xl px-3 sm:px-5 py-2.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2.5 relative z-30 shadow-xl">
        
        {/* Left: Brand & 3D / Street View Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#f5a623] text-black flex items-center justify-center font-bold shadow-md">
              <Globe className="w-4 h-4 text-[#0b0914]" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-xs font-serif font-bold text-white leading-tight">Love Map</h1>
              <p className="text-[9px] text-slate-400">3D Globe & Street Memories</p>
            </div>
          </div>

          {/* 3D Globe vs 2D Street View Switcher */}
          <div className="bg-black/50 p-0.5 rounded-full border border-white/15 flex items-center gap-0.5 shadow-inner">
            <button
              onClick={() => {
                setViewType('3d_globe');
                sounds.playPopSound();
              }}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                viewType === '3d_globe'
                  ? 'amber-pill-btn text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>3D Globe</span>
            </button>
            <button
              onClick={() => {
                setViewType('2d_street');
                sounds.playPopSound();
              }}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                viewType === '2d_street'
                  ? 'amber-pill-btn text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapIcon className="w-3 h-3" />
              <span>Street Map</span>
            </button>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="relative flex-1 max-w-sm min-w-[170px] order-3 sm:order-2">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-[#f5a623] absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search city or place (e.g. Lahore, Paris)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearchDropdown(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchResults.length > 0) {
                  handleSelectSearchResult(searchResults[0]);
                }
              }}
              className="w-full bg-black/60 border border-white/15 rounded-full pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-400 outline-none focus:border-[#f5a623] focus:ring-1 focus:ring-[#f5a623]/50 transition-all shadow-inner"
            />
            {isSearching ? (
              <Loader2 className="w-3.5 h-3.5 text-[#f5a623] animate-spin absolute right-2.5" />
            ) : searchQuery ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchDropdown(false);
                }}
                className="absolute right-2.5 text-slate-400 hover:text-white cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>

          {/* Search Results Dropdown (Z-50 with shadow & clean border) */}
          <AnimatePresence>
            {showSearchDropdown && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute top-full left-0 right-0 mt-2 bg-[#120e29]/95 border border-amber-500/50 rounded-2xl p-2 shadow-[0_10px_35px_rgba(0,0,0,0.8)] z-50 space-y-1 max-h-60 overflow-y-auto backdrop-blur-xl"
              >
                <div className="flex items-center justify-between px-2 py-1 border-b border-white/10">
                  <span className="text-[10px] font-extrabold text-[#f5a623] uppercase tracking-wider">
                    Select Location
                  </span>
                  <button
                    onClick={() => setShowSearchDropdown(false)}
                    className="text-slate-400 hover:text-white text-[10px]"
                  >
                    Close
                  </button>
                </div>
                {searchResults.map((res, idx) => (
                  <button
                    key={`${res.name}_${idx}`}
                    onClick={() => handleSelectSearchResult(res)}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-between text-xs text-slate-100 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-[#f5a623] shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="truncate font-semibold text-slate-200 group-hover:text-white">{res.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                      {res.lat.toFixed(1)}°, {res.lng.toFixed(1)}°
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Actions (Lucky, Tour, Pin) */}
        <div className="flex items-center gap-2 shrink-0 order-2 sm:order-3">
          <button
            onClick={handleFeelingLucky}
            className="px-2.5 py-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/15 text-amber-300 font-bold text-[11px] flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Fly to a random romantic spot"
          >
            <span>🎲</span>
            <span className="hidden sm:inline">Lucky</span>
          </button>

          <button
            onClick={handleNextTourStep}
            className="bg-white/5 hover:bg-white/15 border border-white/15 text-[#f5a623] text-[11px] px-2.5 py-1.5 rounded-full flex items-center gap-1.5 font-bold transition-all hover:scale-105 cursor-pointer shadow-md"
            title="Start Memory Story Tour"
          >
            <Sparkles className="w-3 h-3 text-[#f5a623] animate-pulse" />
            <span className="hidden sm:inline">{tourIndex === null ? 'Story Tour' : `${tourIndex + 1}/${pins.length}`}</span>
          </button>

          <button
            onClick={() => {
              setFormLat(centerLat);
              setFormLng(centerLng);
              setNewLocation('Paris, France');
              setNewTitle('Romantic Memory');
              setShowAddModal(true);
            }}
            className="amber-pill-btn text-black text-[11px] px-3.5 py-1.5 rounded-full flex items-center gap-1.5 font-bold shadow-md hover:scale-105 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Pin</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Map Canvas (Full Unobstructed View) */}
      <div 
        className="flex-1 w-full h-full min-h-[450px] relative overflow-hidden bg-[#0b0914]"
        onClick={() => {
          // Clicking map closes search dropdown if open
          if (showSearchDropdown) setShowSearchDropdown(false);
        }}
      >
        
        {/* Floating Tool Dock (Sleek, Compact Glass Capsule in Top-Left) */}
        <div className="absolute top-3 left-3 z-20 flex flex-col items-start gap-2 max-w-[90vw]">
          
          {/* Main Capsule Tabs */}
          <div className="flex items-center gap-1 bg-[#100c24]/90 border border-white/15 p-1 rounded-full backdrop-blur-xl shadow-2xl overflow-x-auto no-scrollbar">
            
            {/* Memories Pill */}
            <button
              onClick={() => setActiveToolbarTab(activeToolbarTab === 'pins' ? 'none' : 'pins')}
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeToolbarTab === 'pins'
                  ? 'amber-pill-btn text-black shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#f5a623] shrink-0" />
              <span>Memories ({filteredPins.length})</span>
            </button>

            {/* Filter Category Pill */}
            <button
              onClick={() => setActiveToolbarTab(activeToolbarTab === 'categories' ? 'none' : 'categories')}
              className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                activeToolbarTab === 'categories'
                  ? 'amber-pill-btn text-black shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>🏷️</span>
              <span className="hidden sm:inline">Category</span>
            </button>

            {/* Map Mode Layer Pill */}
            <button
              onClick={() => setActiveToolbarTab(activeToolbarTab === 'layers' ? 'none' : 'layers')}
              className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                activeToolbarTab === 'layers'
                  ? 'amber-pill-btn text-black shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span className="capitalize hidden sm:inline">{mapMode}</span>
            </button>

            {/* Pakistan Cities Pill */}
            <button
              onClick={() => setActiveToolbarTab(activeToolbarTab === 'cities' ? 'none' : 'cities')}
              className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                activeToolbarTab === 'cities'
                  ? 'amber-pill-btn text-black shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>🇵🇰</span>
              <span className="hidden sm:inline">Cities</span>
            </button>

            {/* Distance Measure Tool */}
            <button
              onClick={() => {
                setShowMeasureDrawer((prev) => !prev);
                sounds.playSpellSound('default');
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                showMeasureDrawer
                  ? 'amber-pill-btn text-black shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Navigation className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Measure</span>
            </button>
          </div>

          {/* Active Tool Sub-Drawer (Clean Floating Tray with Close ✕) */}
          <AnimatePresence>
            {activeToolbarTab !== 'none' && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                className="bg-[#120e29]/95 border border-amber-500/30 p-2.5 rounded-2xl shadow-2xl backdrop-blur-xl max-w-lg w-full overflow-hidden"
              >
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10">
                  <span className="text-[11px] font-bold text-[#f5a623] capitalize">
                    {activeToolbarTab === 'pins' && 'Select Pinned Memory'}
                    {activeToolbarTab === 'categories' && 'Filter by Category'}
                    {activeToolbarTab === 'layers' && 'Choose Map View Style'}
                    {activeToolbarTab === 'cities' && 'Explore Pakistan Cities'}
                  </span>
                  <button
                    onClick={() => setActiveToolbarTab('none')}
                    className="p-1 text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 1. Memory Pins Horizontal Carousel */}
                {activeToolbarTab === 'pins' && (
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                    {filteredPins.length === 0 ? (
                      <span className="text-xs text-slate-400 font-medium px-2 py-1">No pins in this category yet.</span>
                    ) : (
                      filteredPins.map((pin) => {
                        const isSelected = selectedPin?.id === pin.id;
                        const catObj = CATEGORIES.find((c) => c.id === pin.category);
                        return (
                          <button
                            key={pin.id}
                            onClick={() => {
                              handleSelectPin(pin);
                              setActiveToolbarTab('none');
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                              isSelected
                                ? 'amber-pill-btn text-black ring-2 ring-[#f5a623] scale-105'
                                : 'bg-black/50 hover:bg-white/15 text-slate-200 border border-white/15'
                            }`}
                          >
                            <span>{catObj?.emoji || '📍'}</span>
                            <span>{pin.title}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}

                {/* 2. Category Filter Pills */}
                {activeToolbarTab === 'categories' && (
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    <button
                      onClick={() => setFilterCategory('all')}
                      className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 cursor-pointer transition-all ${
                        filterCategory === 'all'
                          ? 'amber-pill-btn text-black shadow-md font-bold'
                          : 'bg-black/50 text-slate-300 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      All ({pins.length})
                    </button>
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setFilterCategory(cat.id)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 cursor-pointer transition-all ${
                          filterCategory === cat.id
                            ? 'amber-pill-btn text-black shadow-md font-bold'
                            : 'bg-black/50 text-slate-300 hover:bg-white/10 border border-white/10'
                        }`}
                      >
                        <span>{cat.emoji}</span>
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* 3. Map Layers Selector */}
                {activeToolbarTab === 'layers' && (
                  <div className="grid grid-cols-4 gap-1.5 py-0.5">
                    <button
                      onClick={() => {
                        setMapMode('satellite');
                        setActiveToolbarTab('none');
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        mapMode === 'satellite' ? 'amber-pill-btn text-black shadow-md' : 'bg-black/40 text-slate-300 hover:text-white'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span>Satellite</span>
                    </button>
                    <button
                      onClick={() => {
                        setMapMode('night');
                        setActiveToolbarTab('none');
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        mapMode === 'night' ? 'amber-pill-btn text-black shadow-md' : 'bg-black/40 text-slate-300 hover:text-white'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>Night</span>
                    </button>
                    <button
                      onClick={() => {
                        setMapMode('terrain');
                        setActiveToolbarTab('none');
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        mapMode === 'terrain' ? 'amber-pill-btn text-black shadow-md' : 'bg-black/40 text-slate-300 hover:text-white'
                      }`}
                    >
                      <Mountain className="w-3.5 h-3.5" />
                      <span>Terrain</span>
                    </button>
                    <button
                      onClick={() => {
                        setMapMode('street');
                        setActiveToolbarTab('none');
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        mapMode === 'street' ? 'amber-pill-btn text-black shadow-md' : 'bg-black/40 text-slate-300 hover:text-white'
                      }`}
                    >
                      <MapIcon className="w-3.5 h-3.5" />
                      <span>Atlas</span>
                    </button>
                  </div>
                )}

                {/* 4. Pakistan Cities Explorer */}
                {activeToolbarTab === 'cities' && (
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {PAKISTAN_CITIES_EXPLORER.map((city) => (
                      <button
                        key={city.name}
                        onClick={() => {
                          handleJumpToCity({ name: city.fullName, lat: city.lat, lng: city.lng }, 16);
                          setActiveToolbarTab('none');
                        }}
                        className="px-3 py-1.5 rounded-full text-xs font-bold shrink-0 bg-black/50 hover:bg-white/15 text-amber-200 border border-white/15 hover:border-[#f5a623] cursor-pointer"
                      >
                        📍 {city.name}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {viewType === '3d_globe' ? (
          <Globe3D
            ref={globeRef}
            pins={filteredPins}
            selectedPin={selectedPin}
            onSelectPin={handleSelectPin}
            onGlobeClick={handleGlobeClick}
            autoRotate={autoRotate}
            mapMode={mapMode}
            sunMode={sunMode}
            onUpdateCameraStatus={(status) => {
              setCameraStatus(status);
            }}
            measurePoints={
              measurePointA && measurePointB
                ? [
                    { lat: measurePointA.lat, lng: measurePointA.lng },
                    { lat: measurePointB.lat, lng: measurePointB.lng },
                  ]
                : []
            }
            onAutoSwitchToStreet={(lat, lng) => {
              setCenterLat(lat);
              setCenterLng(lng);
              setStreetZoom(15);
              setViewType('2d_street');
              sounds.playSpellSound('default');
            }}
          />
        ) : (
          <StreetMapView
            pins={filteredPins}
            selectedPin={selectedPin}
            onSelectPin={handleSelectPin}
            centerLat={centerLat}
            centerLng={centerLng}
            zoomLevel={streetZoom}
            onMapClick={handleGlobeClick}
            mapType={mapMode === 'satellite' ? 'satellite' : mapMode === 'terrain' ? 'terrain' : 'street'}
            onZoomOutToGlobe={() => {
              setViewType('3d_globe');
              sounds.playSpellSound('default');
            }}
          />
        )}

        {/* Lucky Banner Floating Toast */}
        <AnimatePresence>
          {luckyBanner && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 amber-pill-btn text-black font-black text-xs px-5 py-2.5 rounded-full shadow-2xl z-30 flex items-center gap-2 border border-amber-300"
            >
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>{luckyBanner}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected Real World Location Card (Top Right, Clean & Compact) */}
        <AnimatePresence>
          {searchedTarget && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="absolute top-3 right-3 bg-[#120e29]/95 border border-amber-500/40 rounded-3xl p-3.5 shadow-[0_10px_35px_rgba(0,0,0,0.7)] backdrop-blur-xl z-20 max-w-xs w-full flex flex-col gap-2.5"
            >
              <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold text-[#f5a623] uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#f5a623] shrink-0" />
                    <span>Selected Location</span>
                  </span>
                  <p className="text-xs font-bold text-white truncate">{searchedTarget.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {searchedTarget.lat.toFixed(4)}°, {searchedTarget.lng.toFixed(4)}°
                  </p>
                </div>

                <button
                  onClick={() => setSearchedTarget(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCenterLat(searchedTarget.lat);
                    setCenterLng(searchedTarget.lng);
                    setStreetZoom(16);
                    setViewType('2d_street');
                    sounds.playSpellSound('default');
                  }}
                  className="flex-1 amber-pill-btn text-black text-xs py-1.5 px-3 rounded-full font-bold flex items-center justify-center gap-1 shadow-md hover:scale-105 cursor-pointer transition-transform"
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>View Street</span>
                </button>

                <button
                  onClick={() => {
                    setFormLat(searchedTarget.lat);
                    setFormLng(searchedTarget.lng);
                    setNewLocation(searchedTarget.name);
                    setNewTitle(`Memory in ${searchedTarget.name.split(',')[0]}`);
                    setShowAddModal(true);
                  }}
                  className="flex-1 bg-white/5 hover:bg-white/15 border border-white/15 text-white text-xs py-1.5 px-3 rounded-full font-bold flex items-center justify-center gap-1 shadow-md hover:scale-105 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Pin Memory</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Measure Distance Drawer (Left Side) */}
        <AnimatePresence>
          {showMeasureDrawer && (
            <motion.div
              initial={{ opacity: 0, x: -300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -300 }}
              className="absolute top-16 left-3 z-30 bg-[#120e29]/95 border border-amber-500/50 rounded-3xl p-4 shadow-[0_10px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl max-w-xs w-full space-y-3"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-serif font-bold text-[#f5a623] flex items-center gap-1.5 uppercase tracking-wider">
                  <Navigation className="w-4 h-4 text-[#f5a623]" />
                  Measure Air Distance
                </span>
                <button
                  onClick={() => setShowMeasureDrawer(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Point A */}
              <div className="bg-black/40 p-2.5 rounded-2xl border border-white/10 space-y-1">
                <span className="text-[10px] font-bold text-[#f5a623] uppercase">Start Point A</span>
                <p className="text-xs font-bold text-white truncate">{measurePointA?.name || 'Pick Point A'}</p>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                  <span>{measurePointA?.lat.toFixed(2)}°, {measurePointA?.lng.toFixed(2)}°</span>
                  <button
                    onClick={() => {
                      setMeasurePointA({ lat: cameraStatus.lat, lng: cameraStatus.lng, name: 'Center View Spot' });
                    }}
                    className="ml-auto text-[#f5a623] hover:underline font-semibold cursor-pointer"
                  >
                    Use Center
                  </button>
                </div>
              </div>

              {/* Point B */}
              <div className="bg-black/40 p-2.5 rounded-2xl border border-white/10 space-y-1">
                <span className="text-[10px] font-bold text-amber-200 uppercase">Destination Point B</span>
                <p className="text-xs font-bold text-white truncate">{measurePointB?.name || 'Pick Point B'}</p>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                  <span>{measurePointB?.lat.toFixed(2)}°, {measurePointB?.lng.toFixed(2)}°</span>
                  <button
                    onClick={() => {
                      setMeasurePointB({ lat: cameraStatus.lat, lng: cameraStatus.lng, name: 'Center View Spot' });
                    }}
                    className="ml-auto text-[#f5a623] hover:underline font-semibold cursor-pointer"
                  >
                    Use Center
                  </button>
                </div>
              </div>

              {/* Calculated Distance */}
              {measurePointA && measurePointB && (
                <div className="bg-gradient-to-tr from-[#f5a623]/20 to-black/60 p-3 rounded-2xl border border-[#f5a623]/40 text-center space-y-1">
                  <span className="text-[10px] font-black text-[#f5a623] uppercase tracking-wider">Flight Distance</span>
                  <p className="text-lg font-serif font-bold text-white">
                    {(() => {
                      const R = 6371;
                      const dLat = (measurePointB.lat - measurePointA.lat) * (Math.PI / 180);
                      const dLon = (measurePointB.lng - measurePointA.lng) * (Math.PI / 180);
                      const a =
                        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(measurePointA.lat * (Math.PI / 180)) * Math.cos(measurePointB.lat * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
                      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                      const km = Math.round(R * c);
                      const miles = Math.round(km * 0.621371);
                      return `${km.toLocaleString()} km (${miles.toLocaleString()} mi)`;
                    })()}
                  </p>
                  <p className="text-[11px] text-slate-300 font-semibold flex items-center justify-center gap-1">
                    <span>✈️ Flight Time:</span>
                    <span className="text-[#f5a623] font-extrabold">
                      ~{(() => {
                        const R = 6371;
                        const dLat = (measurePointB.lat - measurePointA.lat) * (Math.PI / 180);
                        const dLon = (measurePointB.lng - measurePointA.lng) * (Math.PI / 180);
                        const a =
                          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                          Math.cos(measurePointA.lat * (Math.PI / 180)) * Math.cos(measurePointB.lat * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
                        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                        const km = R * c;
                        return (km / 850).toFixed(1);
                      })()} hrs
                    </span>
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Zoom & Orientation Controls (Clean Bottom Right Stack) */}
        <div className="absolute bottom-10 right-4 z-20 flex flex-col gap-2">
          <button
            onClick={() => {
              if (viewType === '3d_globe') {
                globeRef.current?.zoomIn();
              } else {
                setStreetZoom((prev) => Math.min(19, prev + 1));
              }
            }}
            className="w-9 h-9 rounded-full bg-[#120e29]/90 border border-amber-500/50 hover:bg-amber-500/20 text-[#f5a623] flex items-center justify-center font-bold shadow-xl backdrop-blur-md cursor-pointer transition-transform hover:scale-110 active:scale-95"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (viewType === '3d_globe') {
                globeRef.current?.zoomOut();
              } else {
                if (streetZoom <= 5) {
                  setViewType('3d_globe');
                  sounds.playSpellSound('default');
                } else {
                  setStreetZoom((prev) => Math.max(3, prev - 1));
                }
              }
            }}
            className="w-9 h-9 rounded-full bg-[#120e29]/90 border border-amber-500/50 hover:bg-amber-500/20 text-[#f5a623] flex items-center justify-center font-bold shadow-xl backdrop-blur-md cursor-pointer transition-transform hover:scale-110 active:scale-95"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={handleResetView}
            className="w-9 h-9 rounded-full bg-[#120e29]/90 border border-white/20 hover:bg-white/15 text-slate-200 flex items-center justify-center font-bold shadow-xl backdrop-blur-md cursor-pointer transition-transform hover:scale-110 active:scale-95"
            title="Reset Globe View"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>

        {/* Realtime Telemetry Bottom Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#0e0b1c]/90 border-t border-white/10 px-4 py-1.5 z-20 flex flex-wrap items-center justify-between text-[10px] text-slate-400 font-mono backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-200 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span>
                {cameraStatus.lat >= 0 ? `${cameraStatus.lat.toFixed(3)}° N` : `${Math.abs(cameraStatus.lat).toFixed(3)}° S`},{' '}
                {cameraStatus.lng >= 0 ? `${cameraStatus.lng.toFixed(3)}° E` : `${Math.abs(cameraStatus.lng).toFixed(3)}° W`}
              </span>
            </span>

            <span className="text-[#f5a623] hidden sm:inline">
              Alt: {cameraStatus.altitudeKm > 10 ? `${cameraStatus.altitudeKm.toLocaleString()} km` : `${Math.round(cameraStatus.altitudeKm * 1000)} m`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[#f5a623] font-bold bg-[#f5a623]/10 px-2 py-0.5 rounded-full border border-[#f5a623]/30">
              Celestial Map Engine
            </span>
          </div>
        </div>
      </div>

      {/* Selected Memory Pin Bottom Drawer Modal */}
      <AnimatePresence>
        {selectedPin && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            className="absolute bottom-6 left-4 right-4 sm:left-auto sm:right-16 sm:w-96 bg-[#120e29]/95 border border-amber-500/60 rounded-3xl p-4 shadow-[0_10px_45px_rgba(0,0,0,0.8)] backdrop-blur-xl z-30 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#f5a623] text-black flex items-center justify-center text-xl font-bold shadow-md shrink-0">
                  {CATEGORIES.find((c) => c.id === selectedPin.category)?.emoji || '📍'}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#f5a623] tracking-wider">
                    {CATEGORIES.find((c) => c.id === selectedPin.category)?.label}
                  </span>
                  <h3 className="text-base font-serif font-bold text-white leading-tight">{selectedPin.title}</h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedPin(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo preview if present */}
            {selectedPin.imageUrl && (
              <div className="relative rounded-2xl overflow-hidden border border-white/10 h-36 group">
                <img src={selectedPin.imageUrl} alt={selectedPin.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <span className="absolute bottom-2 left-3 text-xs font-bold text-amber-200 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#f5a623]" />
                  {selectedPin.locationName}
                </span>
              </div>
            )}

            {/* Date & Location text */}
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#f5a623]" />
                {selectedPin.locationName}
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-[#f5a623]" />
                {selectedPin.dateStr}
              </span>
            </div>

            {/* Memory Story note */}
            {selectedPin.storyNote && (
              <p className="text-xs leading-relaxed text-slate-200 bg-black/40 p-3 rounded-2xl border border-white/10 italic">
                "{selectedPin.storyNote}"
              </p>
            )}

            {/* Navigation & Action buttons */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (viewType === '3d_globe' && globeRef.current) {
                      globeRef.current.flyTo(selectedPin.lat, selectedPin.lng, 3.5);
                    } else {
                      setCenterLat(selectedPin.lat);
                      setCenterLng(selectedPin.lng);
                      setStreetZoom(16);
                      setViewType('2d_street');
                    }
                    sounds.playSpellSound('default');
                  }}
                  className="flex-1 amber-pill-btn text-black font-bold text-xs py-1.5 px-3 rounded-full flex items-center justify-center gap-1 shadow-md hover:scale-105 transition-transform cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Swoop Fly-To</span>
                </button>

                <button
                  onClick={() => {
                    setCenterLat(selectedPin.lat);
                    setCenterLng(selectedPin.lng);
                    setStreetZoom(16);
                    setViewType('2d_street');
                    sounds.playSpellSound('default');
                  }}
                  className="flex-1 bg-white/5 hover:bg-white/15 text-white border border-white/15 font-bold text-xs py-1.5 px-3 rounded-full flex items-center justify-center gap-1 shadow-md hover:scale-105 transition-transform cursor-pointer"
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>Street Level</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => handleCastMemorySpell(selectedPin)}
                  className="flex-1 amber-pill-btn text-black text-xs py-2 rounded-full font-bold flex items-center justify-center gap-1.5 shadow-md hover:scale-105 cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Cast Stardust Spell</span>
                </button>

                <button
                  onClick={() => handleDeletePin(selectedPin.id)}
                  className="p-2 rounded-full bg-rose-950/60 text-rose-300 hover:bg-rose-900 border border-rose-800/50 cursor-pointer"
                  title="Remove Pin"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add New Memory Pin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="cosmic-card border border-[#f5a623]/60 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#f5a623]" />
                  Pin Memory on Love Globe
                </h2>
                <p className="text-xs text-slate-400">Coordinates: {formLat.toFixed(2)}°, {formLng.toFixed(2)}°</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Famous Cities Preset Picker */}
            <div>
              <label className="block text-xs font-bold text-[#f5a623] mb-1.5">Quick Pick Romantic Spot:</label>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
                {PRESET_CITIES.map((city) => (
                  <button
                    key={city.name}
                    type="button"
                    onClick={() => {
                      setFormLat(city.lat);
                      setFormLng(city.lng);
                      setNewLocation(city.name);
                      setNewCategory(city.category as MapMemoryPin['category']);
                      setNewTitle(city.title);
                      setNewNote(city.note);
                    }}
                    className="px-2.5 py-1 rounded-full bg-black/40 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-slate-300 shrink-0 cursor-pointer transition-all hover:scale-105"
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSavePin} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Memory Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Moonlight Proposal at Sunset"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-[#f5a623]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">City / Location Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paris, France"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-[#f5a623]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNewCategory(cat.id as MapMemoryPin['category'])}
                      className={`p-2 rounded-2xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                        newCategory === cat.id
                          ? 'amber-pill-btn text-black border-[#f5a623] font-bold shadow-md'
                          : 'bg-black/40 text-slate-300 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-3.5 py-2 text-sm text-slate-100 outline-none focus:border-[#f5a623]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Story Note</label>
                <textarea
                  rows={2}
                  placeholder="What made this moment unforgettable?"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-[#f5a623]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Photo Image URL (optional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-[#f5a623]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="amber-pill-btn text-black text-xs px-5 py-2 rounded-full font-bold shadow-md hover:scale-105 cursor-pointer"
                >
                  Save Globe Pin
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Spell Animation Overlay */}
      <SpellAnimationOverlay spell={activeSpell} onComplete={() => setActiveSpell(null)} />
    </div>
  );
};
