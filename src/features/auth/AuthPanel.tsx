import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Sunset, Moon, Sparkles, Volume2, VolumeX, Eye, Palette, Layers, RefreshCw } from 'lucide-react';
import { useAppStore, AuthMode, TimeOfDay, QualityTier } from '@/app/store';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

export const AuthPanel: React.FC = () => {
  const {
    authMode,
    setAuthMode,
    timeOfDay,
    setTimeOfDay,
    qualityTier,
    setQualityTier,
    reducedMotion,
    setReducedMotion,
    isSuccess,
    setIsSuccess,
    userEmail,
    userName,
    activePainterColor,
  } = useAppStore();

  const timeOptions: { id: TimeOfDay; label: string; icon: React.ReactNode }[] = [
    { id: 'day', label: 'Noon', icon: <Sun className="w-3.5 h-3.5 text-amber-500" /> },
    { id: 'golden', label: 'Golden', icon: <Sun className="w-3.5 h-3.5 text-park-gold" /> },
    { id: 'sunset', label: 'Sunset', icon: <Sunset className="w-3.5 h-3.5 text-park-terracotta" /> },
    { id: 'night', label: 'Night', icon: <Moon className="w-3.5 h-3.5 text-indigo-400" /> },
  ];

  return (
    <motion.aside
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="w-full h-full flex flex-col justify-between p-6 sm:p-8 z-20 glass-panel overflow-y-auto relative shadow-2xl"
    >
      {/* Top Header & Logo */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          {/* Logo Brand */}
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-2xl bg-park-forest flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6 text-park-gold"
              >
                {/* Stylized leaf + brush tip */}
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                <circle cx="17.5" cy="6.5" r="1.5" fill="#D9765B" stroke="none" />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-park-forest">
                  Park Haven
                </span>
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block animate-pulse"
                  style={{ backgroundColor: activePainterColor }}
                  title="Live Painter Color"
                />
              </div>
              <p className="text-[11px] font-medium tracking-wide uppercase text-park-sage-dark">
                The Living Canvas
              </p>
            </div>
          </div>

          {/* Time of day quick selector */}
          <div className="flex items-center bg-park-forest/5 p-1 rounded-xl border border-park-sage/20">
            {timeOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setTimeOfDay(opt.id)}
                title={`Switch to ${opt.label} light`}
                className={`p-1.5 rounded-lg transition-all duration-200 relative ${
                  timeOfDay === opt.id
                    ? 'bg-white shadow-xs text-park-forest scale-105'
                    : 'text-park-forest/50 hover:text-park-forest'
                }`}
              >
                {opt.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Hero Tagline */}
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-park-forest leading-tight">
            {isSuccess
              ? `Welcome, ${userName || userEmail.split('@')[0]}!`
              : authMode === 'login'
              ? 'Step into the park.'
              : 'Claim your easel.'}
          </h1>
          <p className="text-xs sm:text-sm text-park-forest/70 mt-1 font-normal">
            {isSuccess
              ? 'Your canvas is live. Observe the painters in real-time.'
              : authMode === 'login'
              ? 'Watch the painters capture the afternoon light while you sign in.'
              : 'Join a community of observers, painters, and park enthusiasts.'}
          </p>
        </div>

        {/* Authenticated Success Card */}
        {isSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 rounded-2xl bg-white/80 border border-park-sage/30 space-y-4 shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-park-sage/30 flex items-center justify-center text-park-forest font-serif font-bold text-lg">
                {(userName || userEmail || 'P').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-park-forest">{userName || 'Park Explorer'}</p>
                <p className="text-xs text-park-forest/60">{userEmail || 'artlover@parkhaven.art'}</p>
              </div>
            </div>

            <div className="p-3 bg-park-cream rounded-xl text-xs space-y-1.5 text-park-forest/80 border border-park-sage/20">
              <p className="font-medium flex items-center space-x-1.5">
                <Palette className="w-3.5 h-3.5 text-park-terracotta" />
                <span>Active Painter Palette: In Progress</span>
              </p>
              <p className="text-[11px] text-park-forest/65">
                Watch the painter on the left lawn dip brushes and render the landscape onto the wooden easel!
              </p>
            </div>

            <button
              onClick={() => setIsSuccess(false)}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl border border-park-forest/20 hover:bg-park-forest/5 text-xs font-semibold text-park-forest transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Switch Account / Sign Out</span>
            </button>
          </motion.div>
        ) : (
          <>
            {/* Tab Switcher */}
            <div className="relative flex p-1 bg-park-forest/5 rounded-2xl border border-park-sage/25">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`relative flex-1 py-2 text-xs sm:text-sm font-semibold transition-colors duration-200 z-10 ${
                  authMode === 'login' ? 'text-park-forest' : 'text-park-forest/55 hover:text-park-forest'
                }`}
              >
                Sign In
                {authMode === 'login' && (
                  <motion.div
                    layoutId="activeAuthTab"
                    className="absolute inset-0 bg-white rounded-xl shadow-xs -z-10"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
              </button>

              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`relative flex-1 py-2 text-xs sm:text-sm font-semibold transition-colors duration-200 z-10 ${
                  authMode === 'register' ? 'text-park-forest' : 'text-park-forest/55 hover:text-park-forest'
                }`}
              >
                Join Park
                {authMode === 'register' && (
                  <motion.div
                    layoutId="activeAuthTab"
                    className="absolute inset-0 bg-white rounded-xl shadow-xs -z-10"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
              </button>
            </div>

            {/* Morphing Form Container */}
            <div className="relative overflow-hidden py-1">
              <AnimatePresence mode="wait" initial={false}>
                {authMode === 'login' ? (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.28, ease: 'easeInOut' }}
                  >
                    <LoginForm />
                  </motion.div>
                ) : (
                  <motion.div
                    key="register"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.28, ease: 'easeInOut' }}
                  >
                    <RegisterForm />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* Footer Controls & Live Status */}
      <div className="pt-6 border-t border-park-forest/10 mt-4 space-y-3 text-xs text-park-forest/65">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-medium text-[11px] text-park-forest/80">3D Simulation Active</span>
          </div>

          {/* Quality tier pills */}
          <div className="flex items-center space-x-1 bg-white/60 p-1 rounded-lg border border-park-sage/20 text-[10px] font-semibold">
            {(['low', 'medium', 'high'] as QualityTier[]).map((tier) => (
              <button
                key={tier}
                onClick={() => setQualityTier(tier)}
                className={`px-1.5 py-0.5 rounded capitalize transition-colors ${
                  qualityTier === tier ? 'bg-park-forest text-white' : 'text-park-forest/60 hover:text-park-forest'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-park-forest/50">
          <span>© 2026 Park Haven Studio</span>
          <button
            onClick={() => setReducedMotion(!reducedMotion)}
            className="hover:text-park-forest transition-colors underline"
          >
            {reducedMotion ? 'Enable Camera Drift' : 'Reduced Motion'}
          </button>
        </div>
      </div>
    </motion.aside>
  );
};
