import React, { useState } from 'react';
import { Sparkles, ArrowRight, UserPlus, LogIn, Mail, Lock, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface AuthViewProps {
  onAuthSuccess: (user: User, token: string) => void;
}

export default function AuthView({ onAuthSuccess }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');
    setInfo('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin ? { email, password } : { email, name, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      onAuthSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Network connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setInfo('');
  };

  return (
    <div id="auth-viewport" className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md">
        {/* Logo and Intro branding */}
        <div id="auth-branding" className="text-center mb-8 flex flex-col items-center">
          <div className="w-12 h-12 bg-black dark:bg-neutral-200 rounded-xl flex items-center justify-center mb-4">
            <span className="text-white dark:text-black font-extrabold text-xl">W</span>
          </div>
          <h1 className="font-sans font-bold text-2xl tracking-tight text-neutral-950 dark:text-white mb-1">
            SmartWardrobe
          </h1>
          <p className="font-sans text-xs text-neutral-600 dark:text-neutral-300 font-semibold tracking-wide">
            Next-generation AI Digital Capsule Wardrobe & Outfitting
          </p>
        </div>

        {/* Auth form Card */}
        <div id="auth-card" className="bg-white dark:bg-neutral-905 border border-neutral-200 dark:border-neutral-850 rounded-[2rem] shadow-sm p-8 transition-all duration-300">
          <h2 className="text-lg font-bold text-neutral-850 dark:text-neutral-150 mb-6 flex items-center gap-2">
            {isLogin ? <LogIn className="h-5 w-5 text-black dark:text-white" /> : <UserPlus className="h-5 w-5 text-black dark:text-white" />}
            <span>{isLogin ? 'Welcome Back' : 'Create Account'}</span>
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-955/20 border border-red-100 dark:border-red-900/40 text-red-650 dark:text-red-400 text-xs rounded-xl font-medium leading-relaxed">
              {error}
            </div>
          )}

          {info && (
            <div className="mb-4 p-3 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs rounded-xl font-medium leading-relaxed">
              {info}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-[10px] font-bold text-neutral-450 dark:text-neutral-400 uppercase tracking-widest mb-1.5">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    id="auth-input-name"
                    type="text"
                    required
                    placeholder="E.g., Audrey Hepburn"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-neutral-150 dark:border-neutral-800 bg-neutral-25 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-neutral-450 dark:text-neutral-400 uppercase tracking-widest mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  id="auth-input-email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-neutral-150 dark:border-neutral-800 bg-neutral-25 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-450 dark:text-neutral-400 uppercase tracking-widest mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  id="auth-input-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-neutral-150 dark:border-neutral-800 bg-neutral-25 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                />
              </div>
            </div>

            <button
              id="auth-submit-button"
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 dark:text-black text-white py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all focus:outline-none disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-black/30 dark:border-t-black rounded-full animate-spin"></span>
                  Processing...
                </span>
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Seed demo alert */}
          <div className="mt-6 pt-6 border-t border-neutral-150 text-center text-xs">
            <span className="text-neutral-450">{isLogin ? "New to SmartWardrobe? " : "Already have an account? "}</span>
            <button
              id="auth-mode-toggle"
              type="button"
              onClick={toggleAuthMode}
              className="text-black dark:text-white underline font-bold"
            >
              {isLogin ? 'Register now' : 'Sign in here'}
            </button>
          </div>
          
          <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl text-center">
            <p className="text-[10px] text-neutral-600 dark:text-neutral-300 leading-normal">
              💡 Registering automatically seeds your wardrobe with 6 high-fashion demo garments (Tops, Denim, Leather Biker Jacket, Trench Coat) so you can test outfit styling immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
