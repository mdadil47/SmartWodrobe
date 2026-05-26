export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface WardrobeItem {
  id: string;
  userId: string;
  imageUrl: string; // Base64 encoded or simulated file path
  category: 'tops' | 'bottoms' | 'shoes' | 'outerwear' | 'accessories' | 'one-piece';
  type: string; // T-Shirt, Jeans, Sneakers, Jacket, Dress, etc.
  dominantColor: string; // Name (e.g. "Charcoal Grey")
  colorHex: string; // Hex (e.g. "#2c3e50")
  matchingColors: string[]; // List of complementary colors/hexes
  season: 'Summer' | 'Winter' | 'Spring' | 'Fall' | 'All-Season';
  occasion: 'Casual' | 'Formal' | 'Party' | 'Athletic' | 'Business';
  tags: string[];
  createdAt: string;
}

export interface Outfit {
  id: string;
  userId: string;
  name: string;
  items: WardrobeItem[];
  occasion: string;
  weather: string;
  likes: number;
  saved: boolean;
  notes?: string;
  createdAt: string;
}

export interface PlannedOutfit {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  outfitId: string;
  occasion: string;
  notes?: string;
}

export interface WeatherInfo {
  temp: number;
  condition: 'Sunny' | 'Cloudy' | 'Rainy' | 'Snowy' | 'Windy';
  location: string;
}
