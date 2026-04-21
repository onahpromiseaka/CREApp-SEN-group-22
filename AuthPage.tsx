import { motion } from 'motion/react';

interface LogoProps {
  className?: string;
  size?: number;
  textColor?: string;
  variant?: 'full' | 'icon';
}

export default function Logo({ className = '', size = 40, textColor = 'currentColor', variant = 'full' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.div 
        style={{ width: size, height: size }}
        className="relative flex items-center justify-center"
        initial={{ rotate: -10 }}
        animate={{ rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        {/* Modern Minimalist Icon: Chat bubble + Connection Lines */}
        <div className="absolute inset-0 bg-neutral-900 dark:bg-white rounded-[30%] rotate-3 opacity-10" />
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke={textColor === 'currentColor' ? 'black' : textColor} 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="dark:stroke-white w-full h-full p-1"
        >
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" fill="currentColor" fillOpacity="0.1" />
          <path d="M8 12h.01" />
          <path d="M12 12h.01" />
          <path d="M16 12h.01" />
          <motion.path 
            d="M3 12h18" 
            opacity="0.2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </svg>
      </motion.div>
      
      {variant === 'full' && (
        <div className="flex flex-col leading-none">
          <span className="text-xl font-black italic tracking-tighter uppercase dark:text-white">
            CRE<span className="text-neutral-500">Connect</span>
          </span>
          <span className="text-[8px] font-bold tracking-[0.2em] uppercase text-neutral-400">
            Intelligent Media
          </span>
        </div>
      )}
    </div>
  );
}
