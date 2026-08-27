import React from 'react';
import { 
  Building2, 
  Box, 
  Activity, 
  ShoppingCart, 
  TrendingUp 
} from 'lucide-react';

export default function KPIsGrid({ suppliers, components, products, orders, avgRisk }) {
  const cards = [
    {
      label: 'Total Suppliers',
      value: suppliers.length,
      icon: <Building2 className="w-6 h-6" />,
      colorClass: 'text-[#a855f7]',
      bgGlow: 'hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:border-[#a855f7]/30'
    },
    {
      label: 'Components',
      value: components.length,
      icon: <Box className="w-6 h-6" />,
      colorClass: 'text-[#f97316]',
      bgGlow: 'hover:shadow-[0_0_15px_rgba(249,115,22,0.2)] hover:border-[#f97316]/30'
    },
    {
      label: 'Finished Products',
      value: products.length,
      icon: <Activity className="w-6 h-6" />,
      colorClass: 'text-[#14b8a6]',
      bgGlow: 'hover:shadow-[0_0_15px_rgba(20,184,166,0.2)] hover:border-[#14b8a6]/30'
    },
    {
      label: 'Open Orders',
      value: orders.length,
      icon: <ShoppingCart className="w-6 h-6" />,
      colorClass: 'text-[#eab308]',
      bgGlow: 'hover:shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:border-[#eab308]/30'
    },
    {
      label: 'Average Supplier Risk',
      value: `${avgRisk}%`,
      icon: <TrendingUp className="w-6 h-6" />,
      colorClass: Number(avgRisk) > 50 ? 'text-red-500' : 'text-amber-500',
      bgGlow: Number(avgRisk) > 50 
        ? 'hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:border-red-500/30' 
        : 'hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:border-amber-500/30'
    }
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
      {cards.map((card, idx) => (
        <div 
          key={idx}
          className={`bg-bgCard border border-borderColor rounded-2xl p-6 flex items-center gap-5 shadow-2xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden before:absolute before:top-0 before:left-0 before:w-full before:height before:h-[4px] before:bg-indigo-500 before:opacity-0 hover:before:opacity-100 before:transition-all ${card.bgGlow}`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 ${card.colorClass}`}>
            {card.icon}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1">
              {card.label}
            </span>
            <span className="text-3xl font-extrabold text-white leading-tight">
              {card.value}
            </span>
          </div>
        </div>
      ))}
    </section>
  );
}
