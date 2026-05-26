import { useState } from 'react';
import { 
  User as UserIcon, 
  Sparkles, 
  Trash2, 
  RefreshCw, 
  Database,
  CalendarDays,
  Shirt,
  Moon,
  Sun,
  ShieldCheck
} from 'lucide-react';
import { User, WardrobeItem, Outfit, PlannedOutfit } from '../types';

interface ProfileViewProps {
  user: User | null;
  wardrobe: WardrobeItem[];
  outfits: Outfit[];
  plans: PlannedOutfit[];
  onSeedWardrobe: () => void;
  onLogout: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function ProfileView({
  user,
  wardrobe,
  outfits,
  plans,
  onSeedWardrobe,
  onLogout,
  darkMode,
  onToggleDarkMode
}: ProfileViewProps) {
  const [isCleaning, setIsCleaning] = useState(false);
  const [success, setSuccess] = useState('');

  const triggerResetSeeding = async () => {
    setIsCleaning(true);
    setSuccess('');
    try {
      await onSeedWardrobe();
      setSuccess('Demo garments successfully seeded. Reload details updated!');
      setTimeout(() => setSuccess(''), 4000);
    } catch {
      // Catch
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div id="profile-viewport" className="space-y-6 max-w-4xl mx-auto">
      
      {/* Profile Overview Card */}
      <div className="bg-white dark:bg-neutral-905 border border-neutral-200 dark:border-neutral-850 rounded-[2rem] p-6 shadow-sm flex flex-col sm:flex-row items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-black dark:bg-white flex items-center justify-center font-extrabold text-lg text-white dark:text-black uppercase shrink-0">
          {user?.name ? user.name.slice(0, 2) : 'US'}
        </div>
        
        <div className="text-center sm:text-left flex-1 space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">{user?.name || 'SmartWardrobe User'}</h2>
            <span className="self-center font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border border-green-500/10 rounded-full font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-green-600" />
              <span>Verified Account</span>
            </span>
          </div>
          <p className="text-xs text-neutral-450">{user?.email || 'user@example.com'}</p>
          <span className="text-[10px] text-neutral-400 block pt-0.5">Joined Premium Capsule: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active Member'}</span>
        </div>
      </div>

      {/* Stats Board Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        <div className="bg-white dark:bg-neutral-905 border border-neutral-200 dark:border-neutral-850 rounded-[2rem] p-5 shadow-sm text-center">
          <Shirt className="h-5 w-5 text-black dark:text-white mx-auto" />
          <span className="text-xs text-neutral-450 dark:text-neutral-400 block font-medium mt-1">Closet Items</span>
          <span className="text-2xl font-extrabold text-neutral-800 dark:text-neutral-100 block mt-2">{wardrobe.length}</span>
        </div>

        <div className="bg-white dark:bg-neutral-905 border border-neutral-200 dark:border-neutral-850 rounded-[2rem] p-5 shadow-sm text-center">
          <Sparkles className="h-5 w-5 text-black dark:text-white mx-auto" />
          <span className="text-xs text-neutral-450 dark:text-neutral-400 block font-medium mt-1">Saved Outfits</span>
          <span className="text-2xl font-extrabold text-neutral-800 dark:text-neutral-100 block mt-2">{outfits.length}</span>
        </div>

        <div className="bg-white dark:bg-neutral-905 border border-neutral-200 dark:border-neutral-850 rounded-[2rem] p-5 shadow-sm text-center">
          <CalendarDays className="h-5 w-5 text-black dark:text-white mx-auto" />
          <span className="text-xs text-neutral-450 dark:text-neutral-400 block font-medium mt-1">Planned Days</span>
          <span className="text-2xl font-extrabold text-neutral-800 dark:text-neutral-100 block mt-2">{plans.length}</span>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* System Settings & Utilities */}
        <div className="bg-white dark:bg-neutral-905 border border-neutral-200 dark:border-neutral-850 rounded-[2rem] p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Preference Settings</h3>
          
          <div className="space-y-3 text-xs">
            {/* Theme Toggle section inside card too as requested */}
            <div className="flex items-center justify-between p-3.5 bg-neutral-50 dark:bg-neutral-900 rounded-xl">
              <div>
                <span className="font-semibold text-neutral-705 dark:text-neutral-200 block">Visual UI Appearance</span>
                <span className="text-[10px] text-neutral-400 block mt-0.5">Adjust dark/light layout conditions</span>
              </div>
              
              <button
                id="profile-theme-switch"
                onClick={onToggleDarkMode}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-750 text-xs font-semibold rounded-lg text-neutral-600 dark:text-neutral-200 cursor-pointer"
              >
                {darkMode ? (
                  <>
                    <Sun className="h-4 w-4 text-amber-500" />
                    <span>Light Theme Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 text-neutral-450" />
                    <span>Dark Theme Mode</span>
                  </>
                )}
              </button>
            </div>

            {/* Account Logout controller */}
            <div className="flex items-center justify-between p-3.5 bg-neutral-50 dark:bg-neutral-900 rounded-xl">
              <div>
                <span className="font-semibold text-neutral-705 dark:text-neutral-200 block">Disconnect Profile Session</span>
                <span className="text-[10px] text-neutral-400 block mt-0.5">Flush key credentials token</span>
              </div>
              
              <button
                id="profile-logout-btn"
                onClick={onLogout}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>

        {/* Database backup & Seed utilities (Helps user populate demo details again easily) */}
        <div className="bg-white dark:bg-neutral-905 border border-neutral-200 dark:border-neutral-850 rounded-[2rem] p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Database className="h-4 w-4 text-black dark:text-white" />
              <span>Demo Capsule Operations</span>
            </h3>
            <p className="text-xs text-neutral-450 leading-relaxed mt-2">
              If you cleared garments or wish to re-populate the standard smart closet examples (Linen shirts, slim denim jeans, trench coat models, premium boots) directly, execute re-seed.
            </p>
          </div>

          <div className="space-y-3 mt-4">
            {success && (
              <div className="p-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-850 dark:text-neutral-200 text-[11px] rounded-xl font-semibold border border-neutral-200 dark:border-neutral-750">
                {success}
              </div>
            )}

            <button
               id="reset-wardrobe-seed-btn"
              onClick={triggerResetSeeding}
              disabled={isCleaning}
              className="w-full py-2.5 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 dark:text-black text-white text-xs font-bold uppercase tracking-wider rounded-xl border border-transparent flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 text-white dark:text-black ${isCleaning ? 'animate-spin' : ''}`} />
              <span>Add Standard Fashion Seed Data</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
