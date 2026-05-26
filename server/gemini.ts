import { GoogleGenAI, Type } from '@google/genai';
import { WardrobeItem } from '../src/types';

// Initialize the GoogleGenAI instance on the server-side with proper user agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

/**
 * Simple helper to retry asynchronous tasks with exponential backoff on transient errors (e.g., 503, 429).
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; initialDelayMs?: number; backoffFactor?: number } = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  let delay = options.initialDelayMs ?? 1500;
  const backoffFactor = options.backoffFactor ?? 2;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const errorStr = String(error).toLowerCase();
      const isTransient = 
        error?.status === 503 || 
        error?.statusCode === 503 ||
        error?.status === 429 ||
        error?.statusCode === 429 ||
        errorStr.includes("503") ||
        errorStr.includes("429") ||
        errorStr.includes("unavailable") ||
        errorStr.includes("resource_exhausted") ||
        errorStr.includes("high demand") ||
        errorStr.includes("temporary");

      if (isTransient && attempt < maxRetries) {
        console.warn(`[Gemini API Warning] Attempt ${attempt}/${maxRetries} failed due to transient error/high demand: ${error.message || error}. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= backoffFactor;
      } else {
        throw error;
      }
    }
  }
  throw new Error("Max retries exceeded");
}

/**
 * Analyzes a base64 encoded image of a clothing item using Gemini 3.5 Flash
 * and extracts structural metadata.
 */
export async function analyzeClothingImage(base64Data: string, mimeType: string) {
  try {
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `Analyze this image of a clothing item. Extract its precise classification, core technical features, dominant color, complementary matching colors based on styling color theory, appropriate season range, matching attire situations/occasions, and style tags. Be precise and high-fashion-aware.`;

    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType
          }
        },
        {
          text: prompt
        }
      ],
      config: {
        systemInstruction: "You are SmartWardrobe's advanced AI Fashion Curator. You analyze user photos of single garments or accessories and extract crisp, accurate classification and metadata for organizing their digital capsule wardrobe.",
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: "Category: must be one of 'tops', 'bottoms', 'shoes', 'outerwear', 'accessories', or 'one-piece'",
            },
            type: {
              type: Type.STRING,
              description: "Brief human-readable specific style type, e.g., 'Retro Crewneck Sweater', 'Ripped Denim Jeans', 'Chunky Sneakers', 'Double-Breasted Blazer'"
            },
            dominantColor: {
              type: Type.STRING,
              description: "The name of the dominant base color, e.g., 'Teal Blue', 'Crimson Red', 'Heather Grey', 'Cream White'"
            },
            colorHex: {
              type: Type.STRING,
              description: "The precise hexadecimal color code of the dominant apparel color, e.g., '#008080' or '#f5f5dc'"
            },
            matchingColors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 3-4 complementary fashion accent colors that coordinate beautifully with this item under styling color wheel logic"
            },
            season: {
              type: Type.STRING,
              description: "Which seasonal condition fits best: 'Summer', 'Winter', 'Spring', 'Fall', or 'All-Season'"
            },
            occasion: {
              type: Type.STRING,
              description: "The primary occasion styling scope: 'Casual', 'Formal', 'Party', 'Athletic', or 'Business'"
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3-5 descriptive capsule tags such as 'minimalist', 'cotton', 'vintage', 'knitted', 'oversized', 'layering'"
            }
          },
          required: ['category', 'type', 'dominantColor', 'colorHex', 'matchingColors', 'season', 'occasion', 'tags']
        }
      }
    }));

    const textOutput = response.text ? response.text.trim() : '{}';
    return JSON.parse(textOutput);
  } catch (error) {
    console.error("Gemini Image Analysis failed:", error);
    // Return a sensible fallback if AI fails or token is missing
    return {
      category: "tops",
      type: "Classic Regular Fit Tee",
      dominantColor: "Slate Grey",
      colorHex: "#708090",
      matchingColors: ["Beige", "Crimson", "Navy Blue"],
      season: "All-Season",
      occasion: "Casual",
      tags: ["ambient", "cotton", "casual"]
    };
  }
}

/**
 * Creates 2-3 outfit suggestions based on available wardrobe items,
 * weather parameters, desired occasion, and preference notes.
 */
export async function generateOutfitSuggestions(
  items: WardrobeItem[],
  occasion: string,
  weather: string,
  notes?: string
) {
  if (items.length === 0) {
    return {
      outfits: [],
      error: "Your wardrobe is empty! Please upload or seed some garments to generate outfits."
    };
  }

  try {
    // Format wardrobe state for prompt visibility to reduce token overhead while keeping critical tags
    const wardrobeItemsText = items.map(item => {
      return `ID: ${item.id} | ${item.type} (${item.category}) | Color: ${item.dominantColor} (${item.colorHex}) | Season: ${item.season} | Occasion: ${item.occasion} | Tags: ${item.tags.join(', ')}`;
    }).join('\n');

    const prompt = `Available Wardrobe Items:\n${wardrobeItemsText}\n\nClient Request:\n- Target Occasion: ${occasion}\n- Weather/Climate constraint: ${weather}\n${notes ? `- Extra Styling preferences: ${notes}` : ''}\n\nTasks:\n1. Construct exactly 2 to 3 cohesive stylish outfit combinations from the given list of available Items using their IDs.\n2. Do NOT hallucinate item IDs. Only draw from the provided Item IDs.\n3. Make sure outfits are contextually appropriate for the specified Weather and Occasion (e.g. don't suggest thin t-shirts in snowy weather, suggest layers instead).\n4. Create names for the outfit styling selections (e.g., 'Effortless Streetwise Layering', 'Monochromatic Business Formal').\n5. Suggest 1 or 2 complementary clothes/accessories that are NOT in their current list but would elegantly complete the selected outfits ("suggestedMissingItems").`;

    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are SmartWardrobe's master personal AI stylist. Your design philosophy is clean, intentional, high-fashion, and balanced. You carefully construct color-complementary, seasonal, and event-focused ensembles entirely from the user's logged items, and provide helpful sartorial annotations.",
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            outfits: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: {
                    type: Type.STRING,
                    description: "Creative, highcard-styled name of the outfit combination"
                  },
                  itemIds: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "An array of 2 to 4 unique item IDs selected from the user's available wardrobe list that compose this outfit."
                  },
                  styleNotes: {
                    type: Type.STRING,
                    description: "Polished, helpful guidance explaining why these items work together based on color theory, shape, or weather suitability."
                  },
                  suggestedMissingItems: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "1 or 2 items (e.g., 'Gold Hoop Earrings', 'Brown Leather Chelsea Boots') that would elevate the outfit further, which are missing from their current list."
                  }
                },
                required: ['name', 'itemIds', 'styleNotes', 'suggestedMissingItems']
              }
            }
          },
          required: ['outfits']
        }
      }
    }));

    const textOutput = response.text ? response.text.trim() : '{"outfits": []}';
    return JSON.parse(textOutput);
  } catch (error) {
    console.error("Gemini Outfit Suggestion Generation failed:", error);
    
    // Sensible fallback algorithm if Gemini fails or rate limit hits
    const fallbackOutfits = [];
    
    // Basic heuristics: pair a top with a bottom, and optional shoes or outerwear
    const tops = items.filter(i => i.category === 'tops');
    const bottoms = items.filter(i => i.category === 'bottoms');
    const shoes = items.filter(i => i.category === 'shoes');
    const outerwear = items.filter(i => i.category === 'outerwear');

    if (tops.length > 0 && bottoms.length > 0) {
      const p1 = [tops[0].id, bottoms[0].id];
      if (shoes.length > 0) p1.push(shoes[0].id);
      
      fallbackOutfits.push({
        name: "Casual Standard Blend",
        itemIds: p1,
        styleNotes: `A classic, dependable combination of your ${tops[0].type} paired with your ${bottoms[0].type}. Perfect for daily comfort and styled casually.`,
        suggestedMissingItems: ["Polished Minimalist Watch", "Warm Cashmere Scarf"]
      });

      if (tops.length > 1 || bottoms.length > 1 || outerwear.length > 0) {
        const p2 = [tops[tops.length - 1].id, bottoms[bottoms.length - 1].id];
        if (outerwear.length > 0) p2.push(outerwear[0].id);
        if (shoes.length > 1) p2.push(shoes[1].id);
        else if (shoes.length > 0) p2.push(shoes[0].id);

        fallbackOutfits.push({
          name: "Smart Casual Layered Duo",
          itemIds: p2,
          styleNotes: "A layered combination using high visual contrasts. Ideal for transitioning between active environments smoothly.",
          suggestedMissingItems: ["Suede Overcoat", "Neutral Canvas Belt"]
        });
      }
    }

    return {
      outfits: fallbackOutfits,
      warning: "AI suggestion engines are running local matches due to transient network congestion."
    };
  }
}
