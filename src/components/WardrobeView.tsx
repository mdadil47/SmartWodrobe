import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Filter, 
  UploadCloud, 
  Sparkles, 
  Check, 
  PlusCircle, 
  HelpCircle,
  Shirt,
  X,
  AlertCircle
} from 'lucide-react';
import { WardrobeItem } from '../types';

interface WardrobeViewProps {
  items: WardrobeItem[];
  onAddItem: (item: WardrobeItem) => void;
  onDeleteItem: (id: string) => void;
  token: string | null;
}

export default function WardrobeView({
  items,
  onAddItem,
  onDeleteItem,
  token
}: WardrobeViewProps) {
  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [selectedOccasion, setSelectedOccasion] = useState<string>('all');
  
  // Upload Modal state
  const [isOpenUpload, setIsOpenUpload] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileMime, setFileMime] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // Manual form inputs
  const [manualType, setManualType] = useState('');
  const [manualCategory, setManualCategory] = useState('tops');
  const [manualDominantColor, setManualDominantColor] = useState('Off-White');
  const [manualHex, setManualHex] = useState('#fafafa');
  const [manualSeason, setManualSeason] = useState('Summer');
  const [manualOccasion, setManualOccasion] = useState('Casual');
  const [manualTagsText, setManualTagsText] = useState('casual, basic, cotton');
  const [manualImageUrl, setManualImageUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Categories config
  const categories = [
    { id: 'all', label: 'All Garments' },
    { id: 'tops', label: 'Tops' },
    { id: 'bottoms', label: 'Bottoms' },
    { id: 'outerwear', label: 'Outerwear' },
    { id: 'shoes', label: 'Shoes' },
    { id: 'accessories', label: 'Accessories' },
    { id: 'one-piece', label: 'One-Pieces' },
  ];

  const seasons = ['all', 'Summer', 'Winter', 'Spring', 'Fall', 'All-Season'];
  const occasions = ['all', 'Casual', 'Formal', 'Party', 'Athletic', 'Business'];

  // Handle image reading
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please drop or select a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFileBase64(event.target.result as string);
        setFileMime(file.type);
        setUploadError('');
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read files.');
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Trigger file click
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Handle AI Upload Submit
  const handleAIUploadSubmit = async () => {
    if (!fileBase64) {
      setUploadError('Please choose or drop an image first.');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const response = await fetch('/api/wardrobe/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          base64Data: fileBase64,
          mimeType: fileMime
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Vite AI endpoint returned rejection.');
      }

      onAddItem(data.item);
      resetModalState();
    } catch (err: any) {
      setUploadError(err.message || 'Error processing AI analyze request. Switching to Manual uploading mode is highly recommended if API is quiet.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Manual Form Submit
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalImageUrl = manualImageUrl || fileBase64 || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500&q=80";

    if (!manualType) {
      setUploadError('Garment style type is required.');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const payload = {
        imageUrl: finalImageUrl,
        category: manualCategory,
        type: manualType,
        dominantColor: manualDominantColor,
        colorHex: manualHex,
        matchingColors: manualTagsText.split(',').map(t => t.trim()),
        season: manualSeason,
        occasion: manualOccasion,
        tags: manualTagsText.split(',').map(m => m.trim())
      };

      const response = await fetch('/api/wardrobe/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Manual submission failed.');
      }

      onAddItem(data.item);
      resetModalState();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to manually submit.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetModalState = () => {
    setIsOpenUpload(false);
    setIsManualMode(false);
    setFileBase64(null);
    setUploadError('');
    setIsUploading(false);
    setManualType('');
    setManualImageUrl('');
  };

  // Filter items logic
  const filteredItems = items.filter(item => {
    const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchSeason = selectedSeason === 'all' || item.season === selectedSeason;
    const matchOccasion = selectedOccasion === 'all' || item.occasion === selectedOccasion;
    return matchCategory && matchSeason && matchOccasion;
  });

  return (
    <div id="wardrobe-viewport" className="space-y-6">
      
      {/* Header section with CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-neutral-850 dark:text-neutral-100">My Digital Wardrobe</h2>
          <p className="text-xs text-neutral-450 dark:text-neutral-400">Classify garments, filter by aesthetic seasonality, and build your digital capsule.</p>
        </div>

        <button
          id="upload-wardrobe-trigger"
          onClick={() => setIsOpenUpload(true)}
          className="flex items-center justify-center gap-1.5 px-5 py-3 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-black rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-150"
        >
          <Plus className="h-4 w-4" />
          <span>Add Outfit Piece</span>
        </button>
      </div>

      {/* Filter bar */}
      <div id="filter-wrapper" className="bg-white dark:bg-neutral-905 border border-neutral-200 dark:border-neutral-850 p-4 rounded-2xl shadow-sm space-y-3">
        {/* Horizontal scrollable categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              id={`filter-category-${cat.id}`}
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-black text-white dark:bg-white dark:text-black font-bold'
                  : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-750'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Multi dimension Select lists */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-805 text-xs">
          <div className="flex items-center gap-1.5 text-neutral-500">
            <Filter className="h-3.5 w-3.5" />
            <span className="font-semibold">Refinement:</span>
          </div>

          <div>
            <select
              id="filter-season-select"
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-350 text-xs focus:outline-none"
            >
              <option value="all">Any Season</option>
              {seasons.filter(s => s !== 'all').map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              id="filter-occasion-select"
              value={selectedOccasion}
              onChange={(e) => setSelectedOccasion(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-350 text-xs focus:outline-none"
            >
              <option value="all">Any Occasion</option>
              {occasions.filter(o => o !== 'all').map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          {/* Quick Clear indicator */}
          {(selectedCategory !== 'all' || selectedSeason !== 'all' || selectedOccasion !== 'all') && (
            <button
              id="filters-clear-btn"
              onClick={() => {
                setSelectedCategory('all');
                setSelectedSeason('all');
                setSelectedOccasion('all');
              }}
              className="text-xs text-red-500 hover:underline font-medium ml-auto"
            >
              Clear refinement filters
            </button>
          )}
        </div>
      </div>

      {/* Grid items layout */}
      {filteredItems.length === 0 ? (
        <div id="wardrobe-empty-fallback" className="text-center py-16 bg-white dark:bg-neutral-905 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
          <div className="p-4 bg-slate-50 dark:bg-neutral-800 rounded-full inline-block mb-3">
            <Shirt className="h-8 w-8 text-neutral-450" />
          </div>
          <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">No Clothing Items Match Selection</h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-450 max-w-xs mx-auto mt-1 leading-normal">
            Adjust your filters or upload a fresh garment photo using the AI Lens.
          </p>
        </div>
      ) : (
        <div id="wardrobe-grid" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div
              id={`clothing-card-${item.id}`}
              key={item.id}
              className="group bg-white dark:bg-neutral-905 border border-neutral-100 dark:border-neutral-850 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-neutral-200 dark:hover:border-neutral-700 transition-all duration-200 flex flex-col relative"
            >
              {/* Image box */}
              <div className="relative aspect-[4/5] overflow-hidden bg-slate-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-850 flex items-center justify-center">
                <img
                  src={item.imageUrl}
                  alt={item.type}
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Attributes text segment */}
              <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between bg-white dark:bg-neutral-905">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-100 truncate line-clamp-1 flex-1">{item.type}</h4>
                    <button
                      id={`delete-btn-${item.id}`}
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Category badging */}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="text-[9px] font-semibold text-indigo-505 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/25 px-2 py-0.5 rounded-full capitalize">
                      {item.category}
                    </span>
                    <span className="text-[9px] font-semibold text-neutral-400 bg-neutral-50 dark:bg-neutral-800 px-2 py-0.5 rounded-full capitalize">
                      {item.season}
                    </span>
                    <span className="text-[9px] font-semibold text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 px-2 py-0.5 rounded-full capitalize">
                      {item.occasion}
                    </span>
                  </div>
                </div>

                {/* Color details indicator */}
                <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-805">
                  <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-medium">
                    <span 
                      className="w-2.5 h-2.5 rounded-full border border-neutral-150 block" 
                      style={{ backgroundColor: item.colorHex }}
                    ></span>
                    <span className="truncate max-w-[90px]">{item.dominantColor}</span>
                  </div>
                  <span className="font-mono text-[9px] text-neutral-400 uppercase tracking-tight">{item.colorHex}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RENDER PREVIEW UPLOAD MODAL */}
      {isOpenUpload && (
        <div id="upload-modal-overlay" className="fixed inset-0 bg-neutral-950/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div id="upload-modal-content" className="bg-white dark:bg-neutral-905 border border-neutral-200 dark:border-neutral-800 rounded-[2rem] max-w-lg w-full p-8 shadow-2xl relative block animate-in fade-in zoom-in duration-200">
            {/* Modal Exit trigger */}
            <button
              id="upload-modal-close"
              onClick={resetModalState}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Title section */}
            <div className="mb-5">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-black dark:text-white" />
                <span>Log New Apparel Piece</span>
              </h3>
              <p className="text-xs text-neutral-400">Introduce an item to your closet using multimodal Gemini Vision classification or configure manually.</p>
            </div>

            {/* Error alerts */}
            {uploadError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-955/20 border border-red-100 dark:border-red-900/40 text-red-650 dark:text-red-400 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Tabs for Mode selection */}
            <div className="flex border-b border-neutral-150 dark:border-neutral-800 mb-5 text-xs font-semibold">
              <button
                id="tab-ai-vision"
                onClick={() => setIsManualMode(false)}
                className={`flex-1 text-center pb-3 border-b-2 text-xs transition-colors ${
                  !isManualMode
                    ? 'border-black dark:border-white text-black dark:text-white font-bold'
                    : 'border-transparent text-neutral-450 hover:text-neutral-700'
                }`}
              >
                🔮 Gemini AI Vision Analyzer
              </button>
              <button
                id="tab-manual"
                onClick={() => setIsManualMode(true)}
                className={`flex-1 text-center pb-3 border-b-2 text-xs transition-colors ${
                  isManualMode
                    ? 'border-black dark:border-white text-black dark:text-white font-bold'
                    : 'border-transparent text-neutral-450 hover:text-neutral-700'
                }`}
              >
                ✍️ Manual Item Configuration
              </button>
            </div>

            {/* AI Vision Mode */}
            {!isManualMode ? (
              <div className="space-y-4">
                {/* Drag and drop panel */}
                {!fileBase64 ? (
                  <div
                    id="dropzone"
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={triggerFileSelect}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[190px] ${
                      dragActive
                        ? 'border-indigo-500 bg-indigo-25/40 dark:bg-indigo-950/15'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-705'
                    }`}
                  >
                    <UploadCloud className="h-8 w-8 text-neutral-400 mb-2.5 animate-bounce-slow" />
                    <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Drag & Drop garment image file here</span>
                    <span className="text-[10px] text-neutral-455 mt-1 block">Or click to browse storage files (JPEG, PNG, WEBP)</span>
                    <input
                      id="native-file-picker"
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Visual preview slot */}
                    <div className="relative aspect-video max-h-[190px] w-full rounded-xl overflow-hidden bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 flex items-center justify-center">
                      <img
                        src={fileBase64}
                        alt="Garment Preview"
                        className="h-full w-full object-contain"
                      />
                      <button
                        id="clear-preview-btn"
                        onClick={() => setFileBase64(null)}
                        className="absolute top-2 right-2 p-1.5 bg-neutral-900/70 hover:bg-neutral-900 text-white rounded-lg text-xs"
                      >
                        Reset Image
                      </button>
                    </div>

                    <button
                      id="ai-vision-submit"
                      onClick={handleAIUploadSubmit}
                      disabled={isUploading}
                      className="w-full py-3.5 px-4 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 dark:text-black text-white rounded-xl text-xs font-semibold uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isUploading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-black/30 dark:border-t-black rounded-full animate-spin"></span>
                          <span>Gemini AI is examining garment details...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 text-white dark:text-black" />
                          <span>Trigger Gemini Multimodal Classification Analysis</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Manual Input Form Mode */
              <form onSubmit={handleManualSubmit} className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-505 uppercase mb-1">Item Title / Specific Style</label>
                    <input
                      id="manual-input-type"
                      type="text"
                      required
                      placeholder="E.g., Grey Cashmere Knit"
                      value={manualType}
                      onChange={(e) => setManualType(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-150 dark:border-neutral-800 bg-neutral-25 dark:bg-neutral-900 text-neutral-850 dark:text-neutral-200 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-505 uppercase mb-1">Stock Category</label>
                    <select
                      id="manual-input-category"
                      value={manualCategory}
                      onChange={(e) => setManualCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-150 dark:border-neutral-800 bg-neutral-25 dark:bg-neutral-900 text-neutral-850 dark:text-neutral-200 focus:outline-none focus:border-indigo-600"
                    >
                      {categories.filter(c => c.id !== 'all').map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-505 uppercase mb-1">Dominant Color Name</label>
                    <input
                      id="manual-input-color"
                      type="text"
                      placeholder="E.g., Mint Green"
                      value={manualDominantColor}
                      onChange={(e) => setManualDominantColor(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-150 dark:border-neutral-800 bg-neutral-25 dark:bg-neutral-900 text-neutral-850 dark:text-neutral-200 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-505 uppercase mb-1">Color HEX Block</label>
                    <input
                      id="manual-input-hex"
                      type="color"
                      value={manualHex}
                      onChange={(e) => setManualHex(e.target.value)}
                      className="w-full h-8 px-1 py-0.5 rounded-xl border border-neutral-150 dark:border-neutral-800 bg-neutral-25 dark:bg-neutral-900 focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-505 uppercase mb-1">Optimal Season</label>
                    <select
                      id="manual-input-season"
                      value={manualSeason}
                      onChange={(e) => setManualSeason(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-150 dark:border-neutral-800 bg-neutral-25 dark:bg-neutral-900 text-neutral-850 dark:text-neutral-200 focus:outline-none focus:border-indigo-600"
                    >
                      {seasons.filter(s => s !== 'all').map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-505 uppercase mb-1">Suitable Occasion</label>
                    <select
                      id="manual-input-occasion"
                      value={manualOccasion}
                      onChange={(e) => setManualOccasion(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-150 dark:border-neutral-805 bg-neutral-25 dark:bg-neutral-900 text-neutral-850 dark:text-neutral-200 focus:outline-none focus:border-indigo-600"
                    >
                      {occasions.filter(o => o !== 'all').map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-505 uppercase mb-1">Image URL (Or will use uploaded file preview)</label>
                  <input
                    id="manual-input-url"
                    type="text"
                    placeholder="E.g., https://unsplash.com/... or paste link"
                    value={manualImageUrl}
                    onChange={(e) => setManualImageUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-150 dark:border-neutral-800 bg-neutral-25 dark:bg-neutral-900 text-neutral-850 dark:text-neutral-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-505 uppercase mb-1">Styling Tags (Comma-separated)</label>
                  <input
                    id="manual-input-tags"
                    type="text"
                    placeholder="E.g., minimal, warm, linen, essential"
                    value={manualTagsText}
                    onChange={(e) => setManualTagsText(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-150 dark:border-neutral-800 bg-neutral-25 dark:bg-neutral-900 text-neutral-850 dark:text-neutral-200 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <button
                  id="manual-option-submit"
                  type="submit"
                  disabled={isUploading}
                  className="w-full py-3.5 px-4 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 dark:text-black text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-black/30 dark:border-t-black rounded-full animate-spin"></span>
                      <span>Adding garment...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Confirm & Add To Closet</span>
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-center text-[10px] text-neutral-400">
              ⚡ All logged pieces are instantly compiled into the active outfit generator logic.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
