export type SymbolId = 'WILD' | 'GEM_RED' | 'GEM_BLUE' | 'GEM_GREEN' | 'A' | 'K' | 'Q' | 'J';

export type SpecialSymbolId = '1x' | '2x' | '3x' | '5x' | '10x' | '15x' | 'WHEEL';

export interface SymbolDefinition {
  id: SymbolId;
  name: string;
  payoutMultiplier: number; // For 3 of a kind
  color: string;
  glowColor: string;
}

export const SYMBOLS: Record<SymbolId, SymbolDefinition> = {
  WILD: {
    id: 'WILD',
    name: 'قناع الجارودا الذهبي (WILD)',
    payoutMultiplier: 25,
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.7)',
  },
  GEM_RED: {
    id: 'GEM_RED',
    name: 'الجوهرة الحمراء',
    payoutMultiplier: 20,
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.7)',
  },
  GEM_BLUE: {
    id: 'GEM_BLUE',
    name: 'الجوهرة الزرقاء',
    payoutMultiplier: 15,
    color: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.7)',
  },
  GEM_GREEN: {
    id: 'GEM_GREEN',
    name: 'الجوهرة الخضراء',
    payoutMultiplier: 12,
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.7)',
  },
  A: {
    id: 'A',
    name: 'رمز A الأسطوري',
    payoutMultiplier: 10,
    color: '#e2e8f0',
    glowColor: 'rgba(226, 232, 240, 0.5)',
  },
  K: {
    id: 'K',
    name: 'رمز K الملكي',
    payoutMultiplier: 8,
    color: '#d8b4fe',
    glowColor: 'rgba(216, 180, 254, 0.5)',
  },
  Q: {
    id: 'Q',
    name: 'رمز Q الملكي',
    payoutMultiplier: 5,
    color: '#93c5fd',
    glowColor: 'rgba(147, 197, 253, 0.5)',
  },
  J: {
    id: 'J',
    name: 'رمز J الملكي',
    payoutMultiplier: 2,
    color: '#86efac',
    glowColor: 'rgba(134, 239, 172, 0.5)',
  },
};

// 5 paylines on a 3x3 grid (coordinates: [reel, row])
export const PAYLINES = [
  // Line 1: Top horizontal
  { id: 1, name: 'الخط العلوي', coords: [[0, 0], [1, 0], [2, 0]] as [number, number][], color: '#f59e0b' },
  // Line 2: Center horizontal
  { id: 2, name: 'الخط الأوسط', coords: [[0, 1], [1, 1], [2, 1]] as [number, number][], color: '#10b981' },
  // Line 3: Bottom horizontal
  { id: 3, name: 'الخط السفلي', coords: [[0, 2], [1, 2], [2, 2]] as [number, number][], color: '#3b82f6' },
  // Line 4: Diagonal top-left to bottom-right
  { id: 4, name: 'قطري نازل', coords: [[0, 0], [1, 1], [2, 2]] as [number, number][], color: '#ec4899' },
  // Line 5: Diagonal bottom-left to top-right
  { id: 5, name: 'قطري صاعد', coords: [[0, 2], [1, 1], [2, 0]] as [number, number][], color: '#8b5cf6' },
];

// Bet levels explicitly starting at 500 up to 300,000 coins
export const BET_LEVELS = [
  500,
  1000,
  2000,
  5000,
  10000,
  15000,
  25000,
  50000,
  75000,
  100000,
  150000,
  200000,
  300000,
] as const;

// Fortune wheel slice multipliers
export const WHEEL_MULTIPLIERS = [1, 3, 5, 8, 10, 15, 20, 30, 50, 100, 200, 1000];

export interface WinningLine {
  lineIndex: number;
  symbol: SymbolId;
  payoutBase: number;
  totalPayout: number;
  coords: [number, number][];
}

export interface SpinResult {
  grid: SymbolId[][]; // [reel][row], 3 reels x 3 rows
  specialReel: SpecialSymbolId[]; // 3 rows in reel 4
  centerSpecial: SpecialSymbolId;
  multiplierValue: number;
  winningLines: WinningLine[];
  baseWin: number;
  totalWin: number;
  isWheelTriggered: boolean;
  wheelWin: number;
  wheelMultiplier?: number;
  isExActive: boolean;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  winAmount: number;
  multiplier: string;
  date: string;
  isPlayer?: boolean;
}
