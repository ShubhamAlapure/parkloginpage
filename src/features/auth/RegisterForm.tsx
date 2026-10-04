import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, Check, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { registerSchema, RegisterFormData } from './schemas';
import { authService } from './authService';
import { PasswordStrength } from './PasswordStrength';
import { useAppStore } from '@/app/store';

export const RegisterForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const {
    setIsSubmitting,
    isSubmitting,
    setIsSuccess,
    isSuccess,
    setUserName,
    setUserEmail,
    setCameraFocusTarget,
    setAuthMode,
  } = useAppStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setCameraFocusTarget('success');

    try {
      const res = await authService.register(data);
      if (res.success) {
        setUserName(data.fullName);
        setUserEmail(data.email);
        setIsSuccess(true);

        confetti({
          particleCount: 100,
          spread: 80,
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
      className="w-full space-y-4"
    >
      <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-3.5" noValidate>
        {/* Full Name */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.04 }}
          className="space-y-1"
        >
          <label className="block text-xs font-semibold uppercase tracking-wider text-park-forest/80">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-park-forest/50">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              autoComplete="name"
              placeholder="Claude Monet"
              {...register('fullName')}
              onFocus={() => setCameraFocusTarget('name')}
              onBlur={() => setCameraFocusTarget('default')}
              className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm glass-input placeholder-park-forest/35 text-park-forest font-medium ${
                errors.fullName ? 'input-error' : ''
              }`}
            />
          </div>
          <AnimatePresence>
            {errors.fullName && (
              <motion.p
                initial={{ opacity: 0, height: 0, y: -4 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -4 }}
                className="text-xs text-red-600 font-medium pl-1"
              >
                {errors.fullName.message}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Email Address */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.08 }}
          className="space-y-1"
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
              placeholder="artist@parkhaven.art"
              {...register('email')}
              onFocus={() => setCameraFocusTarget('email')}
              onBlur={() => setCameraFocusTarget('default')}
              className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm glass-input placeholder-park-forest/35 text-park-forest font-medium ${
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

        {/* Password */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.12 }}
          className="space-y-1"
        >
          <label className="block text-xs font-semibold uppercase tracking-wider text-park-forest/80">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-park-forest/50">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Create strong password"
              {...register('password')}
              onFocus={() => setCameraFocusTarget('password')}
              onBlur={() => setCameraFocusTarget('default')}
              className={`w-full pl-10 pr-10 py-2 rounded-xl text-sm glass-input placeholder-park-forest/35 text-park-forest font-medium ${
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
          {/* Password strength bar */}
          <PasswordStrength password={passwordValue} />
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

        {/* Confirm Password */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.16 }}
          className="space-y-1"
        >
          <label className="block text-xs font-semibold uppercase tracking-wider text-park-forest/80">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-park-forest/50">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Re-enter password"
              {...register('confirmPassword')}
              onFocus={() => setCameraFocusTarget('password')}
              onBlur={() => setCameraFocusTarget('default')}
              className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm glass-input placeholder-park-forest/35 text-park-forest font-medium ${
                errors.confirmPassword ? 'input-error' : ''
              }`}
            />
          </div>
          <AnimatePresence>
            {errors.confirmPassword && (
              <motion.p
                initial={{ opacity: 0, height: 0, y: -4 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -4 }}
                className="text-xs text-red-600 font-medium pl-1"
              >
                {errors.confirmPassword.message}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Terms Agreement */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.2 }}
          className="space-y-1 pt-0.5"
        >
          <div className="flex items-start space-x-2">
            <input
              type="checkbox"
              id="agreeTerms"
              {...register('agreeTerms')}
              className="w-4 h-4 mt-0.5 rounded border-park-sage/40 text-park-forest focus:ring-park-sage accent-park-forest cursor-pointer"
            />
            <label htmlFor="agreeTerms" className="text-xs text-park-forest/75 select-none cursor-pointer">
              I agree to the <span className="underline text-park-forest font-medium">Terms of Artistry</span> &{' '}
              <span className="underline text-park-forest font-medium">Park Privacy</span>
            </label>
          </div>
          <AnimatePresence>
            {errors.agreeTerms && (
              <motion.p
                initial={{ opacity: 0, height: 0, y: -4 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -4 }}
                className="text-xs text-red-600 font-medium pl-1"
              >
                {errors.agreeTerms.message}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.24 }}
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
                  <span className="font-semibold">Artist Membership Created!</span>
                </motion.div>
              ) : isSubmitting ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center space-x-2"
                >
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Preparing your easel...</span>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center space-x-2"
                >
                  <span>Create Artist Account</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </motion.div>
      </form>

      {/* Switch to login */}
      <div className="text-center pt-1">
        <p className="text-xs text-park-forest/70">
          Already have an easel reserved?{' '}
          <button
            type="button"
            onClick={() => setAuthMode('login')}
            className="font-semibold text-park-terracotta hover:text-park-terracotta-dark underline ml-1 transition-colors"
          >
            Sign in
          </button>
        </p>
      </div>
    </motion.div>
  );
};
