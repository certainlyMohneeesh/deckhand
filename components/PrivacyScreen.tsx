'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';

interface PrivacyScreenProps {
  onExit?: () => void;
}

export const PrivacyScreen: React.FC<PrivacyScreenProps> = ({ onExit }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="flex flex-col items-center space-y-6"
      >
        {/* Logo */}
        <div className="relative w-48 h-48 sm:w-64 sm:h-64">
          <Image
            src="/deckhand-logo.png"
            alt="DeckHand Logo"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Optional branding text */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="text-center"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            DeckHand
          </h1>
          <p className="text-sm sm:text-base text-white/70">
            Privacy Screen Active
          </p>
        </motion.div>

        {/* Subtle pulse animation on logo */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="w-64 h-64 sm:w-80 sm:h-80 bg-white/5 rounded-full blur-3xl" />
        </motion.div>
      </motion.div>

      {/* Exit hint (keyboard shortcut) - only shown on stage */}
      {onExit && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <p className="text-xs text-white/40 text-center">
            Press <kbd className="px-2 py-1 bg-white/10 rounded text-white/60">Esc</kbd> or toggle Privacy button to exit
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};
