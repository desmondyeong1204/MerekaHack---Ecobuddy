
import { Map, MapPin, Footprints, Leaf, Recycle, Apple, Zap, User, Trophy, QrCode, Home, ChevronLeft, Heart, Coffee, Sparkles, Smartphone, Search, RefreshCw, X, ArrowLeft, LocateFixed, Lock, Key } from 'lucide-react';

export const COLORS = {
  primary: '#A0E8AF',
  secondary: '#FDFD96',
  highlight: '#B3E5FC',
  background: '#FFFFFF',
  blue: '#03A9F4'
};

export const Icons = {
  Map,
  Pin: MapPin,
  Steps: Footprints,
  Leaf,
  Recycle,
  Apple,
  Zap,
  User,
  Trophy,
  QrCode,
  Home,
  ChevronLeft,
  Heart,
  Coffee,
  Sparkles,
  Smartphone,
  Search,
  RefreshCw,
  X,
  ArrowLeft,
  LocateFixed,
  Lock,
  Key
};

export const MOCK_USER = {
  name: 'Alex Green',
  points: 1250,
  avatar: 'https://picsum.photos/seed/alex/100/100',
  badges: [
    { 
      id: '1', 
      name: 'Plastic Warrior', 
      icon: '🛡️', 
      unlocked: true,
      description: 'Recycle 50 plastic items',
      points: 500
    },
    { 
      id: '2', 
      name: 'Walking Hero', 
      icon: '👟', 
      unlocked: true,
      description: 'Walk 10,000 steps in a single day',
      points: 300
    },
    { 
      id: '3', 
      name: 'Leaf Guardian', 
      icon: '🌿', 
      unlocked: false,
      description: 'Maintain a 7-day streak',
      points: 1000
    },
  ],
};

export const RECYCLING_POINTS = [
  { id: 'p1', category: 'plastic', lat: 40.7128, lng: -74.0060, name: 'Downtown Plastic Center', address: '123 Main St' },
  { id: 'p2', category: 'glass', lat: 40.7150, lng: -74.0100, name: 'Glass Hub', address: '456 River Rd' },
  { id: 'p3', category: 'paper', lat: 40.7200, lng: -73.9900, name: 'Green Paper Mill', address: '789 Park Ave' },
  { id: 'p4', category: 'e-waste', lat: 40.7050, lng: -74.0150, name: 'Tech Recycle Co', address: '101 Silicon St' },
];
