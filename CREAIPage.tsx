import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import Logo from './Logo';

export default function SplashScreen({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500); // 2.5 seconds splash

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[9999] bg-white dark:bg-black flex flex-col items-center justify-center p-8"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                duration: 0.8, 
                delay: 0.2,
                type: 'spring',
                stiffness: 100
              }}
              className="flex flex-col items-center"
            >
              <Logo size={80} className="mb-6 scale-125" />
              
              <div className="mt-12 w-48 h-[2px] bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden relative">
                <motion.div 
                  className="absolute inset-0 bg-neutral-900 dark:bg-white origin-left"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
              </div>
              
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-6 text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400"
              >
                Initializing Secure Protocol
              </motion.p>
            </motion.div>

            <div className="absolute bottom-12 left-0 right-0 flex justify-center">
              <span className="text-[10px] font-black italic uppercase tracking-tighter opacity-20">v1.2.0.PRO</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.5 }}
        className="h-full w-full"
      >
        {children}
      </motion.div>
    </>
  );
}
