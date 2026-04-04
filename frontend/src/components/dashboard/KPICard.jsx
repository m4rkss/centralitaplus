import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function KPICard({ 
  title, 
  value, 
  subtitle,
  icon: Icon, 
  trend, 
  trendValue,
  color = 'blue',
  onClick,
  testId
}) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/30',
    green: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30',
    amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/30',
    red: 'from-red-500/20 to-red-600/5 border-red-500/30',
    purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/30',
  };

  const iconColorClasses = {
    blue: 'text-blue-400 bg-blue-500/20',
    green: 'text-emerald-400 bg-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/20',
    red: 'text-red-400 bg-red-500/20',
    purple: 'text-purple-400 bg-purple-500/20',
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColorClass = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400';

  return (
    <div
      data-testid={testId}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-gradient-to-br p-5 transition-all",
        colorClasses[color],
        onClick && "cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500">{subtitle}</p>
          )}
        </div>
        
        {Icon && (
          <div className={cn("p-2.5 rounded-lg", iconColorClasses[color])}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {trendValue && (
        <div className={cn("flex items-center gap-1 mt-3 text-xs", trendColorClass)}>
          <TrendIcon className="w-3.5 h-3.5" />
          <span>{trendValue}</span>
        </div>
      )}

      {/* Decorative gradient orb */}
      <div 
        className={cn(
          "absolute -right-8 -bottom-8 w-32 h-32 rounded-full opacity-20 blur-2xl",
          color === 'blue' && "bg-blue-500",
          color === 'green' && "bg-emerald-500",
          color === 'amber' && "bg-amber-500",
          color === 'red' && "bg-red-500",
          color === 'purple' && "bg-purple-500",
        )}
      />
    </div>
  );
}
