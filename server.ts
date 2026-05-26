import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import {
  getUserByEmail,
  getUserById,
  createUser,
  hashPassword,
  getUserWardrobe,
  addWardrobeItem,
  deleteWardrobeItem,
  updateWardrobeItem,
  getUserOutfits,
  saveUserOutfit,
  deleteUserOutfit,
  getUserPlanner,
  planUserOutfit,
  deleteUserPlan,
  seedMockDatabaseForUser
} from './server/db';
import { analyzeClothingImage, generateOutfitSuggestions } from './server/gemini';
import { WardrobeItem } from './src/types';

// JWT Signed Token Secret
const JWT_SECRET = process.env.JWT_SECRET || 'smartwardrobe_jwt_super_signature_salt_key_840131494801';

// Sign token with user payload
function signJWT(payload: { id: string; email: string; name: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  // Token valid for 7 days
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

// Verify token and parse payload
function verifyJWT(token: string): { id: string; email: string; name: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    
    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSignature) return null;
    
    const decodedBody = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (decodedBody.exp && decodedBody.exp < Date.now()) {
      return null; // Expired
    }
    return { id: decodedBody.id, email: decodedBody.email, name: decodedBody.name };
  } catch {
    return null;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing requests (increased limits to handle large clothes images)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Custom Authentication Middleware
  const authenticateUser = (req: any, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication token is required.' });
    }
    
    const token = authHeader.split(' ')[1];
    const user = verifyJWT(token);
    if (!user) {
      return res.status(401).json({ error: 'Session expired or invalid token. Please login again.' });
    }
    
    req.user = user;
    next();
  };

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Auth - Register
  app.post('/api/auth/register', (req, res) => {
    try {
      const { email, name, password } = req.body;
      if (!email || !name || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
      }

      const existingUser = getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'A user with this email already exists.' });
      }

      const newUser = createUser(email, name, password);
      
      // Auto-seed mock wardrobe items so the user gets immediate style capabilities!
      try {
        seedMockDatabaseForUser(newUser.id);
      } catch (seedError) {
        console.error('Non-blocking sample seeding failed:', seedError);
      }

      const token = signJWT({ id: newUser.id, email: newUser.email, name: newUser.name });
      res.status(201).json({ user: newUser, token });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error executing registration.' });
    }
  });

  // Auth - Login
  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const userRecord = getUserByEmail(email);
      if (!userRecord) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const inputHash = hashPassword(password);
      if (userRecord.passwordHash !== inputHash) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // Seed clothing if database was empty (fallback safety)
      seedMockDatabaseForUser(userRecord.id);

      const token = signJWT({ id: userRecord.id, email: userRecord.email, name: userRecord.name });
      res.json({
        user: {
          id: userRecord.id,
          email: userRecord.email,
          name: userRecord.name,
          createdAt: userRecord.createdAt
        },
        token
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error executing login.' });
    }
  });

  // Auth - Get current user profile
  app.get('/api/auth/me', authenticateUser, (req: any, res) => {
    const user = getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User profiles could not be retrieved.' });
    }
    res.json({ user });
  });

  // Wardrobe - Get overall items list
  app.get('/api/wardrobe', authenticateUser, (req: any, res) => {
    try {
      const items = getUserWardrobe(req.user.id);
      res.json({ items });
    } catch (err) {
      res.status(500).json({ error: 'Error fetching wardrobe items.' });
    }
  });

  // Wardrobe - Upload & Analyze new item via Gemini AI
  app.post('/api/wardrobe/upload', authenticateUser, async (req: any, res) => {
    try {
      const { base64Data, mimeType } = req.body;
      if (!base64Data) {
        return res.status(400).json({ error: 'Apparel image base64 field is required.' });
      }

      const resolvedMime = mimeType || 'image/jpeg';
      
      // Use Gemini to perform rich clothing color and type analysis
      const aiResponse = await analyzeClothingImage(base64Data, resolvedMime);

      // Save item to DB
      const dbWardrobeItem = {
        imageUrl: base64Data, // Save image locally directly to database
        category: aiResponse.category || 'tops',
        type: aiResponse.type || 'Polished Clothing Item',
        dominantColor: aiResponse.dominantColor || 'Custom Shade',
        colorHex: aiResponse.colorHex || '#A0A0A0',
        matchingColors: aiResponse.matchingColors || ['White', 'Black'],
        season: aiResponse.season || 'All-Season',
        occasion: aiResponse.occasion || 'Casual',
        tags: aiResponse.tags || ['smart', 'apparel']
      };

      const added = addWardrobeItem(req.user.id, dbWardrobeItem);
      res.status(201).json({ item: added, queryAnalyzed: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error processing AI image upload.' });
    }
  });

  // Wardrobe - Manually log a clothing item (No AI route)
  app.post('/api/wardrobe/manual', authenticateUser, (req: any, res) => {
    try {
      const { imageUrl, category, type, dominantColor, colorHex, matchingColors, season, occasion, tags } = req.body;
      if (!imageUrl || !category || !type) {
        return res.status(400).json({ error: 'Image, category, and specific type are required.' });
      }

      const payload = {
        imageUrl,
        category,
        type,
        dominantColor: dominantColor || 'Apparel Shade',
        colorHex: colorHex || '#718096',
        matchingColors: matchingColors || ['#ffffff', '#000000'],
        season: season || 'All-Season',
        occasion: occasion || 'Casual',
        tags: tags || ['wardrobe']
      };

      const added = addWardrobeItem(req.user.id, payload);
      res.status(201).json({ item: added, manualCreated: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error executing manual item add.' });
    }
  });

  // Wardrobe - Delete item
  app.delete('/api/wardrobe/:id', authenticateUser, (req: any, res) => {
    try {
      const deleted = deleteWardrobeItem(req.user.id, req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Clothing item not found.' });
      }
      res.json({ message: 'Garment successfully removed from SmartWardrobe.' });
    } catch (err) {
      res.status(500).json({ error: 'Error deleting wardrobe item.' });
    }
  });

  // Wardrobe - Manual Seed request (Add nice samples manually in UI)
  app.post('/api/wardrobe/seed', authenticateUser, (req: any, res) => {
    try {
      seedMockDatabaseForUser(req.user.id);
      const items = getUserWardrobe(req.user.id);
      res.json({ items, message: 'Sample wardrobe seed data successfully written.' });
    } catch (err) {
      res.status(500).json({ error: 'Error seeding demo wardrobe data' });
    }
  });

  // Outfits - Fetch saved favorite outfits list
  app.get('/api/outfits', authenticateUser, (req: any, res) => {
    try {
      const savedOutfits = getUserOutfits(req.user.id);
      res.json({ outfits: savedOutfits });
    } catch (err) {
      res.status(500).json({ error: 'Error fetching outfits.' });
    }
  });

  // Outfits - Request AI outfit suggestions
  app.post('/api/outfits/generate', authenticateUser, async (req: any, res) => {
    try {
      const { occasion, weather, notes } = req.body;
      if (!occasion || !weather) {
        return res.status(400).json({ error: 'Occasion style and weather environment are required.' });
      }

      const activeWardrobe = getUserWardrobe(req.user.id);
      if (activeWardrobe.length === 0) {
        return res.status(400).json({ error: 'Your wardrobe is empty. Please upload some clothing items before generating outfits.' });
      }

      // Generate outfit structures with our server fashion model
      const suggestions = await generateOutfitSuggestions(activeWardrobe, occasion, weather, notes);
      
      // Combine suggestions with actual database wardrobe objects
      const compiledOutfits = (suggestions.outfits || []).map((outfit: any) => {
        const fullItemObjects = outfit.itemIds
          .map((id: string) => activeWardrobe.find(item => item.id === id))
          .filter(Boolean) as WardrobeItem[];

        return {
          id: crypto.randomUUID(), // Temp ID
          userId: req.user.id,
          name: outfit.name || 'AI Designed Ensemble',
          items: fullItemObjects,
          occasion: occasion,
          weather: weather,
          likes: 0,
          saved: false,
          notes: outfit.styleNotes || 'A clean aesthetic pairing matching your needs.',
          suggestedMissingItems: outfit.suggestedMissingItems || []
        };
      }).filter((outfit: any) => outfit.items.length > 0); // Exclude empty combos

      res.json({ outfits: compiledOutfits, warning: suggestions.warning || null });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error generating outfits.' });
    }
  });

  // Outfits - Save an outfit to favorites list
  app.post('/api/outfits/save', authenticateUser, (req: any, res) => {
    try {
      const { name, items, occasion, weather, notes } = req.body;
      if (!name || !items || items.length === 0) {
        return res.status(400).json({ error: 'Outfit Title and wardrobe garments elements are required.' });
      }

      const saved = saveUserOutfit(req.user.id, {
        name,
        items,
        occasion,
        weather,
        likes: 0,
        saved: true,
        notes: notes || ''
      });

      res.status(201).json({ outfit: saved });
    } catch (err) {
      res.status(500).json({ error: 'Error saving lifestyle outfit.' });
    }
  });

  // Outfits - Delete outfit
  app.delete('/api/outfits/:id', authenticateUser, (req: any, res) => {
    try {
      const deleted = deleteUserOutfit(req.user.id, req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Saved Outfit not found.' });
      }
      res.json({ message: 'Selected combination removed from favorites.' });
    } catch (err) {
      res.status(500).json({ error: 'Error removing saved outfit.' });
    }
  });

  // Calendar Planner - Get planned days
  app.get('/api/planner', authenticateUser, (req: any, res) => {
    try {
      const plannedList = getUserPlanner(req.user.id);
      res.json({ planner: plannedList });
    } catch (err) {
      res.status(500).json({ error: 'Error fetching planned outfits calendar.' });
    }
  });

  // Calendar Planner - Schedule day plan
  app.post('/api/planner', authenticateUser, (req: any, res) => {
    try {
      const { date, outfitId, occasion, notes } = req.body;
      if (!date || !outfitId || !occasion) {
        return res.status(400).json({ error: 'Target Year/Month/Day date, outfit select selection, and occasion is required.' });
      }

      const plan = planUserOutfit(req.user.id, {
        date,
        outfitId,
        occasion,
        notes
      });

      res.status(201).json({ plan });
    } catch (err) {
      res.status(500).json({ error: 'Error writing calendar planner slot.' });
    }
  });

  // Calendar Planner - Remove day plan
  app.delete('/api/planner/:id', authenticateUser, (req: any, res) => {
    try {
      const deleted = deleteUserPlan(req.user.id, req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Planned date slot item not found.' });
      }
      res.json({ message: 'Date wardrobe slot successfully reset.' });
    } catch (err) {
      res.status(500).json({ error: 'Error resetting planned slot.' });
    }
  });

  // --- VITE MIDDLEWARES / STATIC ASSETS ---

  if (process.env.NODE_ENV !== 'production') {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    
    app.use(vite.middlewares);
    console.log('Vite development middleware registered.');
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // Redirect all remaining fallback requests to index.html
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production static handler registered.');
  }

  // Bind to external host interface and internal standard port
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SmartWardrobe back-end server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Critical Server Crash:', err);
});
