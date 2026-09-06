import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SettingsPanel } from './SettingsPanel';

interface SettingsDebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (msg: string) => void;
}

export const SettingsDebugModal: React.FC<SettingsDebugModalProps> = ({
  isOpen,
  onClose,
  showToast,
}) => {
  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 overflow-hidden select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Window Container */}
        <motion.div
          id="settings-debug-modal"
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 8 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden text-slate-800"
        >
          <SettingsPanel
            isInline={false}
            onClose={onClose}
            showToast={showToast}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
