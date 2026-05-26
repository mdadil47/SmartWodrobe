import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User, WardrobeItem, Outfit, PlannedOutfit } from '../src/types';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

interface DBStructure {
  users: (User & { passwordHash: string })[];
  wardrobe: WardrobeItem[];
  outfits: Outfit[];
  planner: PlannedOutfit[];
}

const INITIAL_DB: DBStructure = {
  users: [],
  wardrobe: [],
  outfits: [],
  planner: []
};

// Helper to read DB
export function readDB(): DBStructure {
  try {
    if (!fs.existsSync(DB_FILE)) {
      writeDB(INITIAL_DB);
      return INITIAL_DB;
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data) as DBStructure;
  } catch (err) {
    console.error('Error reading file-based database. Resetting...', err);
    writeDB(INITIAL_DB);
    return INITIAL_DB;
  }
}

// Helper to write DB
export function writeDB(data: DBStructure): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing to database file:', err);
  }
}

// SHA256 hashing for secure passwords
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// --- USER OPERATIONS ---
export function getUserByEmail(email: string) {
  const db = readDB();
  return db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function getUserById(id: string) {
  const db = readDB();
  const found = db.users.find(u => u.id === id);
  if (!found) return undefined;
  const { passwordHash, ...user } = found;
  return user;
}

export function createUser(email: string, name: string, passwordPlain: string): User {
  const db = readDB();
  const formattedEmail = email.toLowerCase();
  
  if (db.users.some(u => u.email === formattedEmail)) {
    throw new Error('User with this email already exists');
  }

  const newUser = {
    id: crypto.randomUUID(),
    email: formattedEmail,
    name,
    createdAt: new Date().toISOString(),
    passwordHash: hashPassword(passwordPlain)
  };

  db.users.push(newUser);
  writeDB(db);

  const { passwordHash, ...userResponse } = newUser;
  return userResponse;
}

// --- WARDROBE OPERATIONS ---
export function getUserWardrobe(userId: string): WardrobeItem[] {
  const db = readDB();
  return db.wardrobe.filter(item => item.userId === userId);
}

export function addWardrobeItem(userId: string, item: Omit<WardrobeItem, 'id' | 'userId' | 'createdAt'>): WardrobeItem {
  const db = readDB();
  const newItem: WardrobeItem = {
    ...item,
    id: crypto.randomUUID(),
    userId,
    createdAt: new Date().toISOString()
  };

  db.wardrobe.push(newItem);
  writeDB(db);
  return newItem;
}

export function deleteWardrobeItem(userId: string, itemId: string): boolean {
  const db = readDB();
  const initialLength = db.wardrobe.length;
  db.wardrobe = db.wardrobe.filter(item => !(item.id === itemId && item.userId === userId));
  
  // Also delete from saved outfits referencing it
  db.outfits = db.outfits.map(outfit => {
    if (outfit.userId === userId) {
      return {
        ...outfit,
        items: outfit.items.filter(item => item.id !== itemId)
      };
    }
    return outfit;
  }).filter(outfit => outfit.items.length > 0); // Keep outfit only if it still has items

  const deleted = db.wardrobe.length < initialLength;
  if (deleted) {
    writeDB(db);
  }
  return deleted;
}

export function updateWardrobeItem(userId: string, itemId: string, updates: Partial<Omit<WardrobeItem, 'id' | 'userId' | 'createdAt'>>): WardrobeItem | null {
  const db = readDB();
  const index = db.wardrobe.findIndex(item => item.id === itemId && item.userId === userId);
  if (index === -1) return null;

  db.wardrobe[index] = {
    ...db.wardrobe[index],
    ...updates
  };
  writeDB(db);
  return db.wardrobe[index];
}

// --- OUTFIT OPERATIONS ---
export function getUserOutfits(userId: string): Outfit[] {
  const db = readDB();
  return db.outfits.filter(o => o.userId === userId);
}

export function saveUserOutfit(userId: string, outfit: Omit<Outfit, 'id' | 'userId' | 'createdAt'>): Outfit {
  const db = readDB();
  const newOutfit: Outfit = {
    ...outfit,
    id: crypto.randomUUID(),
    userId,
    createdAt: new Date().toISOString()
  };

  db.outfits.push(newOutfit);
  writeDB(db);
  return newOutfit;
}

export function deleteUserOutfit(userId: string, outfitId: string): boolean {
  const db = readDB();
  const initialLength = db.outfits.length;
  db.outfits = db.outfits.filter(o => !(o.id === outfitId && o.userId === userId));
  
  // Also clean up planner entries pointing to this outfit
  db.planner = db.planner.filter(p => !(p.outfitId === outfitId && p.userId === userId));

  const deleted = db.outfits.length < initialLength;
  if (deleted) {
    writeDB(db);
  }
  return deleted;
}

// --- PLANNER OPERATIONS ---
export function getUserPlanner(userId: string): PlannedOutfit[] {
  const db = readDB();
  return db.planner.filter(p => p.userId === userId);
}

export function planUserOutfit(userId: string, plan: { date: string; outfitId: string; occasion: string; notes?: string }): PlannedOutfit {
  const db = readDB();
  
  // Delete existing plan for that specific date and user to avoid duplicate plans
  db.planner = db.planner.filter(p => !(p.userId === userId && p.date === plan.date));

  const newPlan: PlannedOutfit = {
    id: crypto.randomUUID(),
    userId,
    ...plan
  };

  db.planner.push(newPlan);
  writeDB(db);
  return newPlan;
}

export function deleteUserPlan(userId: string, planId: string): boolean {
  const db = readDB();
  const initialLength = db.planner.length;
  db.planner = db.planner.filter(p => !(p.id === planId && p.userId === userId));

  const deleted = db.planner.length < initialLength;
  if (deleted) {
    writeDB(db);
  }
  return deleted;
}

// Add some smart seed data if the database is brand new and empty for a default user to check things instantly
export function seedMockDatabaseForUser(userId: string) {
  const db = readDB();
  // Check if they already have items
  const userItems = db.wardrobe.filter(item => item.userId === userId);
  if (userItems.length > 0) return;

  const sampleItems: Omit<WardrobeItem, 'id' | 'userId' | 'createdAt'>[] = [
    {
      imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80",
      category: "tops",
      type: "Classic Cotton T-Shirt",
      dominantColor: "Crisp White",
      colorHex: "#ffffff",
      matchingColors: ["Charcoal", "Indigo", "Olive", "Navy"],
      season: "Summer",
      occasion: "Casual",
      tags: ["basic", "cotton", "lightweight"]
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80",
      category: "bottoms",
      type: "Slim-Fit Denim Jeans",
      dominantColor: "Indigo Blue",
      colorHex: "#1e3a8a",
      matchingColors: ["White", "Black", "Grey", "Camel"],
      season: "All-Season",
      occasion: "Casual",
      tags: ["denim", "relaxed", "classic"]
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&q=80",
      category: "outerwear",
      type: "Biker Leather Jacket",
      dominantColor: "Midnight Black",
      colorHex: "#111827",
      matchingColors: ["White", "Red", "Grey", "Beige"],
      season: "Fall",
      occasion: "Party",
      tags: ["leather", "edgy", "warm"]
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&q=80",
      category: "shoes",
      type: "Retro Leather Sneakers",
      dominantColor: "White & Gum",
      colorHex: "#fafafa",
      matchingColors: ["Blue", "Black", "Grey", "Green"],
      season: "All-Season",
      occasion: "Casual",
      tags: ["retro", "leather", "comfortable"]
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500&q=80",
      category: "tops",
      type: "Premium Linen Button-Up Shirt",
      dominantColor: "Sand Beige",
      colorHex: "#f5f5dc",
      matchingColors: ["White", "Navy Blue", "Olive Green"],
      season: "Spring",
      occasion: "Business",
      tags: ["linen", "breezy", "neutral"]
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&q=80",
      category: "outerwear",
      type: "Tailored Double-Breasted Trench Coat",
      dominantColor: "Camel Tan",
      colorHex: "#d2b48c",
      matchingColors: ["Black", "Cream", "Navy", "Burnt Orange"],
      season: "Winter",
      occasion: "Formal",
      tags: ["elegant", "tailored", "wool"]
    }
  ];

  sampleItems.forEach(item => {
    addWardrobeItem(userId, item);
  });
}
