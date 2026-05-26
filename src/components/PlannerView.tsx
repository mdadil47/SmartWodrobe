import React, { useState } from 'react';
import { 
  CalendarDays, 
  Plus, 
  Trash2, 
  Clock, 
  Shirt, 
  MapPin, 
  Info,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { Outfit, PlannedOutfit } from '../types';

interface PlannerViewProps {
  savedOutfits: Outfit[];
  plans: PlannedOutfit[];
  onPlanOutfit: (plan: { date: string; outfitId: string; occasion: string; notes?: string }) => void;
  onDeletePlan: (id: string) => void;
  token: string | null;
}

export default function PlannerView({
  savedOutfits,
  plans,
  onPlanOutfit,
  onDeletePlan,
  token
}: PlannerViewProps) {
  const [selectedOutfitId, setSelectedOutfitId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [plannedOccasion, setPlannedOccasion] = useState('Casual');
  const [plannedNotes, setPlannedNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Weekly offset for scrolling
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  // Generate current week dates
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + i + currentWeekOffset * 7);
    return {
      name: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateStr: d.toISOString().split('T')[0],
      dayNum: d.getDate(),
      monthName: d.toLocaleDateString('en-US', { month: 'short' })
    };
  });

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedOutfitId) {
      setError('Please select an outfit to schedule.');
      return;
    }

    try {
      const response = await fetch('/api/planner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: selectedDate,
          outfitId: selectedOutfitId,
          occasion: plannedOccasion,
          notes: plannedNotes
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit plan.');
      }

      onPlanOutfit(data.plan);
      setSuccess('Outfit successfully scheduled for selected date!');
      setSelectedOutfitId('');
      setPlannedNotes('');
      // Reset success message
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Error scheduling outfit.');
    }
  };

  const handleRemovePlan = async (planId: string) => {
    try {
      const response = await fetch(`/api/planner/${planId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel plan.');
      }

      onDeletePlan(planId);
    } catch (err: any) {
      alert(err.message || 'Failed to delete planned slot.');
    }
  };

  return (
    <div id="planner-viewport" className="space-y-6">
      
      {/* Header element */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-neutral-850 dark:text-neutral-100">Outfit Calendar Planner</h2>
          <p className="text-xs text-neutral-450 dark:text-neutral-400">Organize and schedule your ensembles ahead of time to streamline morning selections.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Calendar visual board grids */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-905 border border-neutral-200 dark:border-neutral-850 rounded-[2rem] p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <CalendarDays className="h-4.5 w-4.5 text-black dark:text-white" />
              <span>Weekly Schedule</span>
            </h3>

            {/* Pagination keys */}
            <div className="flex items-center bg-neutral-50 dark:bg-neutral-850 p-1 rounded-lg gap-1 border border-neutral-100 dark:border-neutral-800 text-neutral-500">
              <button
                id="prev-week-btn"
                onClick={() => setCurrentWeekOffset(prev => prev - 1)}
                className="p-1 hover:bg-white dark:hover:bg-neutral-800 rounded text-neutral-600 dark:text-neutral-300 transition-colors"
                title="Previous Week"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-[10px] font-bold px-1 uppercase tracking-tight">Week Offset</span>
              <button
                id="next-week-btn"
                onClick={() => setCurrentWeekOffset(prev => prev + 1)}
                className="p-1 hover:bg-white dark:hover:bg-neutral-800 rounded text-neutral-600 dark:text-neutral-300 transition-colors"
                title="Next Week"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Agenda Grid slots */}
          <div className="space-y-4">
            {weekDays.map((day) => {
              // Find if this day has a plan
              const dayPlan = plans.find(p => p.date === day.dateStr);
              // Find matching outfit
              const matchedOutfit = dayPlan ? savedOutfits.find(o => o.id === dayPlan.outfitId) : null;

              return (
                <div
                  id={`planner-day-row-${day.dateStr}`}
                  key={day.dateStr}
                  className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${
                    dayPlan 
                      ? 'bg-neutral-50 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700' 
                      : 'bg-neutral-25/55 dark:bg-neutral-900/40 border-neutral-100 dark:border-neutral-800/50'
                  }`}
                >
                  {/* Date indicator block */}
                  <div className="flex items-center gap-4 min-w-[110px]">
                    <div className="text-center bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-750 rounded-xl p-2.5 w-12 h-12 flex flex-col items-center justify-center shadow-sm">
                      <span className="text-[9px] uppercase tracking-wider text-neutral-600 dark:text-neutral-300 font-bold block leading-none">{day.name}</span>
                      <span className="text-sm font-extrabold text-neutral-800 dark:text-neutral-100 block leading-none mt-1">{day.dayNum}</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-neutral-705 dark:text-neutral-300 block">{day.monthName}</span>
                      <span className="text-[10px] text-neutral-600 dark:text-neutral-400 font-mono tracking-tight mt-0.5 block">{day.dateStr}</span>
                    </div>
                  </div>

                  {/* Planned output content slot */}
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {matchedOutfit ? (
                      <div className="flex items-center gap-4 flex-1">
                        {/* Grouped thumbnails */}
                        <div className="flex gap-1.5 overflow-x-auto max-w-[140px] shrink-0 border-r border-neutral-150 dark:border-neutral-805 pr-3 scrollbar-none">
                          {matchedOutfit.items.slice(0, 3).map((item) => (
                            <div key={item.id} className="w-9 h-9 border border-neutral-200 dark:border-neutral-750 rounded-md overflow-hidden bg-white shrink-0">
                              <img
                                src={item.imageUrl}
                                alt={item.type}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ))}
                        </div>

                        <div>
                          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
                            <Shirt className="h-3.5 w-3.5 text-black dark:text-white" />
                            <span>{matchedOutfit.name}</span>
                          </span>
                          {dayPlan.notes && (
                            <span className="text-[10px] text-neutral-600 dark:text-neutral-300 mt-1 block truncate max-w-[210px]">
                              📝 Notes: {dayPlan.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-neutral-500 dark:text-neutral-350 pl-3 block font-medium">No Outfit scheduled for this day</span>
                    )}

                    {/* Action buttons */}
                    <div>
                      {dayPlan ? (
                        <button
                          id={`delete-plan-${dayPlan.id}`}
                          onClick={() => handleRemovePlan(dayPlan.id)}
                          className="flex items-center gap-1 text-[11px] font-bold uppercase text-red-650 hover:underline px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-955/20 border border-transparent dark:border-neutral-800/20 rounded-xl"
                          title="Remove plan"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Reset Slot</span>
                        </button>
                      ) : (
                        <button
                          id={`quick-add-${day.dateStr}`}
                          onClick={() => {
                            setSelectedDate(day.dateStr);
                            // Highlight or focus selector
                            const element = document.getElementById('planner-form');
                            element?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-black dark:text-white underline px-3 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Schedule Outfit</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div id="planner-form" className="lg:col-span-1 bg-white dark:bg-neutral-905 border border-neutral-200 dark:border-neutral-850 rounded-[2rem] p-6 shadow-sm self-start">
          <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 mb-4">
            <Clock className="h-4.5 w-4.5 text-black dark:text-white" />
            <span>Map Daily Slot</span>
          </h3>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/25 border border-red-105 dark:border-red-900/40 text-red-655 dark:text-red-400 text-xs rounded-xl font-medium mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-neutral-105 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-205 text-xs rounded-xl font-medium mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handlePlanSubmit} className="space-y-4 text-xs font-sans">
            {/* Target Date Input */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-450 uppercase mb-1.5 tracking-wider">Selected Date</label>
              <input
                id="planner-input-date"
                type="date"
                required
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-150 dark:border-neutral-800 bg-neutral-25 dark:bg-neutral-900 text-neutral-850 dark:text-neutral-200 rounded-xl focus:outline-none focus:border-black dark:focus:border-white"
              />
            </div>

            {/* Favorite Outfit List selection dropdown */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-450 dark:text-neutral-300 uppercase mb-1.5 tracking-wider">Select Ensembles ({savedOutfits.length})</label>
              {savedOutfits.length === 0 ? (
                <div className="p-3 border border-dashed border-neutral-150 dark:border-neutral-800 rounded-xl text-center text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed bg-neutral-25/45">
                  🛡️ You haven't favorited any outfits yet. Please generate suggestions and click 'Save Combo' first.
                </div>
              ) : (
                <select
                  id="planner-select-outfit"
                  value={selectedOutfitId}
                  onChange={(e) => setSelectedOutfitId(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-150 dark:border-neutral-800 bg-neutral-25 dark:bg-neutral-900 text-neutral-850 dark:text-neutral-200 rounded-xl focus:outline-none focus:border-black dark:focus:border-white"
                >
                  <option value="">-- Choose Outfit Combination --</option>
                  {savedOutfits.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Target Occasion context */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-450 dark:text-neutral-300 uppercase mb-1.5 tracking-wider">Scheduled Event / Occasion</label>
              <select
                id="planner-select-occasion"
                value={plannedOccasion}
                onChange={(e) => setPlannedOccasion(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-150 dark:border-neutral-800 bg-neutral-25 dark:bg-neutral-900 text-neutral-850 dark:text-neutral-200 rounded-xl focus:outline-none focus:border-black dark:focus:border-white"
              >
                <option value="Casual">Casual Outerwear</option>
                <option value="Formal">Formal Gathering</option>
                <option value="Party">Social Night out</option>
                <option value="Athletic">Athletic Practice</option>
                <option value="Business">Business Engagement</option>
              </select>
            </div>

            {/* Quick logs */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-450 dark:text-neutral-300 uppercase mb-1.5 tracking-wider">Short Activity Log / Notes</label>
              <input
                id="planner-input-notes"
                type="text"
                placeholder="E.g., Dinner at 8pm with coworkers"
                value={plannedNotes}
                onChange={(e) => setPlannedNotes(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-150 dark:border-neutral-800 bg-neutral-25 dark:bg-neutral-900 text-neutral-850 dark:text-neutral-200 rounded-xl focus:outline-none focus:border-black dark:focus:border-white"
              />
            </div>

            <button
              id="plan-submit-btn"
              type="submit"
              disabled={savedOutfits.length === 0}
              className="w-full py-3.5 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 dark:text-black text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
            >
              <span>Commit To Agenda</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
