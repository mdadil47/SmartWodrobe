import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Shirt, 
  Sun, 
  Cloud, 
  CloudRain, 
  Snowflake, 
  Wind, 
  TrendingUp, 
  ArrowRight,
  Info
} from 'lucide-react';
import { WardrobeItem, Outfit, WeatherInfo } from '../types';

interface DashboardViewProps {
  wardrobe: WardrobeItem[];
  outfits: Outfit[];
  onTriggerQuickStyle: (weather: string, occasion: string) => void;
  user: { name: string } | null;
}

export default function DashboardView({
  wardrobe,
  outfits,
  onTriggerQuickStyle,
  user
}: DashboardViewProps) {
  // Simulated Weather state
  const [weather, setWeather] = useState<WeatherInfo>({
    temp: 72,
    condition: 'Sunny',
    location: 'San Francisco, CA'
  });

  const [weatherInput, setWeatherInput] = useState('');
  const [isChangingLocation, setIsChangingLocation] = useState(false);

  // Weather icons
  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'Sunny': return <Sun className="h-8 w-8 text-amber-500 animate-pulse" />;
      case 'Cloudy': return <Cloud className="h-8 w-8 text-neutral-400" />;
      case 'Rainy': return <CloudRain className="h-8 w-8 text-blue-400" />;
      case 'Snowy': return <Snowflake className="h-8 w-8 text-indigo-300" />;
      case 'Windy': return <Wind className="h-8 w-8 text-teal-400" />;
      default: return <Sun className="h-8 w-8 text-amber-400" />;
    }
  };

  // Weather logic defaults
  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weatherInput) return;
    
    // Simulate some temperature relative to location name
    const seed = weatherInput.length;
    const computedTemp = 45 + (seed * 3) % 40;
    const conditions: Array<WeatherInfo['condition']> = ['Sunny', 'Cloudy', 'Rainy', 'Windy', 'Snowy'];
    const computedCondition = conditions[seed % conditions.length];

    setWeather({
      location: weatherInput,
      temp: computedTemp,
      condition: computedCondition
    });
    setWeatherInput('');
    setIsChangingLocation(false);
  };

  // Wardrobe statistics
  const stats = useMemo(() => {
    const categories = {
      tops: 0,
      bottoms: 0,
      shoes: 0,
      outerwear: 0,
      accessories: 0,
      'one-piece': 0
    };

    wardrobe.forEach(item => {
      if (categories[item.category] !== undefined) {
        categories[item.category]++;
      }
    });

    // Compute dominant colors
    const colorsMap: { [key: string]: { count: number; hex: string } } = {};
    wardrobe.forEach(item => {
      if (item.dominantColor && item.colorHex) {
        if (!colorsMap[item.dominantColor]) {
          colorsMap[item.dominantColor] = { count: 0, hex: item.colorHex };
        }
        colorsMap[item.dominantColor].count++;
      }
    });

    const sortedColors = Object.entries(colorsMap)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3);

    return {
      total: wardrobe.length,
      categories,
      dominantColors: sortedColors,
    };
  }, [wardrobe]);

  // Color dynamic advice using Color Theory matching algorithms
  const smartColorAdvice = useMemo(() => {
    if (stats.dominantColors.length === 0) {
      return {
        accent: "Upload garments first to construct styling advice.",
        description: "Your digital inventory is empty. We will dynamically extract dominant shades and provide advice when items are loaded."
      };
    }

    const [topColorName, topColorVal] = stats.dominantColors[0];
    const name = topColorName.toLowerCase();

    if (name.includes('blue') || name.includes('indigo')) {
      return {
        accent: "Refining Blue & Cool-toned Palettes",
        description: `With ${topColorName} as a major weight in your closet, pair them with crisp whites, clean camels, or soft beiges for timeless styling. Complementing cool shades with warm earthen footwear balances visual density.`
      };
    } else if (name.includes('black') || name.includes('charcoal') || name.includes('dark')) {
      return {
        accent: "Mastering Dark Neutral Layering",
        description: `Since ${topColorName} is dominant, utilize varying textures (like suede or leather) to build depth in monochromatic outfits. Blend with stark white crewnecks or grey jackets for sharp, high-contrast streetwear.`
      };
    } else if (name.includes('white') || name.includes('cream') || name.includes('beige')) {
      return {
        accent: "Curating Soft High-Contrast Pairings",
        description: `Your closet heavily highlights elegant ${topColorName} tones. Style these with deep forest green or rich navy bottoms. Adding a dark outerwear piece frames lightweight tops beautifully.`
      };
    } else {
      return {
        accent: `Harmonizing ${topColorName} Elements`,
        description: `Complement your dominant ${topColorName} pieces with soft grey, olive trousers, or black boots. Sticking to neutral frames makes your accent colors stand out intentionally.`
      };
    }
  }, [stats.dominantColors]);

  return (
    <div id="dashboard-viewport" className="space-y-6">
      
      {/* Greetings block */}
      <div id="greeting-banner" className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 bg-black dark:bg-neutral-900 text-white rounded-[2rem] border border-neutral-200 dark:border-neutral-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 bg-white/10 text-neutral-100 border border-white/5 rounded-full font-bold">Today's AI Pick</span>
          </div>
          <h2 className="font-sans font-bold text-2xl tracking-tight leading-none mt-3">
            Welcome back, {user?.name || 'Stylist'}
          </h2>
          <p className="text-sm text-neutral-205 dark:text-neutral-300 tracking-normal mt-1 leading-relaxed">
            Your digital wardrobe contains {stats.total} pieces. Today's recommendations are calibrated for you.
          </p>
        </div>

        {/* Dynamic Button Trigger */}
        <button
          id="cta-what-to-wear"
          onClick={() => onTriggerQuickStyle(weather.condition, 'Casual')}
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-neutral-100 text-black text-xs font-bold rounded-2xl transition-all shadow-sm border border-neutral-200 self-start md:self-auto"
        >
          <Sparkles className="h-4 w-4 text-black" />
          <span>What should I wear today?</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weather Intelligence Widget */}
        <div id="weather-card" className="lg:col-span-1 bg-white dark:bg-neutral-905 border border-neutral-200 dark:border-neutral-850 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="font-mono text-[10px] uppercase text-neutral-400 font-semibold tracking-wider">Climate Lens</span>
              <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1">{weather.location}</h3>
            </div>
            
            <button
              id="change-location-btn"
              onClick={() => setIsChangingLocation(!isChangingLocation)}
              className="text-xs text-black dark:text-neutral-200 underline font-medium"
            >
              {isChangingLocation ? 'Cancel' : 'Change'}
            </button>
          </div>

          {isChangingLocation && (
            <form onSubmit={handleLocationSubmit} className="mb-4 flex gap-2">
              <input
                id="location-entry-input"
                type="text"
                placeholder="E.g., London, Tokyo..."
                value={weatherInput}
                onChange={(e) => setWeatherInput(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-neutral-150 dark:border-neutral-800 bg-neutral-25 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-black"
              />
              <button
                id="location-entry-submit"
                type="submit"
                className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs rounded-xl font-semibold"
              >
                Set
              </button>
            </form>
          )}

          {/* Central Weather Output */}
          <div className="flex items-center gap-5 my-3">
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-slate-800 flex items-center justify-center">
              {getWeatherIcon(weather.condition)}
            </div>
            <div>
              <div className="text-3xl font-bold text-neutral-800 dark:text-neutral-100 leading-none">
                {weather.temp}°F
              </div>
              <span className="text-xs text-neutral-600 dark:text-neutral-300 font-semibold block mt-1">{weather.condition} condition today</span>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-900/30 p-3 rounded-xl">
            ☀️ Recommended category: <span className="font-bold text-neutral-805 dark:text-neutral-100">
              {weather.condition === 'Sunny' ? 'Linen Tops & Eyewear' : weather.condition === 'Rainy' ? 'Outerwear & Boots' : 'Layered Knits'}
            </span>
          </div>
        </div>

        {/* Capsule Statistics Widget */}
        <div id="stats-card" className="lg:col-span-2 bg-white dark:bg-neutral-905 border border-neutral-200 dark:border-neutral-850 rounded-[2rem] p-6 shadow-sm">
          <span className="font-mono text-[10px] uppercase text-neutral-400 font-semibold tracking-wider">Inventory Metrics</span>
          <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1 mb-4">Garment Distribution</h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-neutral-50 dark:bg-neutral-850 rounded-2xl border border-neutral-100 dark:border-neutral-800/40 text-center">
              <span className="text-xs text-neutral-600 dark:text-neutral-300 block font-bold">Tops</span>
              <span className="text-xl font-bold text-neutral-950 dark:text-neutral-100 block mt-1">{stats.categories.tops}</span>
            </div>
            <div className="p-4 bg-neutral-50 dark:bg-neutral-850 rounded-2xl border border-neutral-100 dark:border-neutral-800/40 text-center">
              <span className="text-xs text-neutral-600 dark:text-neutral-300 block font-bold">Bottoms</span>
              <span className="text-xl font-bold text-neutral-955 dark:text-neutral-100 block mt-1">{stats.categories.bottoms}</span>
            </div>
            <div className="p-4 bg-neutral-50 dark:bg-neutral-850 rounded-2xl border border-neutral-100 dark:border-neutral-800/40 text-center">
              <span className="text-xs text-neutral-600 dark:text-neutral-300 block font-bold">Outerwear</span>
              <span className="text-xl font-bold text-neutral-955 dark:text-neutral-100 block mt-1">{stats.categories.outerwear}</span>
            </div>
            <div className="p-4 bg-neutral-50 dark:bg-neutral-850 rounded-2xl border border-neutral-100 dark:border-neutral-800/40 text-center">
              <span className="text-xs text-neutral-600 dark:text-neutral-300 block font-bold">Shoes</span>
              <span className="text-xl font-bold text-neutral-955 dark:text-neutral-100 block mt-1">{stats.categories.shoes}</span>
            </div>
          </div>
          
          {/* Progress bar visual for overall capsuling */}
          <div className="mt-5 pt-3">
            <div className="flex justify-between items-center text-xs mb-1.5 font-bold text-neutral-700 dark:text-neutral-300">
              <span>Capsule Capacity (Target 30 Items limit)</span>
              <span className="font-extrabold text-neutral-950 dark:text-white">{stats.total} / 30 items</span>
            </div>
            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-black dark:bg-neutral-250 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((stats.total / 30) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dynamic Color Theory Insights (Bento Widget) */}
        <div id="color-theory-card" className="lg:col-span-2 bg-white dark:bg-neutral-905 border border-neutral-200 dark:border-neutral-850 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1 text-black dark:text-white">
              <TrendingUp className="h-4 w-4 stroke-[2]" />
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider">AI Color Insights</span>
            </div>
            
            <h3 className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-2">
              {smartColorAdvice.accent}
            </h3>
            
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-3 leading-relaxed">
              {smartColorAdvice.description}
            </p>
          </div>

          {stats.dominantColors.length > 0 && (
            <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
              <span className="text-xs text-neutral-450 font-medium font-sans">Dominant Palette:</span>
              <div className="flex gap-2">
                {stats.dominantColors.map(([name, colorInfo]) => (
                  <div 
                    id={`palette-${name}`}
                    key={name}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-150 dark:border-neutral-750 rounded-lg text-[10px] font-semibold text-neutral-600 dark:text-neutral-300"
                  >
                    <span 
                      className="w-2.5 h-2.5 rounded-full border border-neutral-200 block" 
                      style={{ backgroundColor: colorInfo.hex }}
                    ></span>
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fashion Tip Box */}
        <div id="fashion-tip-card" className="lg:col-span-1 bg-white dark:bg-neutral-905 border border-neutral-200 dark:border-neutral-850 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-black dark:text-white">
              <Info className="h-4 w-4" />
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider">Styling Rule</span>
            </div>
            <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">The 3-Color Guideline</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              To keep your ensembles elegant, restrict your outfits to at most three main colors: a dominant shade (60%), a secondary body shade (30%), and an accent accessory tone (10%).
            </p>
          </div>
          
          <div className="mt-4 p-3.5 bg-[#F9FAFB] dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-300 rounded-xl leading-relaxed">
            🌿 "Simplification is the ultimate key to true style." - Coco Chanel
          </div>
        </div>

      </div>

    </div>
  );
}
