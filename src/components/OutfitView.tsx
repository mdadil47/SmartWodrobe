import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  CloudSun, 
  Compass, 
  Plus, 
  Check, 
  Trash2, 
  Bookmark, 
  Info,
  HelpCircle,
  Clock,
  Shirt
} from 'lucide-react';
import { WardrobeItem, Outfit } from '../types';

interface OutfitViewProps {
  wardrobe: WardrobeItem[];
  savedOutfits: Outfit[];
  onSaveOutfit: (outfit: Outfit) => void;
  onDeleteOutfit: (id: string) => void;
  token: string | null;
  quickTriggerWeather?: string;
}

export default function OutfitView({
  wardrobe,
  savedOutfits,
  onSaveOutfit,
  onDeleteOutfit,
  token,
  quickTriggerWeather
}: OutfitViewProps) {
  // Input states
  const [selectedOccasion, setSelectedOccasion] = useState('Casual');
  const [selectedWeather, setSelectedWeather] = useState('Sunny');
  const [customNotes, setCustomNotes] = useState('');
  
  // Suggestion results state
  const [suggestedOutfits, setSuggestedOutfits] = useState<Outfit[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
  const [currentLogIndex, setCurrentLogIndex] = useState(0);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'generate' | 'favorites'>('generate');

  // Multi logs to simulate fashion processing steps natively in UI
  const fashionLogs = [
    "👗 Querying matching indices inside current Wardrobe...",
    "🎨 Running color-matching theory checks (Dominant, Secondary & Accent)...",
    "⛅ Checking seasonal comfort and insulation weights...",
    "✨ Aligning garment categories to construct high-contrast ensembles...",
    "📝 Fine-tuning personal styling annotations..."
  ];

  // Auto handle Quick Style launch from Dashboard
  useEffect(() => {
    if (quickTriggerWeather) {
      // Map basic conditions to weather options
      const mapCondition = (cond: string) => {
        if (cond.toLowerCase().includes('sunny')) return 'Sunny';
        if (cond.toLowerCase().includes('cloudy')) return 'Cloudy';
        if (cond.toLowerCase().includes('rain')) return 'Rainy';
        if (cond.toLowerCase().includes('snow')) return 'Snowy';
        if (cond.toLowerCase().includes('wind')) return 'Windy';
        return 'Sunny';
      };
      setSelectedWeather(mapCondition(quickTriggerWeather));
      setSelectedOccasion('Casual');
      // Scroll nicely
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [quickTriggerWeather]);

  // Handle generation fashion steps log rolling
  useEffect(() => {
    if (isGenerating && currentLogIndex < fashionLogs.length) {
      const timer = setTimeout(() => {
        setGenerationLogs(prev => [...prev, fashionLogs[currentLogIndex]]);
        setCurrentLogIndex(prev => prev + 1);
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [isGenerating, currentLogIndex]);

  const handleGenerate = async () => {
    if (wardrobe.length === 0) {
      setError('Your digital wardrobe is quiet. Please upload clothing items first.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setSuggestedOutfits([]);
    setGenerationLogs(["🚀 Initializing SmartWardrobe Stylist algorithm..."]);
    setCurrentLogIndex(0);

    try {
      const response = await fetch('/api/outfits/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          occasion: selectedOccasion,
          weather: selectedWeather,
          notes: customNotes
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Stylist failed to process suggestions request.');
      }

      setSuggestedOutfits(data.outfits || []);
    } catch (err: any) {
      setError(err.message || 'Error occurred while curating layout combinations.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToFavorites = async (outfit: Outfit) => {
    try {
      const response = await fetch('/api/outfits/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: outfit.name,
          items: outfit.items,
          occasion: outfit.occasion,
          weather: outfit.weather,
          notes: outfit.notes
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to register favorite.');
      }

      onSaveOutfit(data.outfit);
      
      // Update local suggested list to show saved overlay status
      setSuggestedOutfits(prev => prev.map(o => {
        if (o.name === outfit.name) {
          return { ...o, saved: true };
        }
        return o;
      }));
    } catch (err: any) {
      alert(err.message || 'Failed to save items.');
    }
  };

  const handleDeleteFavorite = async (outfitId: string) => {
    try {
      const response = await fetch(`/api/outfits/${outfitId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete outfit.');
      }

      onDeleteOutfit(outfitId);
    } catch (err: any) {
      alert(err.message || 'Failed to remove favorite.');
    }
  };

  return (
    <div id="outfits-viewport" className="space-y-6">
      
      {/* View Header with Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-105 dark:border-neutral-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-neutral-850 dark:text-neutral-100">Styling Workspace</h2>
          <p className="text-xs text-neutral-450 dark:text-neutral-400">Consult with the fashion stylist model to curate capsule ensembles matching specific criteria.</p>
        </div>

        {/* Workspace tabs switcher */}
        <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded-xl text-xs font-semibold gap-1.5 self-start">
          <button
            id="tab-btn-generate"
            onClick={() => setActiveTab('generate')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'generate'
                ? 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Outfit Generator
          </button>
          <button
            id="tab-btn-favorites"
            onClick={() => setActiveTab('favorites')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'favorites'
                ? 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Favorite Ensembles ({savedOutfits.length})
          </button>
        </div>
      </div>

      {activeTab === 'generate' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Controls Form Box */}
          <div className="lg:col-span-1 bg-white dark:bg-neutral-905 border border-neutral-200 dark:border-neutral-850 rounded-[2rem] p-6 shadow-sm space-y-4 self-start">
            <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Compass className="h-4.5 w-4.5 text-black dark:text-white" />
              <span>Calibrate Style Criteria</span>
            </h3>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-955/20 border border-red-100 dark:border-red-900/40 text-red-650 dark:text-red-400 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            <div className="space-y-3.5 text-xs">
              {/* Occasion Option selector */}
              <div>
                <label className="block text-[10px] font-bold text-neutral-450 uppercase mb-1.5 tracking-widest">Style Occasion</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Casual', 'Formal', 'Party', 'Athletic', 'Business'].map((occ) => (
                    <button
                      id={`occ-btn-${occ}`}
                      key={occ}
                      onClick={() => setSelectedOccasion(occ)}
                      className={`px-3 py-2 rounded-xl border text-[11px] text-center font-semibold transition-all ${
                        selectedOccasion === occ
                          ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black font-bold'
                          : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-850 text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      {occ}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weather Condition Option selector */}
              <div className="pt-2">
                <label className="block text-[10px] font-bold text-neutral-450 uppercase mb-1.5 tracking-widest">Active Climate</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Sunny', 'Cloudy', 'Rainy', 'Snowy', 'Windy'].map((wea) => (
                    <button
                      id={`wea-btn-${wea}`}
                      key={wea}
                      onClick={() => setSelectedWeather(wea)}
                      className={`px-3 py-2 rounded-xl border text-[11px] text-center font-semibold transition-all ${
                        selectedWeather === wea
                          ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black font-bold'
                          : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-850 text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      {wea}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text notes */}
              <div className="pt-2">
                <label className="block text-[10px] font-bold text-neutral-450 uppercase mb-1.5 tracking-widest">Custom Notes / Aesthetic Vibe</label>
                <textarea
                  id="custom-notes-input"
                  rows={2}
                  placeholder="E.g., earth-tone heavy palette preferred, double-breasted coat layers"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full p-3 py-2 text-xs rounded-xl border border-neutral-150 dark:border-neutral-800 bg-neutral-25 dark:bg-neutral-900 text-neutral-850 dark:text-neutral-200 focus:outline-none focus:border-black dark:focus:border-white"
                ></textarea>
              </div>

              <button
                id="curate-combinations-submit"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-black rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <span className="w-4.5 h-4.5 border-2 border-white/30 border-t-white dark:border-black/30 dark:border-t-black rounded-full animate-spin"></span>
                    <span>Curating selections...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-white dark:text-black" />
                    <span>Generate Outfit Suggestions</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Suggested Outfits Outputs */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Real-time Loading step logs outputs */}
            {isGenerating && (
              <div id="ai-logs-card" className="bg-white dark:bg-neutral-905 border border-neutral-200 dark:border-neutral-800 rounded-[2rem] p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-black dark:text-white font-bold text-xs">
                  <span className="w-4 h-4 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Fashion Stylist Model is calculating outfits...</span>
                </div>
                
                <div className="font-mono text-[10px] space-y-2 bg-neutral-105 dark:bg-neutral-900 p-4 rounded-xl border border-neutral-150 dark:border-neutral-805 text-neutral-800 dark:text-neutral-200 antialiased leading-relaxed">
                  {generationLogs.map((log, lIdx) => (
                    <div key={lIdx} className="flex items-center gap-2">
                       <span className="text-black dark:text-white font-bold">✓</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isGenerating && suggestedOutfits.length === 0 && (
              <div id="no-outfits-curated" className="bg-white dark:bg-neutral-905 border border-neutral-200 dark:border-neutral-850 rounded-[2rem] p-8 shadow-sm text-center py-16">
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-full inline-block mb-3 text-neutral-405">
                  <Sparkles className="h-8 w-8 text-black dark:text-white" />
                </div>
                <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">No Outfit Combinations Rendered</h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 max-w-sm mx-auto mt-2 leading-relaxed">
                  Calibrate your wardrobe situation filters on the left panel, then trigger our personal fashion engine. (Make sure you have garments uploaded!).
                </p>
              </div>
            )}

            {/* Rendered Combos Grid */}
            {!isGenerating && suggestedOutfits.length > 0 && (
              <div id="outfits-suggestions-list" className="space-y-6">
                <h4 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-widest pl-1">Suggested styling combinations</h4>
                {suggestedOutfits.map((outfit, oIdx) => (
                  <div
                    id={`suggested-outfit-box-${oIdx}`}
                    key={oIdx}
                    className="bg-white dark:bg-neutral-905 border border-neutral-250 dark:border-neutral-800 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all space-y-5"
                  >
                    <div className="flex items-center justify-between gap-4 border-b border-neutral-150 dark:border-neutral-805 pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-100 leading-snug">{outfit.name}</h4>
                        <span className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-300 uppercase mt-0.5 block tracking-wider">Suitable: {outfit.occasion} · {outfit.weather} climate</span>
                      </div>

                      <button
                        id={`save-fav-outfit-btn-${oIdx}`}
                        onClick={() => handleSaveToFavorites(outfit)}
                        disabled={outfit.saved}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                          outfit.saved
                            ? 'bg-neutral-50 dark:bg-neutral-800 text-neutral-400 border border-neutral-150'
                            : 'bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-black'
                        }`}
                      >
                        {outfit.saved ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Saved To Favorites</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="h-3.5 w-3.5" />
                            <span>Save Combo</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Wardrobe Items thumbnails layout */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {outfit.items.map((item) => (
                        <div
                          id={`suggested-item-card-${item.id}`}
                          key={item.id}
                          className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-2xl overflow-hidden text-center p-2 flex flex-col items-center"
                        >
                          <div className="w-full aspect-[4/5] bg-neutral-100 dark:bg-neutral-850 rounded-lg overflow-hidden flex items-center justify-center">
                            <img
                               src={item.imageUrl}
                              alt={item.type}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <span className="text-[9px] font-bold text-neutral-700 dark:text-neutral-300 truncate mt-1.5 block w-full">{item.type}</span>
                          <span className="text-[8px] text-neutral-400 block uppercase font-mono mt-0.5">{item.category}</span>
                        </div>
                      ))}
                    </div>

                    {/* Gemini style annotations */}
                    <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 p-4 rounded-xl space-y-1.5 text-xs text-neutral-600 dark:text-neutral-350">
                      <div className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
                        <Info className="h-4 w-4 text-black dark:text-white" />
                        <span>Styling Notes:</span>
                      </div>
                      <p className="leading-normal">{outfit.notes}</p>
                    </div>

                    {/* Suggested missing items (highly aesthetic feature!) */}
                    {outfit.suggestedMissingItems && outfit.suggestedMissingItems.length > 0 && (
                      <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-700 dark:text-neutral-305 font-sans">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">💡 Complementary accents to raise contrast:</span>
                        {outfit.suggestedMissingItems.map((miss, mIdx) => (
                          <span key={mIdx} className="px-2.5 py-0.5 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-750 dark:text-yellow-300 rounded-full font-semibold border border-yellow-105/30 text-[9px]">
                            {miss}
                          </span>
                        ))}
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}

          </div>

        </div>
      ) : (
        /* Saved Favorites Outfits tab */
        <div id="favorites-tab-viewport">
          {savedOutfits.length === 0 ? (
            <div id="no-favorites" className="bg-white dark:bg-neutral-905 border border-neutral-100 dark:border-neutral-850 rounded-2xl p-8 shadow-sm text-center py-16">
              <div className="p-4 bg-slate-50 dark:bg-neutral-800 rounded-full inline-block mb-3 text-neutral-400">
                <Bookmark className="h-8 w-8 text-neutral-450" />
              </div>
              <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">No Saved Outfit Combinations</h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 max-w-sm mx-auto mt-2 leading-relaxed">
                Save your favorite suggested combinations and layouts during recommendations to list them here.
              </p>
            </div>
          ) : (
            <div id="favorites-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {savedOutfits.map((outfit) => (
                <div
                  id={`favorite-outfit-card-${outfit.id}`}
                  key={outfit.id}
                  className="bg-white dark:bg-neutral-905 border border-neutral-100 dark:border-neutral-850 rounded-2xl p-5 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between gap-4 border-b border-neutral-105/50 dark:border-neutral-805 pb-3.5">
                    <div>
                      <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">{outfit.name}</h4>
                      <span className="text-[9px] font-semibold text-neutral-600 dark:text-neutral-300 uppercase mt-0.5 block tracking-wider">{outfit.occasion} · {outfit.weather} weather</span>
                    </div>

                    <button
                      id={`delete-fav-outfit-${outfit.id}`}
                      onClick={() => handleDeleteFavorite(outfit.id)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-650 rounded-xl transition-all"
                      title="Delete outfit"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Horizontally sliding garment thumbnails */}
                  <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                    {outfit.items.map((item) => (
                      <div
                        id={`fav-item-thumb-${item.id}`}
                        key={item.id}
                        className="w-16 flex-shrink-0 bg-slate-25 dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800 rounded-lg overflow-hidden p-1 flex flex-col items-center"
                      >
                        <div className="w-full aspect-square bg-slate-50 dark:bg-neutral-850 rounded overflow-hidden">
                          <img
                            src={item.imageUrl}
                            alt={item.type}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <span className="text-[7px] text-neutral-400 font-bold truncate block w-full mt-1">{item.type}</span>
                      </div>
                    ))}
                  </div>

                  {outfit.notes && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-25/55 dark:bg-neutral-900/50 p-3 rounded-lg leading-relaxed font-sans">
                      {outfit.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
