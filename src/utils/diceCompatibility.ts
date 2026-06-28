export const compatibilityPolicy = {
  reroll: {
    r: 'rerollOnce',
    rr: 'rerollRecursive',
    ro: 'removed',
  },
  explode: {
    '!': 'explode',
    '!!': 'compound',
    'x': 'explode',
    'xo': 'explodeOnce',
  },
} as const;
