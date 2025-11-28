import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', title, icon }) => {
  return (
    <div className={`relative overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl rounded-2xl p-6 ${className}`}>
      {/* Glossy gradient overlay */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
      
      {(title || icon) && (
        <div className="flex items-center gap-3 mb-4 relative z-10">
          {icon && <div className="text-blue-300">{icon}</div>}
          {title && <h3 className="text-lg font-semibold text-white tracking-wide">{title}</h3>}
        </div>
      )}
      
      <div className="relative z-10 text-slate-100">
        {children}
      </div>
    </div>
  );
};