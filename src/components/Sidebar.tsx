import { 
  LayoutDashboard, 
  Sparkles, 
  CalendarDays, 
  User as UserIcon, 
  LogOut, 
  Sun, 
  Moon,
  Shirt,
  X
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  user: User | null;
  onLogout: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  currentView,
  onViewChange,
  user,
  onLogout,
  darkMode,
  onToggleDarkMode,
  isOpen,
  onClose
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'wardrobe', label: 'My Wardrobe', icon: Shirt },
    { id: 'outfits', label: 'AI Outfit Generator', icon: Sparkles },
    { id: 'planner', label: 'Outfit Planner', icon: CalendarDays },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs z-30 md:hidden transition-opacity duration-300"
        />
      )}

      <aside 
        id="sidebar-container" 
        className={`fixed top-0 left-0 h-screen w-64 border-r border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col justify-between z-40 transition-transform duration-300 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Branding & Logo */}
        <div id="sidebar-header" className="p-6 pb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black dark:bg-neutral-200 rounded-xl flex items-center justify-center">
              <span className="text-white dark:text-black font-bold text-lg">W</span>
            </div>
            <div>
              <span className="font-sans font-bold text-lg tracking-tight text-neutral-900 dark:text-neutral-100 block leading-tight">SmartWardrobe</span>
              <span className="font-mono text-[9px] text-neutral-400 dark:text-neutral-500 font-semibold uppercase tracking-widest block mt-0.5">AI STYLE ENGINE</span>
            </div>
          </div>

          {/* Close button inside sidebar on mobile screens */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 rounded-lg cursor-pointer transition-colors"
            title="Close Menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav id="sidebar-nav" className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                id={`nav-item-${item.id}`}
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  onClose(); // Automatically collapse on touch selection
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left text-sm font-medium cursor-pointer ${
                  isActive 
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white shadow-none font-semibold'
                    : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 hover:text-black dark:hover:text-white'
                }`}
              >
                <Icon className={`h-5 w-5 stroke-[1.5] ${isActive ? 'text-black dark:text-white' : 'text-neutral-400 dark:text-neutral-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Status / Theme Switch / Logout Section */}
        <div id="sidebar-footer" className="p-4 border-t border-neutral-150 dark:border-neutral-800 space-y-3 bg-neutral-50/50 dark:bg-neutral-900/50" prefix="nav-foot">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-black dark:bg-neutral-800 flex items-center justify-center font-bold text-xs text-white uppercase">
                {user?.name ? user.name.slice(0, 2) : 'US'}
              </div>
              <div className="overflow-hidden max-w-[120px]">
                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block truncate">{user?.name || 'User Profile'}</span>
                <span className="text-[10px] text-neutral-400 block truncate">{user?.email || 'user@example.com'}</span>
              </div>
            </div>

            {/* Theme Toggle Button */}
            <button
              id="theme-toggle"
              onClick={onToggleDarkMode}
              className="p-1.5 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-750 cursor-pointer transition-colors"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          {/* Logout Trigger */}
          <button
            id="logout-button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-neutral-50 hover:bg-red-50 dark:bg-neutral-800 dark:hover:bg-red-955/30 text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all text-xs font-medium border border-neutral-100 dark:border-neutral-850 cursor-pointer"
          >
            <LogOut className="h-4 w-4 stroke-[1.8]" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
