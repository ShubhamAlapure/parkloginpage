import React from 'react';
import { motion } from 'framer-motion';

interface PasswordStrengthProps {
  password?: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password = '' }) => {
  const calculateScore = (pwd: string) => {
    let score = 0;
    if (!pwd) return 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd) || pwd.length >= 12) score += 1;
    return score;
  };

  const score = calculateScore(password);

  const getStrengthMeta = () => {
    switch (score) {
      case 1:
        return { label: 'Weak', color: 'bg-red-400', textColor: 'text-red-600' };
      case 2:
        return { label: 'Fair', color: 'bg-amber-400', textColor: 'text-amber-600' };
      case 3:
        return { label: 'Good', color: 'bg-emerald-400', textColor: 'text-emerald-700' };
      case 4:
        return { label: 'Strong & Secure', color: 'bg-park-forest', textColor: 'text-park-forest' };
      default:
        return { label: 'Too short', color: 'bg-gray-200', textColor: 'text-gray-400' };
    }
  };

  const { label, color, textColor } = getStrengthMeta();

  return (
    <div className="w-full space-y-1.5 mt-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-park-forest/60 font-medium">Password strength</span>
        {password && (
          <motion.span
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            className={`font-semibold ${textColor}`}
          >
            {label}
          </motion.span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-1.5 h-1.5">
        {[1, 2, 3, 4].map((step) => {
          const isActive = score >= step;
          return (
            <div key={step} className="h-full rounded-full bg-park-sage/20 overflow-hidden">
              <motion.div
                className={`h-full ${isActive ? color : 'bg-transparent'}`}
                initial={{ width: '0%' }}
                animate={{ width: isActive ? '100%' : '0%' }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
