export type CarId = 
  | 'vw'
  | 'bmw'
  | 'mercedes'
  | 'jaguar'
  | 'landrover'
  | 'porsche'
  | 'lamborghini'
  | 'ferrari'
  | 'bentley'
  | 'bugatti';

export interface CarConfig {
  id: CarId;
  name: string;
  enName: string;
  multiplier: number;
  color: string;
  accentColor: string;
  slotsCount: number;
}

export const CARS: Record<CarId, CarConfig> = {
  vw: {
    id: 'vw',
    name: 'فولكس فاجن',
    enName: 'Volkswagen',
    multiplier: 2,
    color: '#0284c7',
    accentColor: '#38bdf8',
    slotsCount: 6,
  },
  bmw: {
    id: 'bmw',
    name: 'بي إم دبليو',
    enName: 'BMW',
    multiplier: 5,
    color: '#2563eb',
    accentColor: '#60a5fa',
    slotsCount: 4,
  },
  mercedes: {
    id: 'mercedes',
    name: 'مرسيدس بنز',
    enName: 'Mercedes-Benz',
    multiplier: 8,
    color: '#94a3b8',
    accentColor: '#cbd5e1',
    slotsCount: 4,
  },
  jaguar: {
    id: 'jaguar',
    name: 'جاغوار',
    enName: 'Jaguar',
    multiplier: 18,
    color: '#dc2626',
    accentColor: '#f87171',
    slotsCount: 2,
  },
  landrover: {
    id: 'landrover',
    name: 'لاند روفر',
    enName: 'Land Rover',
    multiplier: 20,
    color: '#059669',
    accentColor: '#34d399',
    slotsCount: 2,
  },
  porsche: {
    id: 'porsche',
    name: 'بورش',
    enName: 'Porsche',
    multiplier: 30,
    color: '#d97706',
    accentColor: '#fbbf24',
    slotsCount: 2,
  },
  lamborghini: {
    id: 'lamborghini',
    name: 'لامبورغيني',
    enName: 'Lamborghini',
    multiplier: 50,
    color: '#eab308',
    accentColor: '#fde047',
    slotsCount: 1,
  },
  ferrari: {
    id: 'ferrari',
    name: 'فيراري',
    enName: 'Ferrari',
    multiplier: 66,
    color: '#ef4444',
    accentColor: '#fca5a5',
    slotsCount: 1,
  },
  bentley: {
    id: 'bentley',
    name: 'بنتلي',
    enName: 'Bentley',
    multiplier: 88,
    color: '#475569',
    accentColor: '#94a3b8',
    slotsCount: 1,
  },
  bugatti: {
    id: 'bugatti',
    name: 'بوغاتي',
    enName: 'Bugatti',
    multiplier: 100,
    color: '#e11d48',
    accentColor: '#fb7185',
    slotsCount: 1,
  },
};

// 16 slots perimeter wheel matching exact screenshot layout
export const WHEEL_SLOTS: CarId[] = [
  'bugatti',     // 0: Top (12:00) - Bugatti x100
  'bmw',         // 1: ~1:15 - BMW x5
  'mercedes',    // 2: ~2:15 - Mercedes x8
  'vw',          // 3: ~3:15 - VW x2
  'lamborghini', // 4: ~4:15 - Lamborghini x50
  'porsche',     // 5: ~5:00 - Porsche x30
  'landrover',   // 6: ~5:45 - Land Rover x20
  'bentley',     // 7: ~6:30 - Bentley x88
  'vw',          // 8: ~7:15 - VW x2
  'jaguar',      // 9: ~8:00 - Jaguar x18
  'porsche',     // 10: ~8:45 - Porsche x30
  'ferrari',     // 11: ~9:30 - Ferrari x66
  'landrover',   // 12: ~10:15 - Land Rover x20
  'mercedes',    // 13: ~11:00 - Mercedes x8
  'bmw',         // 14: ~11:30 - BMW x5
  'vw',          // 15: ~11:50 - VW x2
];

export type GamePhase = 'BETTING' | 'SPINNING' | 'RESULT';

export interface BetMap {
  [carId: string]: number;
}

export interface RoundHistoryItem {
  roundId: number;
  winnerCar: CarId;
  multiplier: number;
  slotIndex: number;
  timestamp: string;
  totalBets: number;
  userProfit: number;
}

export interface PlayerProfile {
  id: string;
  name: string;
  title: string;
  balance: number;
  avatarUrl: string;
  vipLevel: number;
}

export interface LeaderboardUser {
  rank: number;
  id: string;
  name: string;
  avatarUrl: string;
  todayProfit: number;
  vipLevel: number;
  isMe?: boolean;
}

export interface AdminSettings {
  forcedWinnerCar: CarId | 'FAIR_RNG';
  bettingTimeSeconds: number;
  spinDurationSeconds: number;
  botsEnabled: boolean;
  botsBetFactor: number;
  soundEnabled: boolean;
}
