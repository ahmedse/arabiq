'use client';

/**
 * StatCard Component
 * Displays a stat with label, value, and optional trend
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
  };
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const colorClasses = {
  default: 'bg-card text-card-foreground',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-green-500/10 text-green-600 dark:text-green-400',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  danger: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

const iconColorClasses = {
  default: 'text-muted-foreground',
  primary: 'text-primary',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-red-600 dark:text-red-400',
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  color = 'default',
  size = 'md',
  className = '',
}: StatCardProps) {
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };
  
  const valueSizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };
  
  return (
    <div 
      className={`
        rounded-xl border border-border shadow-sm
        ${colorClasses[color]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">
            {label}
          </p>
          <p className={`font-bold mt-1 ${valueSizeClasses[size]}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
        {Icon && (
          <div className={`p-2 rounded-lg bg-background/50 ${iconColorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          {trend.value > 0 ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : trend.value < 0 ? (
            <TrendingDown className="w-4 h-4 text-red-500" />
          ) : (
            <Minus className="w-4 h-4 text-muted-foreground" />
          )}
          <span className={`text-sm ${
            trend.value > 0 ? 'text-green-500' : 
            trend.value < 0 ? 'text-red-500' : 
            'text-muted-foreground'
          }`}>
            {trend.value > 0 ? '+' : ''}{trend.value}%
          </span>
          {trend.label && (
            <span className="text-sm text-muted-foreground">
              {trend.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
