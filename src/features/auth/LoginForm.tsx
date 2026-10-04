import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Check, Loader2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { loginSchema, LoginFormData } from './schemas';
import { authService } from './authService';
import { useAppStore } from '@/app/store';

export const LoginForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  
  const {
    setIsSubmitting,
    isSubmitting,
    setIsSuccess,
    isSuccess,
    setUserEmail,
    setCameraFocusTarget,
  } = useAppStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setCameraFocusTarget('success');
    
    try {
      const res = await authService.login(data);
      if (res.success) {
        setUserEmail(data.email);
        setIsSuccess(true);

        // Burst confetti celebration
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6, x: 0.25 },
          colors: ['#D9765B', '#9DB59A', '#F2C879', '#1F3A2D', '#BFE3F2'],
        });
      }
    } catch (err) {
      console.error(err);
      setShakeKey((k) => k + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onError = () => {
    setShakeKey((k) => k + 1);
  };

  return (
    <motion.div
      key={shakeKey}
      animate={{ x: [0, -8, 8, -6, 6, -3, 3, 0] }}
      transition={{ duration: 0.45, ease: 'easeInOut' }}
      className="w-full space-y-5"
    >
      <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4" noValidate>
        {/* Email Field */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="space-y-1.5"
        >
          <label className="block text-xs font-semibold uppercase tracking-wider text-park-forest/80">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-park-forest/50">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              autoComplete="email"
              placeholder="artlover@parkhaven.art"
              {...register('email')}
              onFocus={() => setCameraFocusTarget('email')}
              onBlur={() => setCameraFocusTarget('default')}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm glass-input placeholder-park-forest/35 text-park-forest font-medium ${
                errors.email ? 'input-error' : ''
              }`}
            />
          </div>
          <AnimatePresence>
            {errors.email && (
              <motion.p
                initial={{ opacity: 0, height: 0, y: -4 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -4 }}
                className="text-xs text-red-600 font-medium pl-1"
              >
                {errors.email.message}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Password Field */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-park-forest/80">
              Password
            </label>
            <button
              type="button"
              className="text-xs font-medium text-park-terracotta hover:text-park-terracotta-dark transition-colors"
              onClick={() => alert('Password reset link sent to your simulated email.')}
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-park-forest/50">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              {...register('password')}
              onFocus={() => setCameraFocusTarget('password')}
              onBlur={() => setCameraFocusTarget('default')}
              className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-sm glass-input placeholder-park-forest/35 text-park-forest font-medium ${
                errors.password ? 'input-error' : ''
              }`}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-park-forest/50 hover:text-park-forest transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <AnimatePresence>
            {errors.password && (
              <motion.p
                initial={{ opacity: 0, height: 0, y: -4 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -4 }}
                className="text-xs text-red-600 font-medium pl-1"
              >
                {errors.password.message}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Remember Me Checkbox */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="flex items-center space-x-2 pt-1"
        >
          <input
            type="checkbox"
            id="rememberMe"
            {...register('rememberMe')}
            className="w-4 h-4 rounded border-park-sage/40 text-park-forest focus:ring-park-sage accent-park-forest cursor-pointer"
          />
          <label htmlFor="rememberMe" className="text-xs text-park-forest/75 select-none cursor-pointer">
            Remember my easel session on this device
          </label>
        </motion.div>

        {/* Primary CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="pt-2"
        >
          <button
            type="submit"
            disabled={isSubmitting || isSuccess}
            className="w-full relative overflow-hidden group bg-park-forest hover:bg-park-forest-light text-park-cream font-medium py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 btn-primary-shine disabled:opacity-85"
          >
            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center space-x-2 text-park-gold"
                >
                  <Check className="w-5 h-5 stroke-[2.5]" />
                  <span className="font-semibold">Welcome to Park Haven!</span>
                </motion.div>
              ) : isSubmitting ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center space-x-2"
                >
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Entering the park...</span>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center space-x-2"
                >
                  <span>Sign In to Canvas</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </motion.div>
      </form>

      {/* Divider */}
      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-park-forest/15"></div>
        <span className="flex-shrink mx-3 text-xs uppercase tracking-wider text-park-forest/50 font-medium">
          or explore with
        </span>
        <div className="flex-grow border-t border-park-forest/15"></div>
      </div>

      {/* Social Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            setUserEmail('google.user@example.com');
            setIsSuccess(true);
            confetti();
          }}
          className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl glass-input hover:bg-white/90 text-xs font-semibold text-park-forest/80 hover:text-park-forest transition-all duration-200"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.4 8.9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
            />
            <path
              fill="#FBBC05"
              d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.6 6.4C.6 8.4 0 10.6 0 13s.6 4.6 1.6 6.6l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.4-6.7-5.3L1.6 16c1.9 3.8 5.8 7 10.4 7z"
            />
          </svg>
          <span>Google</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setUserEmail('github.artist@example.com');
            setIsSuccess(true);
            confetti();
          }}
          className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl glass-input hover:bg-white/90 text-xs font-semibold text-park-forest/80 hover:text-park-forest transition-all duration-200"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span>GitHub</span>
        </button>
      </div>
    </motion.div>
  );
};
