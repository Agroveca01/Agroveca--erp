export const productColors: Record<string, { primary: string; light: string; gradient: string; glow: string }> = {
  'PY-200': {
    primary: '#00D4D4',
    light: '#B2F5F5',
    gradient: 'from-cyan-400 to-teal-500',
    glow: 'shadow-cyan-500/50'
  },
  'NM-200': {
    primary: '#FF8C42',
    light: '#FFD4B8',
    gradient: 'from-orange-400 to-amber-500',
    glow: 'shadow-orange-500/50'
  },
  'BP-200': {
    primary: '#DC143C',
    light: '#F8B8C4',
    gradient: 'from-red-500 to-rose-600',
    glow: 'shadow-red-500/50'
  },
  'TP-200': {
    primary: '#1a1a1a',
    light: '#525252',
    gradient: 'from-slate-700 to-slate-900',
    glow: 'shadow-slate-500/50'
  },
  'AM-5L': {
    primary: '#9D4EDD',
    light: '#E4D4F4',
    gradient: 'from-purple-500 to-violet-600',
    glow: 'shadow-purple-500/50'
  },
  'UV-20L': {
    primary: '#98FF98',
    light: '#D4FFD4',
    gradient: 'from-green-400 to-emerald-500',
    glow: 'shadow-green-500/50'
  }
};

export const getProductColor = (productId: string) => {
  return productColors[productId] || {
    primary: '#64748b',
    light: '#cbd5e1',
    gradient: 'from-slate-400 to-slate-600',
    glow: 'shadow-slate-500/50'
  };
};

export const categoryColors: Record<string, string> = {
  chemical: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
  natural: 'bg-green-500/20 text-green-300 border-green-500/50',
  base: 'bg-slate-500/20 text-slate-300 border-slate-500/50',
  fragrance: 'bg-pink-500/20 text-pink-300 border-pink-500/50',
  colorant: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
  substrate_component: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
};
