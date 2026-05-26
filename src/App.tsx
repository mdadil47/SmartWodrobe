import { useState, useEffect } from 'react';
import { Sparkles, Loader, Menu, Shirt } from 'lucide-react';
import Sidebar from './components/Sidebar';
import AuthView from './components/AuthView';
import DashboardView from './components/DashboardView';
import WardrobeView from './components/WardrobeView';
import OutfitView from './components/OutfitView';
import PlannerView from './components/PlannerView';
import ProfileView from './components/ProfileView';
import { User, WardrobeItem, Outfit, PlannedOutfit } from './types';

export default function App() {
  // Authentication states
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Core application states
  const [currentView, setCurrentView] = useState<'dashboard' | 'wardrobe' | 'outfits' | 'planner' | 'profile'>('dashboard');
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([]);
  const [plans, setPlans] = useState<PlannedOutfit[]>([]);
  
  // Mobile responsive sidebar drawer toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dashboard navigation pre-selections
  const [quickTriggerWeather, setQuickTriggerWeather] = useState<string | undefined>(undefined);

  // Dark mode styling state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('smartwardrobe_dark_mode');
    return saved ? JSON.parse(saved) : false;
  });

  // Load credentials from local storage on startup
  useEffect(() => {
    const storedUser = localStorage.getItem('smartwardrobe_user');
    const storedToken = localStorage.getItem('smartwardrobe_token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setAuthLoading(false);
  }, []);

  // Fetch DB data elements when token changes or user log-in successful
  useEffect(() => {
    if (token) {
      fetchWardrobe();
      fetchOutfits();
      fetchPlans();
    } else {
      setWardrobe([]);
      setSavedOutfits([]);
      setPlans([]);
    }
  }, [token]);

  // Adjust DOM classes for premium dark theme support
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('smartwardrobe_dark_mode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Network Fetch methods
  const fetchWardrobe = async () => {
    try {
      const response = await fetch('/api/wardrobe', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setWardrobe(data.items || []);
      }
    } catch (err) {
      console.error('Failed to load wardrobe:', err);
    }
  };

  const fetchOutfits = async () => {
    try {
      const response = await fetch('/api/outfits', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setSavedOutfits(data.outfits || []);
      }
    } catch (err) {
      console.error('Failed to load layouts:', err);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/planner', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setPlans(data.planner || []);
      }
    } catch (err) {
      console.error('Failed to load agenda planner:', err);
    }
  };

  // Auth Operations
  const handleAuthSuccess = (authUser: User, authToken: string) => {
    localStorage.setItem('smartwardrobe_user', JSON.stringify(authUser));
    localStorage.setItem('smartwardrobe_token', authToken);
    setUser(authUser);
    setToken(authToken);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('smartwardrobe_user');
    localStorage.removeItem('smartwardrobe_token');
    setUser(null);
    setToken(null);
    setCurrentView('dashboard');
  };

  // State modification callbacks
  const handleAddItem = (newItem: WardrobeItem) => {
    setWardrobe(prev => [newItem, ...prev]);
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/wardrobe/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        // Redraw list
        setWardrobe(prev => prev.filter(item => item.id !== itemId));
        // Remove outfit combo items that references deleted item or delete outfits entirely
        fetchOutfits();
        fetchPlans();
      }
    } catch (err) {
      console.error('Error deleting closet item:', err);
    }
  };

  const handleSaveOutfit = (newOutfit: Outfit) => {
    setSavedOutfits(prev => [newOutfit, ...prev]);
  };

  const handleDeleteOutfit = (outfitId: string) => {
    setSavedOutfits(prev => prev.filter(o => o.id !== outfitId));
    // Clean associated scheduled planner indicators if removed
    setPlans(prev => prev.filter(p => p.outfitId !== outfitId));
  };

  const handlePlanOutfit = (newPlan: PlannedOutfit) => {
    setPlans(prev => {
      // Clean existing scheduled plans for that date
      const filtered = prev.filter(p => p.date !== newPlan.date);
      return [...filtered, newPlan];
    });
  };

  const handleDeletePlan = (planId: string) => {
    setPlans(prev => prev.filter(p => p.id !== planId));
  };

  // Manual seed populated from Profile tab
  const handleSeedWardrobe = async () => {
    try {
      const response = await fetch('/api/wardrobe/seed', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setWardrobe(data.items || []);
        fetchOutfits();
      }
    } catch (err) {
      console.error('Failed to write dummy seed capsule items:', err);
    }
  };

  // Quick CTA link trigger on Dashboard
  const handleTriggerQuickStyle = (weather: string, occasion: string) => {
    setQuickTriggerWeather(weather);
    setCurrentView('outfits');
  };

  const onToggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Render view coordinator
  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            wardrobe={wardrobe}
            outfits={savedOutfits}
            onTriggerQuickStyle={handleTriggerQuickStyle}
            user={user}
          />
        );
      case 'wardrobe':
        return (
          <WardrobeView
            items={wardrobe}
            onAddItem={handleAddItem}
            onDeleteItem={handleDeleteItem}
            token={token}
          />
        );
      case 'outfits':
        return (
          <OutfitView
            wardrobe={wardrobe}
            savedOutfits={savedOutfits}
            onSaveOutfit={handleSaveOutfit}
            onDeleteOutfit={handleDeleteOutfit}
            token={token}
            quickTriggerWeather={quickTriggerWeather}
          />
        );
      case 'planner':
        return (
          <PlannerView
            savedOutfits={savedOutfits}
            plans={plans}
            onPlanOutfit={handlePlanOutfit}
            onDeletePlan={handleDeletePlan}
            token={token}
          />
        );
      case 'profile':
        return (
          <ProfileView
            user={user}
            wardrobe={wardrobe}
            outfits={savedOutfits}
            plans={plans}
            onSeedWardrobe={handleSeedWardrobe}
            onLogout={handleLogout}
            darkMode={darkMode}
            onToggleDarkMode={onToggleDarkMode}
          />
        );
      default:
        return <div>View not found</div>;
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-neutral-25 dark:bg-neutral-950">
        <Loader className="h-8 w-8 text-black dark:text-white animate-spin mb-3" />
        <span className="text-xs text-neutral-450 font-semibold font-mono tracking-wider">Syncing digital wardrobe credentials...</span>
      </div>
    );
  }

  // If unauthenticated, display register/login views
  if (!user || !token) {
    return <AuthView onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="flex flex-col md:flex-row bg-neutral-25 dark:bg-neutral-955 min-h-screen text-neutral-800 dark:text-neutral-100 transition-colors duration-300">
      
      {/* Mobile Top Bar (Header) */}
      <header className="flex md:hidden items-center justify-between p-4 bg-white dark:bg-neutral-900 border-b border-neutral-150 dark:border-neutral-800 sticky top-0 z-30 w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black dark:bg-neutral-200 rounded-lg flex items-center justify-center">
            <span className="text-white dark:text-black font-bold text-sm">W</span>
          </div>
          <div>
            <span className="font-sans font-bold text-sm tracking-tight text-neutral-900 dark:text-neutral-100 block">SmartWardrobe</span>
            <span className="font-mono text-[8px] text-neutral-400 dark:text-neutral-500 font-semibold uppercase tracking-wider block">STYLE ENGINE</span>
          </div>
        </div>

        <button
          onClick={() => setSidebarOpen(true)}
          className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-lg cursor-pointer transition-colors"
          title="Open Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Structural Sidebar Drawer */}
      <Sidebar
        currentView={currentView}
        onViewChange={(view: any) => {
          // Clear dashboard trigger when toggling tabs manually
          if (view !== 'outfits') {
            setQuickTriggerWeather(undefined);
          }
          setCurrentView(view);
        }}
        user={user}
        onLogout={handleLogout}
        darkMode={darkMode}
        onToggleDarkMode={onToggleDarkMode}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main viewport block container */}
      <main id="app-viewport-wrapper" className="flex-1 ml-0 md:ml-64 p-4 md:p-8 min-h-screen overflow-x-hidden">
        <div className="max-w-6xl mx-auto py-2">
          {renderActiveView()}
        </div>
      </main>

    </div>
  );
}
