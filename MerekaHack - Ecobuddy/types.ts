
export type TabType = 'home' | 'map' | 'scan' | 'leaderboard' | 'profile' | 'pet' | 'steps' | 'food' | 'merchant' | 'cart' | 'verify' | 'bag-verify';

export interface EcoPoint {
  id: string;
  category: 'plastic' | 'glass' | 'paper' | 'e-waste';
  lat: number;
  lng: number;
  name: string;
  address: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  unlocked: boolean;
  description: string;
  points: number;
  specialPoint?: string;
}

export interface UserStats {
  steps: number;
  distance: number;
  points: number;
  co2Saved: number;
  tripsAvoided: number;
  mealsRescued: number;
  userName: string;
  profileImage: string;
  level: number;
  badges: Badge[];
  hasUsedPlastic?: boolean;
}

export type PetType = 'cat' | 'dog' | 'bird' | 'sprout' | 'capybara';

export interface PetAccessory {
  id: string;
  name: string;
  type: 'food' | 'daily' | 'clothes' | 'furniture';
  price: number;
  icon: string;
  purchased: boolean;
  equipped: boolean;
}

export interface DigitalPet {
  happiness: number;
  name: string;
  level: number;
  type?: PetType;
  accessories: PetAccessory[];
  lastActiveDate: string; // ISO date string
}

export interface FoodItem {
  id: string;
  restaurant: string;
  name: string;
  distance: string;
  originalPrice: number;
  discountedPrice: number;
  category: 'Sushi & Seafood' | 'Bakery' | 'Noodles' | 'General';
  urgency: 'CRITICAL' | 'MEDIUM' | 'LOW';
  co2Saved: number;
}
