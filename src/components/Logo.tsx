import React from 'react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'white' | 'blue' | 'gradient';
}

const Logo: React.FC<LogoProps> = ({ className, iconOnly = false, size = 'md', variant = 'gradient' }) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  };

  const iconBg = {
    white: 'bg-white text-blue-600',
    blue: 'bg-blue-600 text-white',
    gradient: 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white'
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className={cn(
        "rounded-[28%] flex items-center justify-center shadow-lg",
        sizes[size],
        iconBg[variant]
      )}>
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-[65%] h-[65%]"
        >
          {/* Bar Chart */}
          <rect x="20" y="60" width="12" height="20" rx="2" fill="currentColor" />
          <rect x="44" y="45" width="12" height="35" rx="2" fill="currentColor" />
          <rect x="68" y="55" width="12" height="25" rx="2" fill="currentColor" />
          
          {/* Upward Arrow/Trend Line */}
          <path 
            d="M20 55 C 35 45, 50 35, 65 25" 
            stroke="currentColor" 
            strokeWidth="6" 
            strokeLinecap="round"
          />
          <path 
            d="M60 25 L 68 22 L 68 30" 
            stroke="currentColor" 
            strokeWidth="6" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {/* Dollar Sign - More prominent as in the image */}
          <text 
            x="70" 
            y="45" 
            fill="currentColor" 
            fontSize="45" 
            fontWeight="900" 
            fontFamily="Arial, sans-serif"
            textAnchor="middle"
          >
            $
          </text>
        </svg>
      </div>
      {!iconOnly && (
        <h1 className={cn(
          "font-bold tracking-tight",
          textSizes[size],
          variant === 'white' ? "text-white" : "text-foreground"
        )}>
          FinSmart-AI
        </h1>
      )}
    </div>
  );
};

export default Logo;
