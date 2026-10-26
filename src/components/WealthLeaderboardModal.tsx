import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Flame,
  Coins,
  Trophy,
  Radio,
  Gem,
  ShieldCheck,
  HelpCircle,
  Clock,
  X,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';
import { VipName } from './VipName';
import { WealthBadge, CharmBadge } from './LevelBadgeIcons';
import { UserProfile, WealthSupporter } from '../types';

export const initialWealthSupportersList: WealthSupporter[] = [
  {
    rank: 1,
    supportAmount: 5850000,
    user: {
      id: '901238',
      name: 'الملك هارون',
      nickname: 'الملك هارون',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&fit=crop&q=80',
      cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&fit=crop&q=80',
      vipLevel: 5,
      vipExpiry: '2028/01/01',
      wealthLevel: 68,
      wealthExp: 5850000,
      charmLevel: 45,
      charmExp: 450000,
      coins: 0,
      diamonds: 0,
      hearts: 0,
      friendsCount: 120,
      followersCount: 5400,
      followingCount: 45,
      fansCount: 8200,
      visitorsCount: 19400,
      country: 'العراق',
      countryCode: 'IQ',
      countryFlag: '🇮🇶',
      gender: 'ذكر',
      birthdate: '1995/04/12',
      bio: 'داعم الغرف الأول 👑 فخامة وهيبة وجود وكرم',
      album: [],
    },
  },
  {
    rank: 2,
    supportAmount: 3920000,
    user: {
      id: '814529',
      name: 'الشيخة نورة',
      nickname: 'الشيخة نورة',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&fit=crop&q=80',
      cover: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&fit=crop&q=80',
      vipLevel: 4,
      vipExpiry: '2027/12/31',
      wealthLevel: 55,
      wealthExp: 3920000,
      charmLevel: 58,
      charmExp: 5420000,
      coins: 0,
      diamonds: 0,
      hearts: 0,
      friendsCount: 95,
      followersCount: 4100,
      followingCount: 30,
      fansCount: 6500,
      visitorsCount: 14200,
      country: 'السعودية',
      countryCode: 'SA',
      countryFlag: '🇸🇦',
      gender: 'أنثى',
      birthdate: '1998/08/21',
      bio: 'صاحبة العطاء والكرم ✨ مرحباً بالجميع في رومي',
      album: [],
    },
  },
  {
    rank: 3,
    supportAmount: 2450000,
    user: {
      id: '723910',
      name: 'قيصر بغداد',
      nickname: 'قيصر بغداد',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&fit=crop&q=80',
      cover: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&fit=crop&q=80',
      vipLevel: 3,
      vipExpiry: '2027/11/15',
      wealthLevel: 48,
      wealthExp: 2450000,
      charmLevel: 38,
      charmExp: 380000,
      coins: 0,
      diamonds: 0,
      hearts: 0,
      friendsCount: 78,
      followersCount: 3200,
      followingCount: 22,
      fansCount: 4900,
      visitorsCount: 11000,
      country: 'العراق',
      countryCode: 'IQ',
      countryFlag: '🇮🇶',
      gender: 'ذكر',
      birthdate: '1996/02/10',
      bio: 'أصالة وكبرياء 🦁 دعم مستمر للأصدقاء',
      album: [],
    },
  },
  {
    rank: 4,
    supportAmount: 1680000,
    user: {
      id: '652194',
      name: 'أمير الصمت',
      nickname: 'أمير الصمت',
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&fit=crop&q=80',
      vipLevel: 2,
      vipExpiry: '2027/08/20',
      wealthLevel: 42,
      wealthExp: 1680000,
      charmLevel: 32,
      coins: 0,
      diamonds: 0,
      hearts: 0,
      friendsCount: 62,
      followersCount: 2800,
      fansCount: 3400,
      visitorsCount: 9200,
      country: 'الإمارات',
      countryCode: 'AE',
      countryFlag: '🇦🇪',
      gender: 'ذكر',
      birthdate: '1997/11/05',
      bio: 'هدوء وثقة ووفاء بالعهد 🦅',
      album: [],
    },
  },
  {
    rank: 5,
    supportAmount: 1150000,
    user: {
      id: '584102',
      name: 'الفهد الذهبي',
      nickname: 'الفهد الذهبي',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&fit=crop&q=80',
      vipLevel: 2,
      vipExpiry: '2027/05/10',
      wealthLevel: 36,
      wealthExp: 1150000,
      charmLevel: 28,
      coins: 0,
      diamonds: 0,
      hearts: 0,
      friendsCount: 54,
      followersCount: 2100,
      fansCount: 2900,
      visitorsCount: 7800,
      country: 'الكويت',
      countryCode: 'KW',
      countryFlag: '🇰🇼',
      gender: 'ذكر',
      birthdate: '1994/09/18',
      bio: 'صداقة وأخوة تدوم للأبد 🤝',
      album: [],
    },
  },
  {
    rank: 6,
    supportAmount: 890000,
    user: {
      id: '492817',
      name: 'سلطان القلوب',
      nickname: 'سلطان القلوب',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&fit=crop&q=80',
      vipLevel: 1,
      vipExpiry: '2027/03/01',
      wealthLevel: 31,
      wealthExp: 890000,
      charmLevel: 24,
      coins: 0,
      diamonds: 0,
      hearts: 0,
      friendsCount: 45,
      followersCount: 1600,
      fansCount: 2100,
      visitorsCount: 6500,
      country: 'عمان',
      countryCode: 'OM',
      countryFlag: '🇴🇲',
      gender: 'ذكر',
      birthdate: '1993/06/14',
      bio: 'عش عفويتك واترك للناس ظنونهم ☕',
      album: [],
    },
  },
  {
    rank: 7,
    supportAmount: 650000,
    user: {
      id: '381940',
      name: 'توليب M',
      nickname: 'توليب M',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&fit=crop&q=80',
      vipLevel: 1,
      vipExpiry: '2027/01/15',
      wealthLevel: 27,
      wealthExp: 650000,
      charmLevel: 52,
      coins: 0,
      diamonds: 0,
      hearts: 0,
      friendsCount: 40,
      followersCount: 1450,
      fansCount: 1800,
      visitorsCount: 5200,
      country: 'الأردن',
      countryCode: 'JO',
      countryFlag: '🇯🇴',
      gender: 'أنثى',
      birthdate: '1999/03/30',
      bio: 'وردة بيضاء في بستان الحياة 🌸',
      album: [],
    },
  },
  {
    rank: 8,
    supportAmount: 480000,
    user: {
      id: '271890',
      name: 'فارس الظلام',
      nickname: 'فارس الظلام',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&fit=crop&q=80',
      vipLevel: 1,
      vipExpiry: '2026/12/30',
      wealthLevel: 23,
      wealthExp: 480000,
      charmLevel: 19,
      coins: 0,
      diamonds: 0,
      hearts: 0,
      friendsCount: 36,
      followersCount: 1100,
      fansCount: 1400,
      visitorsCount: 4300,
      country: 'مصر',
      countryCode: 'EG',
      countryFlag: '🇪🇬',
      gender: 'ذكر',
      birthdate: '1996/10/08',
      bio: 'عابر سبيل يبتسم للجميع 🌙',
      album: [],
    },
  },
  {
    rank: 9,
    supportAmount: 340000,
    user: {
      id: '190472',
      name: 'ريحانة الشام',
      nickname: 'ريحانة الشام',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&fit=crop&q=80',
      vipLevel: 0,
      vipExpiry: '2028/01/01',
      wealthLevel: 18,
      wealthExp: 340000,
      charmLevel: 26,
      coins: 0,
      diamonds: 0,
      hearts: 0,
      friendsCount: 30,
      followersCount: 950,
      fansCount: 1200,
      visitorsCount: 3800,
      country: 'سوريا',
      countryCode: 'SY',
      countryFlag: '🇸🇾',
      gender: 'أنثى',
      birthdate: '2000/01/15',
      bio: 'دمشقية الهوى والياسمين 🌿',
      album: [],
    },
  },
  {
    rank: 10,
    supportAmount: 220000,
    user: {
      id: '109845',
      name: 'النجم الساطع',
      nickname: 'النجم الساطع',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&fit=crop&q=80',
      vipLevel: 0,
      vipExpiry: '2028/01/01',
      wealthLevel: 15,
      wealthExp: 220000,
      charmLevel: 14,
      coins: 0,
      diamonds: 0,
      hearts: 0,
      friendsCount: 25,
      followersCount: 780,
      fansCount: 920,
      visitorsCount: 2900,
      country: 'السعودية',
      countryCode: 'SA',
      countryFlag: '🇸🇦',
      gender: 'ذكر',
      birthdate: '1995/07/22',
      bio: 'طير حر لا يعرف المستحيل 🦅',
      album: [],
    },
  },
];

export interface CharmLeaderboardItem {
  rank: number;
  charmReceived: number;
  user: UserProfile;
}

const createCharmProfile = (data: Partial<UserProfile> & { id: string; name: string; avatar: string; charmLevel: number }): UserProfile => ({
  nickname: data.name,
  country: 'السعودية',
  countryCode: 'SA',
  countryFlag: '🇸🇦',
  vipLevel: 0,
  vipExpiry: '2028/01/01',
  wealthLevel: 1,
  coins: 0,
  diamonds: 0,
  hearts: 0,
  friendsCount: 30,
  followersCount: 1000,
  fansCount: 1200,
  visitorsCount: 3500,
  gender: 'ذكر',
  birthdate: '1998/01/01',
  bio: 'مرحباً بالجميع',
  album: [],
  ...data,
});

export const initialCharmAccountsList: CharmLeaderboardItem[] = [
  {
    rank: 1,
    charmReceived: 6200000,
    user: createCharmProfile({
      id: '814529',
      name: 'الشيخة نورة',
      nickname: 'الشيخة نورة',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&fit=crop&q=80',
      vipLevel: 4,
      wealthLevel: 55,
      wealthExp: 3920000,
      charmLevel: 62,
      charmExp: 6200000,
      country: 'السعودية',
      countryCode: 'SA',
      countryFlag: '🇸🇦',
      gender: 'أنثى',
      bio: 'ملكة الجاذبية وحضور يخطف القلوب ✨',
      followersCount: 12500,
      fansCount: 18900,
      visitorsCount: 42000,
    }),
  },
  {
    rank: 2,
    charmReceived: 4950000,
    user: createCharmProfile({
      id: '381940',
      name: 'توليب M',
      nickname: 'توليب M',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&fit=crop&q=80',
      vipLevel: 3,
      wealthLevel: 27,
      wealthExp: 650000,
      charmLevel: 55,
      charmExp: 4950000,
      country: 'الأردن',
      countryCode: 'JO',
      countryFlag: '🇯🇴',
      gender: 'أنثى',
      bio: 'سحر الورد ورقة الإحساس 🌷',
      followersCount: 8900,
      fansCount: 14200,
      visitorsCount: 31000,
    }),
  },
  {
    rank: 3,
    charmReceived: 3700000,
    user: createCharmProfile({
      id: '901238',
      name: 'الملك هارون',
      nickname: 'الملك هارون',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&fit=crop&q=80',
      vipLevel: 5,
      wealthLevel: 68,
      wealthExp: 5850000,
      charmLevel: 49,
      charmExp: 3700000,
      country: 'العراق',
      countryCode: 'IQ',
      countryFlag: '🇮🇶',
      gender: 'ذكر',
      bio: 'هيبة الحضور وكاريزما الملوك 👑',
      followersCount: 5400,
      fansCount: 8200,
      visitorsCount: 19400,
    }),
  },
  {
    rank: 4,
    charmReceived: 2800000,
    user: createCharmProfile({
      id: '723910',
      name: 'قيصر بغداد',
      nickname: 'قيصر بغداد',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&fit=crop&q=80',
      vipLevel: 3,
      wealthLevel: 48,
      wealthExp: 2450000,
      charmLevel: 43,
      charmExp: 2800000,
      country: 'العراق',
      countryCode: 'IQ',
      countryFlag: '🇮🇶',
      gender: 'ذكر',
      bio: 'أصالة وكبرياء وسحر شرقي أصيل',
      followersCount: 3200,
      fansCount: 4900,
      visitorsCount: 11000,
    }),
  },
  {
    rank: 5,
    charmReceived: 2100000,
    user: createCharmProfile({
      id: '190472',
      name: 'ريحانة الشام',
      nickname: 'ريحانة الشام',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&fit=crop&q=80',
      vipLevel: 2,
      wealthLevel: 18,
      charmLevel: 38,
      charmExp: 2100000,
      country: 'سوريا',
      countryCode: 'SY',
      countryFlag: '🇸🇾',
      gender: 'أنثى',
      bio: 'عطر الياسمين وجمال الصوت والحديث 🌸',
      followersCount: 2700,
      fansCount: 3800,
      visitorsCount: 9600,
    }),
  },
  {
    rank: 6,
    charmReceived: 1650000,
    user: createCharmProfile({
      id: '652194',
      name: 'أمير الصمت',
      nickname: 'أمير الصمت',
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&fit=crop&q=80',
      vipLevel: 2,
      wealthLevel: 42,
      charmLevel: 35,
      charmExp: 1650000,
      country: 'الإمارات',
      countryCode: 'AE',
      countryFlag: '🇦🇪',
      gender: 'ذكر',
      bio: 'سحر الهدوء وجاذبية النظرة 🦅',
      followersCount: 2800,
      fansCount: 3400,
      visitorsCount: 9200,
    }),
  },
  {
    rank: 7,
    charmReceived: 1250000,
    user: createCharmProfile({
      id: '584102',
      name: 'الفهد الذهبي',
      nickname: 'الفهد الذهبي',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&fit=crop&q=80',
      vipLevel: 2,
      wealthLevel: 36,
      charmLevel: 31,
      charmExp: 1250000,
      country: 'الكويت',
      countryCode: 'KW',
      countryFlag: '🇰🇼',
      gender: 'ذكر',
      bio: 'حضور مميز وجاذبية متألقة ⭐',
      followersCount: 2100,
      fansCount: 2900,
      visitorsCount: 7800,
    }),
  },
  {
    rank: 8,
    charmReceived: 980000,
    user: createCharmProfile({
      id: '492817',
      name: 'سلطان القلوب',
      nickname: 'سلطان القلوب',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&fit=crop&q=80',
      vipLevel: 1,
      wealthLevel: 31,
      charmLevel: 28,
      charmExp: 980000,
      country: 'عمان',
      countryCode: 'OM',
      countryFlag: '🇴🇲',
      gender: 'ذكر',
      bio: 'لطافة الحديث والروح الطيبة 🌺',
      followersCount: 1600,
      fansCount: 2100,
      visitorsCount: 6500,
    }),
  },
  {
    rank: 9,
    charmReceived: 750000,
    user: createCharmProfile({
      id: '271890',
      name: 'فارس الظلام',
      nickname: 'فارس الظلام',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&fit=crop&q=80',
      vipLevel: 1,
      wealthLevel: 23,
      charmLevel: 25,
      charmExp: 750000,
      country: 'مصر',
      countryCode: 'EG',
      countryFlag: '🇪🇬',
      gender: 'ذكر',
      bio: 'كاريزما ليلية هادئة 🌙',
      followersCount: 1100,
      fansCount: 1400,
      visitorsCount: 4300,
    }),
  },
  {
    rank: 10,
    charmReceived: 560000,
    user: createCharmProfile({
      id: '109845',
      name: 'النجم الساطع',
      nickname: 'النجم الساطع',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&fit=crop&q=80',
      vipLevel: 0,
      wealthLevel: 15,
      charmLevel: 22,
      charmExp: 560000,
      country: 'السعودية',
      countryCode: 'SA',
      countryFlag: '🇸🇦',
      gender: 'ذكر',
      bio: 'أناقة وبساطة وأصالة عربية 🦅',
      followersCount: 780,
      fansCount: 920,
      visitorsCount: 2900,
    }),
  },
];

export interface RoomLeaderboardItem {
  id: string;
  rank: number;
  title: string;
  coverImage: string;
  hostName: string;
  hostAvatar: string;
  roomCups: number;
  roomGiftsAmount: number;
  activeListeners: number;
}

export const initialRoomsLeaderboardList: RoomLeaderboardItem[] = [
  {
    id: 'room-1',
    rank: 1,
    title: 'ديوانية الملوك 👑 سهرة طرب',
    coverImage: '/src/assets/images/room_cover_1790179116812.jpg',
    hostName: 'الملك هارون',
    hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&fit=crop&q=80',
    roomCups: 5800,
    roomGiftsAmount: 8900000,
    activeListeners: 2450,
  },
  {
    id: 'room-soulmate',
    rank: 2,
    title: 'تؤام روحي 💖 سوالف حب',
    coverImage: '/src/assets/images/noor_girl_cover_1790179137152.jpg',
    hostName: 'الشيخة نورة',
    hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop&q=80',
    roomCups: 4600,
    roomGiftsAmount: 6800000,
    activeListeners: 1980,
  },
  {
    id: 'room-hekayat',
    rank: 3,
    title: 'حكايات قدر 🌙 قصص ليلية',
    coverImage: '/src/assets/images/hekayat_qadar_cover_1790179154248.jpg',
    hostName: 'قيصر بغداد',
    hostAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&fit=crop&q=80',
    roomCups: 3900,
    roomGiftsAmount: 5100000,
    activeListeners: 1420,
  },
  {
    id: 'room-oman',
    rank: 4,
    title: 'وكالة سلطنة عُمان 🇴🇲 نخبة الخليج',
    coverImage: '/src/assets/images/oman_agency_cover_1790179177131.jpg',
    hostName: 'سلطان القلوب',
    hostAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&fit=crop&q=80',
    roomCups: 3100,
    roomGiftsAmount: 3900000,
    activeListeners: 1100,
  },
  {
    id: 'room-voice',
    rank: 5,
    title: 'جلسة أصوات وخواطر 🎶',
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&fit=crop&q=80',
    hostName: 'توليب M',
    hostAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&fit=crop&q=80',
    roomCups: 2600,
    roomGiftsAmount: 2950000,
    activeListeners: 890,
  },
  {
    id: 'room-iraq',
    rank: 6,
    title: 'ليالي دجلة والفرات 🇮🇶 شاي عراقي',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&fit=crop&q=80',
    hostName: 'أمير الصمت',
    hostAvatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&fit=crop&q=80',
    roomCups: 2100,
    roomGiftsAmount: 2400000,
    activeListeners: 750,
  },
  {
    id: 'room-dubai',
    rank: 7,
    title: 'أبراج دبي الذهبية 🇦🇪 فخامة',
    coverImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&fit=crop&q=80',
    hostName: 'الفهد الذهبي',
    hostAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&fit=crop&q=80',
    roomCups: 1800,
    roomGiftsAmount: 1950000,
    activeListeners: 620,
  },
  {
    id: 'room-jasmine',
    rank: 8,
    title: 'ياسمين الشام 🌸 قهوة الصباح',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&fit=crop&q=80',
    hostName: 'ريحانة الشام',
    hostAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&fit=crop&q=80',
    roomCups: 1450,
    roomGiftsAmount: 1550000,
    activeListeners: 540,
  },
  {
    id: 'room-cairo',
    rank: 9,
    title: 'سهرات النيل والزمالك 🇪🇬 ضحك وسوالف',
    coverImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&fit=crop&q=80',
    hostName: 'فارس الظلام',
    hostAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&fit=crop&q=80',
    roomCups: 1100,
    roomGiftsAmount: 1200000,
    activeListeners: 430,
  },
  {
    id: 'room-najd',
    rank: 10,
    title: 'مخيم نجد والرمال 🇸🇦 كرم وضيافة',
    coverImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&fit=crop&q=80',
    hostName: 'النجم الساطع',
    hostAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&fit=crop&q=80',
    roomCups: 850,
    roomGiftsAmount: 950000,
    activeListeners: 350,
  },
];

type TimePeriod = 'daily' | 'weekly' | 'monthly';

export const WealthLeaderboardModal: React.FC = () => {
  const {
    openWealthLeaderboardModal,
    setOpenWealthLeaderboardModal,
    leaderboardTab,
    setLeaderboardTab,
    setInternalProfileUser,
    setOpenInternalProfileModal,
    currentUser,
    setOpenRechargeModal,
    enterRoom,
    t,
    isRtl,
  } = useApp();

  const [period, setPeriod] = useState<TimePeriod>('daily');
  const [showResetRulesModal, setShowResetRulesModal] = useState(false);

  if (!openWealthLeaderboardModal) return null;

  // Multiplier depending on selected time period (اليوم | أسبوعي | شهري)
  const periodMultiplier = period === 'daily' ? 0.15 : period === 'weekly' ? 0.45 : 1.0;

  // 1. Wealth supporters sorted list
  const supporters: WealthSupporter[] = initialWealthSupportersList.map((s) => ({
    ...s,
    supportAmount: Math.round(s.supportAmount * periodMultiplier),
  }));

  const userSupport = Math.round((currentUser.wealthExp || 0) * periodMultiplier);
  if (userSupport > 0) {
    const existingIdx = supporters.findIndex((s) => s.user.id === currentUser.id);
    if (existingIdx >= 0) {
      supporters[existingIdx].supportAmount = userSupport;
      supporters[existingIdx].user = currentUser;
    } else {
      supporters.push({
        rank: 999,
        supportAmount: userSupport,
        user: currentUser,
      });
    }
  }

  supporters.sort((a, b) => b.supportAmount - a.supportAmount);
  const rankedSupporters = supporters.map((s, idx) => ({
    ...s,
    rank: idx + 1,
  }));

  const topWealth1 = rankedSupporters[0];
  const topWealth2 = rankedSupporters[1];
  const topWealth3 = rankedSupporters[2];
  const restWealth7 = rankedSupporters.slice(3, 10);

  // 2. Charm accounts sorted list (قيمة المرمي للحساب يعني مرسل له)
  const charmList: CharmLeaderboardItem[] = initialCharmAccountsList.map((c) => ({
    ...c,
    charmReceived: Math.round(c.charmReceived * periodMultiplier),
  }));

  const userCharmReceived = Math.round((currentUser.charmExp || 0) * periodMultiplier);
  if (userCharmReceived > 0) {
    const existingIdx = charmList.findIndex((c) => c.user.id === currentUser.id);
    if (existingIdx >= 0) {
      charmList[existingIdx].charmReceived = userCharmReceived;
      charmList[existingIdx].user = currentUser;
    } else {
      charmList.push({
        rank: 999,
        charmReceived: userCharmReceived,
        user: currentUser,
      });
    }
  }

  charmList.sort((a, b) => b.charmReceived - a.charmReceived);
  const rankedCharmList = charmList.map((c, idx) => ({
    ...c,
    rank: idx + 1,
  }));

  const topCharm1 = rankedCharmList[0];
  const topCharm2 = rankedCharmList[1];
  const topCharm3 = rankedCharmList[2];
  const restCharm7 = rankedCharmList.slice(3, 10);

  // 3. Room leaderboard sorted list (دعم الرومات وقيمة المرمي للروم)
  const roomList: RoomLeaderboardItem[] = initialRoomsLeaderboardList.map((r) => ({
    ...r,
    roomCups: Math.max(10, Math.round(r.roomCups * periodMultiplier)),
    roomGiftsAmount: Math.round(r.roomGiftsAmount * periodMultiplier),
  }));

  // Sort strictly by gifts amount thrown to room (قيمة المرمي للروم)
  roomList.sort((a, b) => b.roomGiftsAmount - a.roomGiftsAmount);
  const rankedRoomList = roomList.map((r, idx) => ({
    ...r,
    rank: idx + 1,
  }));

  const topRoom1 = rankedRoomList[0];
  const topRoom2 = rankedRoomList[1];
  const topRoom3 = rankedRoomList[2];
  const restRoom7 = rankedRoomList.slice(3, 10);

  const handleOpenUser = (u: UserProfile) => {
    sounds.playClick();
    setInternalProfileUser(u);
    setOpenInternalProfileModal(true);
  };

  const handleEnterRoom = (roomId: string) => {
    sounds.playClick();
    enterRoom(roomId);
    setOpenWealthLeaderboardModal(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs select-none font-['Cairo',sans-serif] p-0 overflow-hidden animate-in fade-in duration-200"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Main Container - Warm Golden Luxury Palette */}
      <div className="w-full max-w-md h-full bg-gradient-to-b from-[#FFFDF8] via-[#FAF5E8] to-[#F3E7CA] text-slate-900 flex flex-col relative overflow-hidden shadow-2xl border-x border-amber-300/40">
        
        {/* Top Header: Navigation & Title */}
        <header className="relative z-20 pt-3 pb-2 px-4 bg-gradient-to-b from-white/95 via-[#FFFDF5]/95 to-amber-50/90 border-b border-amber-300/60 flex flex-col gap-2 shadow-xs">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <button
              onClick={() => {
                sounds.playClick();
                setOpenWealthLeaderboardModal(false);
              }}
              className="w-9 h-9 rounded-full bg-amber-100/90 hover:bg-amber-200 border border-amber-300/80 text-amber-950 flex items-center justify-center transition active:scale-90 cursor-pointer shadow-xs"
              title={t.back}
            >
              {isRtl ? (
                <ChevronRight className="w-6 h-6 stroke-[2.5]" />
              ) : (
                <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
              )}
            </button>

            {/* Dynamic Centered Title */}
            <div className="flex flex-col items-center">
              <h2 className="text-base font-black text-amber-950 tracking-wide drop-shadow-xs">
                {leaderboardTab === 'wealth' && t.wealthListTitle}
                {leaderboardTab === 'charm' && t.charmListTitle}
                {leaderboardTab === 'room' && t.roomListTitle}
              </h2>
              <span className="text-[10px] font-bold text-amber-800/90 mt-0.5">
                {leaderboardTab === 'wealth' && t.wealthListSubtitle}
                {leaderboardTab === 'charm' && t.charmListSubtitle}
                {leaderboardTab === 'room' && t.roomListSubtitle}
              </span>
            </div>

            {/* Left Button: Help & Reset Rules */}
            <button
              onClick={() => {
                sounds.playClick();
                setShowResetRulesModal(true);
              }}
              className="w-9 h-9 rounded-full bg-amber-100/90 hover:bg-amber-200 border border-amber-300/80 text-amber-950 flex items-center justify-center transition active:scale-90 cursor-pointer shadow-xs"
              title={t.resetQuestion}
            >
              <HelpCircle className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>

          {/* ========================================================================= */}
          {/* Main 3 Category Tabs: [ Wealth | Charm | Room ]                           */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-amber-100/70 border border-amber-300/70 shadow-inner">
            {/* 1. Wealth */}
            <button
              onClick={() => {
                sounds.playClick();
                setLeaderboardTab('wealth');
              }}
              className={`py-1.5 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                leaderboardTab === 'wealth'
                  ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 shadow-md scale-[1.02] border border-amber-300'
                  : 'text-amber-900/80 hover:bg-amber-200/50'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-amber-900" />
              <span>{t.cardWealth}</span>
            </button>

            {/* 2. Charm */}
            <button
              onClick={() => {
                sounds.playClick();
                setLeaderboardTab('charm');
              }}
              className={`py-1.5 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                leaderboardTab === 'charm'
                  ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 shadow-md scale-[1.02] border border-amber-300'
                  : 'text-amber-900/80 hover:bg-amber-200/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-900" />
              <span>{t.cardCharm}</span>
            </button>

            {/* 3. Room */}
            <button
              onClick={() => {
                sounds.playClick();
                setLeaderboardTab('room');
              }}
              className={`py-1.5 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                leaderboardTab === 'room'
                  ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 shadow-md scale-[1.02] border border-amber-300'
                  : 'text-amber-900/80 hover:bg-amber-200/50'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-900" />
              <span>{t.cardRoom}</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* Time Period Sub-Tabs: [ Daily | Weekly | Monthly ]                        */}
          {/* ========================================================================= */}
          <div className="flex flex-col items-center gap-1.5 pt-0.5">
            <div className="inline-flex p-0.5 rounded-full bg-white/95 border border-amber-300/70 shadow-2xs">
              {(
                [
                  { id: 'daily', label: t.timeDaily },
                  { id: 'weekly', label: t.timeWeekly },
                  { id: 'monthly', label: t.timeMonthly },
                ] as const
              ).map((p) => {
                const isActive = period === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      sounds.playClick();
                      setPeriod(p.id);
                    }}
                    className={`px-4 py-1 rounded-full text-[11px] font-black transition cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 shadow-xs'
                        : 'text-amber-900/70 hover:text-amber-950'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Reset Time Info & Quick Question Click */}
            <div
              onClick={() => {
                sounds.playClick();
                setShowResetRulesModal(true);
              }}
              className="flex items-center justify-center gap-1.5 text-[10.5px] font-bold text-amber-900/90 cursor-pointer hover:text-amber-950 transition active:scale-98"
            >
              <Clock className="w-3 h-3 text-amber-700" />
              <span>
                {period === 'daily' && t.resetDailyText}
                {period === 'weekly' && t.resetWeeklyText}
                {period === 'monthly' && t.resetMonthlyText}
              </span>
              <span className="text-[10px] text-amber-700 underline font-black">
                ({t.resetQuestion})
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-3 pt-3 pb-24 space-y-3.5">
          
          {/* ========================================================================= */}
          {/* BANNER: Throne of Top Supporters                                          */}
          {/* ========================================================================= */}
          <div className="relative rounded-2xl bg-gradient-to-r from-[#FAF0D7] via-[#FFF8E7] to-[#F5E6C4] border-2 border-amber-400/80 py-3.5 px-4 shadow-sm overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:14px_14px] opacity-15 pointer-events-none" />
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-400/15 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-amber-300/15 rounded-full blur-xl pointer-events-none" />

            <h2 className="relative z-10 text-xl sm:text-2xl font-black text-amber-950 tracking-wide font-['Cairo',sans-serif] text-center drop-shadow-xs">
              {t.throneOfSupporters}
            </h2>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: الثروة (Wealth Leaderboard)                                        */}
          {/* ========================================================================= */}
          {leaderboardTab === 'wealth' && (
            <>
              {/* TOP 3 PODIUM */}
              <div className="relative rounded-3xl bg-gradient-to-b from-white via-amber-50/80 to-amber-100/60 border border-amber-300/70 p-4 shadow-md overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#fde68a_1px,transparent_1px)] [background-size:12px_12px] opacity-40 pointer-events-none" />

                <div className="relative z-10 flex items-end justify-center gap-2 pt-2 pb-1">
                  {/* TOP 2 (Silver Podium) */}
                  {topWealth2 && (
                    <div
                      onClick={() => handleOpenUser(topWealth2.user)}
                      className="flex-1 flex flex-col items-center cursor-pointer group active:scale-95 transition"
                    >
                      <div className="relative mb-1">
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-base filter drop-shadow">
                          🥈
                        </span>
                        <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-b from-slate-200 to-slate-400 border-2 border-slate-300 shadow-md">
                          <img
                            src={topWealth2.user.avatar}
                            alt={topWealth2.user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-slate-400 to-slate-600 text-white text-[9px] font-black px-2 py-0.2 rounded-full shadow-xs">
                          #2
                        </div>
                      </div>

                      <VipName
                        name={topWealth2.user.name}
                        vipLevel={topWealth2.user.vipLevel}
                        fallbackColor="text-slate-900"
                        className="text-xs font-black max-w-[85px] mt-1 text-center"
                      />

                      <div className="flex items-center justify-center mt-1">
                        <WealthBadge level={topWealth2.user.wealthLevel} size="xs" />
                      </div>

                      <div className="mt-1 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-950 text-[10px] font-bold shadow-2xs font-sans">
                        <span>{topWealth2.supportAmount.toLocaleString()}</span>
                        <span>🪙</span>
                      </div>
                    </div>
                  )}

                  {/* TOP 1 (Gold Royal Falcon Sovereign Podium) */}
                  {topWealth1 && (
                    <div
                      onClick={() => handleOpenUser(topWealth1.user)}
                      className="flex-1.1 flex flex-col items-center cursor-pointer group active:scale-95 transition -mt-3"
                    >
                      <div className="relative mb-1">
                        <div className="w-20 h-20 rounded-full p-1.5 bg-gradient-to-b from-amber-300 via-yellow-200 to-amber-500 border-2 border-amber-400 shadow-xl ring-3 ring-amber-300/40">
                          <img
                            src={topWealth1.user.avatar}
                            alt={topWealth1.user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[11px] font-black px-3 py-0.5 rounded-full shadow-md border border-white">
                          #1
                        </div>
                      </div>

                      <VipName
                        name={topWealth1.user.name}
                        vipLevel={topWealth1.user.vipLevel}
                        fallbackColor="text-amber-950"
                        className="text-sm font-black max-w-[100px] mt-1 text-center"
                      />

                      <div className="flex items-center justify-center mt-1">
                        <WealthBadge level={topWealth1.user.wealthLevel} size="xs" />
                      </div>

                      <div className="mt-1.5 flex items-center gap-1 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 border border-amber-500 text-slate-950 text-xs font-black shadow-xs font-sans">
                        <span>{topWealth1.supportAmount.toLocaleString()}</span>
                        <span className="text-amber-900">🪙</span>
                      </div>
                    </div>
                  )}

                  {/* TOP 3 (Bronze Podium) */}
                  {topWealth3 && (
                    <div
                      onClick={() => handleOpenUser(topWealth3.user)}
                      className="flex-1 flex flex-col items-center cursor-pointer group active:scale-95 transition"
                    >
                      <div className="relative mb-1">
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-base filter drop-shadow">
                          🥉
                        </span>
                        <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-b from-amber-600 to-amber-800 border-2 border-amber-600 shadow-md">
                          <img
                            src={topWealth3.user.avatar}
                            alt={topWealth3.user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-700 to-amber-900 text-white text-[9px] font-black px-2 py-0.2 rounded-full shadow-xs">
                          #3
                        </div>
                      </div>

                      <VipName
                        name={topWealth3.user.name}
                        vipLevel={topWealth3.user.vipLevel}
                        fallbackColor="text-slate-900"
                        className="text-xs font-black max-w-[85px] mt-1 text-center"
                      />

                      <div className="flex items-center justify-center mt-1">
                        <WealthBadge level={topWealth3.user.wealthLevel} size="xs" />
                      </div>

                      <div className="mt-1 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-950 text-[10px] font-bold shadow-2xs font-sans">
                        <span>{topWealth3.supportAmount.toLocaleString()}</span>
                        <span>🪙</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION: 7 Wealth Supporters (Ranks 4 to 10) - Without friend request icon button */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-black text-amber-950">
                    قائمة الداعمين (4 - 10)
                  </span>
                  <span className="text-[10px] text-amber-800 font-bold">
                    مرتبة حسب قيمة الدعم
                  </span>
                </div>

                {restWealth7.map((supporter) => {
                  return (
                    <div
                      key={supporter.user.id}
                      onClick={() => handleOpenUser(supporter.user)}
                      className="p-2.5 rounded-2xl bg-white/95 hover:bg-amber-50/80 border border-amber-200/90 shadow-xs flex items-center justify-between gap-2.5 cursor-pointer active:scale-98 transition group"
                    >
                      {/* Right: Rank + Avatar + Name + Badges */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Rank Badge */}
                        <div className="w-6 h-6 rounded-full bg-amber-100 border border-amber-300 text-amber-950 text-xs font-black flex items-center justify-center shrink-0 font-sans shadow-2xs">
                          {supporter.rank}
                        </div>

                        {/* Avatar with country flag */}
                        <div className="relative w-11 h-11 rounded-full p-0.5 bg-gradient-to-b from-amber-200 to-amber-400 border border-amber-300 shrink-0">
                          <img
                            src={supporter.user.avatar}
                            alt={supporter.user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                          {supporter.user.countryFlag && (
                            <span className="absolute -bottom-1 -left-1 text-xs">
                              {supporter.user.countryFlag}
                            </span>
                          )}
                        </div>
                        <div className="text-right min-w-0">
                          <VipName
                            name={supporter.user.name}
                            vipLevel={supporter.user.vipLevel}
                            fallbackColor="text-slate-900"
                            className="text-xs font-black truncate max-w-[130px]"
                          />
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <WealthBadge level={supporter.user.wealthLevel} size="xs" />
                            <span className="text-[9px] text-slate-500 font-mono">
                              ID:{supporter.user.id}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Left: Support amount only (بدون أيقونة طلب صداقة) */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-300/80 text-amber-950 font-black text-xs font-sans shadow-2xs">
                            <span>{supporter.supportAmount.toLocaleString()}</span>
                            <span className="text-amber-500 text-xs">🪙</span>
                          </div>
                          <span className="text-[9px] text-amber-700/80 mt-0.5 font-bold">
                            قيمة الدعم
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: الجاذبية (Charm Leaderboard)                                        */}
          {/* مريح للبصر، ذهبي اللون، يظهر به مستوى السحر وقيمة المرمي للحساب              */}
          {/* وبدون أيقونة طلب صداقة                                                     */}
          {/* ========================================================================= */}
          {leaderboardTab === 'charm' && (
            <>
              {/* TOP 3 PODIUM FOR CHARM */}
              <div className="relative rounded-3xl bg-gradient-to-b from-white via-amber-50/80 to-amber-100/60 border border-amber-300/70 p-4 shadow-md overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#fde68a_1px,transparent_1px)] [background-size:12px_12px] opacity-40 pointer-events-none" />

                <div className="relative z-10 flex items-end justify-center gap-2 pt-2 pb-1">
                  {/* TOP 2 (Silver Podium) */}
                  {topCharm2 && (
                    <div
                      onClick={() => handleOpenUser(topCharm2.user)}
                      className="flex-1 flex flex-col items-center cursor-pointer group active:scale-95 transition"
                    >
                      <div className="relative mb-1">
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-base filter drop-shadow">
                          🥈
                        </span>
                        <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-b from-slate-200 to-slate-400 border-2 border-slate-300 shadow-md">
                          <img
                            src={topCharm2.user.avatar}
                            alt={topCharm2.user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-slate-400 to-slate-600 text-white text-[9px] font-black px-2 py-0.2 rounded-full shadow-xs">
                          #2
                        </div>
                      </div>

                      <VipName
                        name={topCharm2.user.name}
                        vipLevel={topCharm2.user.vipLevel}
                        fallbackColor="text-slate-900"
                        className="text-xs font-black max-w-[85px] mt-1 text-center"
                      />

                      {/* مستوى السحر (Magic Level Badge) */}
                      <div className="flex items-center justify-center mt-1">
                        <CharmBadge level={topCharm2.user.charmLevel} size="xs" />
                      </div>

                      {/* قيمة المرمي للحساب (Received Gifts Value) */}
                      <div className="mt-1 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-950 text-[10px] font-bold shadow-2xs font-sans">
                        <span>{topCharm2.charmReceived.toLocaleString()}</span>
                        <span>💎</span>
                      </div>
                      <span className="text-[8px] font-bold text-amber-800 mt-0.5">مرمي للحساب</span>
                    </div>
                  )}

                  {/* TOP 1 (Gold Royal Charm Podium with Falcon Aura) */}
                  {topCharm1 && (
                    <div
                      onClick={() => handleOpenUser(topCharm1.user)}
                      className="flex-1.1 flex flex-col items-center cursor-pointer group active:scale-95 transition -mt-3"
                    >
                      <div className="relative mb-1">
                        <div className="w-20 h-20 rounded-full p-1.5 bg-gradient-to-b from-amber-300 via-yellow-200 to-amber-500 border-2 border-amber-400 shadow-xl ring-3 ring-amber-300/40">
                          <img
                            src={topCharm1.user.avatar}
                            alt={topCharm1.user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[11px] font-black px-3 py-0.5 rounded-full shadow-md border border-white">
                          #1
                        </div>
                      </div>

                      <VipName
                        name={topCharm1.user.name}
                        vipLevel={topCharm1.user.vipLevel}
                        fallbackColor="text-amber-950"
                        className="text-sm font-black max-w-[100px] mt-1 text-center"
                      />

                      {/* مستوى السحر (Magic Level Badge) */}
                      <div className="flex items-center justify-center mt-1">
                        <CharmBadge level={topCharm1.user.charmLevel} size="xs" />
                      </div>

                      {/* قيمة المرمي للحساب */}
                      <div className="mt-1.5 flex items-center gap-1 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 border border-amber-500 text-slate-950 text-xs font-black shadow-xs font-sans">
                        <span>{topCharm1.charmReceived.toLocaleString()}</span>
                        <span>💎</span>
                      </div>
                      <span className="text-[9px] font-black text-amber-900 mt-0.5">مرمي للحساب (مرسل له)</span>
                    </div>
                  )}

                  {/* TOP 3 (Bronze Podium) */}
                  {topCharm3 && (
                    <div
                      onClick={() => handleOpenUser(topCharm3.user)}
                      className="flex-1 flex flex-col items-center cursor-pointer group active:scale-95 transition"
                    >
                      <div className="relative mb-1">
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-base filter drop-shadow">
                          🥉
                        </span>
                        <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-b from-amber-600 to-amber-800 border-2 border-amber-600 shadow-md">
                          <img
                            src={topCharm3.user.avatar}
                            alt={topCharm3.user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-700 to-amber-900 text-white text-[9px] font-black px-2 py-0.2 rounded-full shadow-xs">
                          #3
                        </div>
                      </div>

                      <VipName
                        name={topCharm3.user.name}
                        vipLevel={topCharm3.user.vipLevel}
                        fallbackColor="text-slate-900"
                        className="text-xs font-black max-w-[85px] mt-1 text-center"
                      />

                      {/* مستوى السحر (Magic Level Badge) */}
                      <div className="flex items-center justify-center mt-1">
                        <CharmBadge level={topCharm3.user.charmLevel} size="xs" />
                      </div>

                      {/* قيمة المرمي للحساب */}
                      <div className="mt-1 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-950 text-[10px] font-bold shadow-2xs font-sans">
                        <span>{topCharm3.charmReceived.toLocaleString()}</span>
                        <span>💎</span>
                      </div>
                      <span className="text-[8px] font-bold text-amber-800 mt-0.5">مرمي للحساب</span>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION: Ranks 4 to 10 for Charm - Without friend request icon button */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-black text-amber-950 flex items-center gap-1">
                    <span>✨</span>
                    <span>قائمة الجاذبية (4 - 10)</span>
                  </span>
                  <span className="text-[10px] text-amber-800 font-bold">
                    بمستوى السحر وقيمة المرمي
                  </span>
                </div>

                {restCharm7.map((item) => {
                  return (
                    <div
                      key={item.user.id}
                      onClick={() => handleOpenUser(item.user)}
                      className="p-2.5 rounded-2xl bg-white/95 hover:bg-amber-50/80 border border-amber-200/90 shadow-xs flex items-center justify-between gap-2.5 cursor-pointer active:scale-98 transition group"
                    >
                      {/* Right: Rank + Avatar + Name + مستوى السحر */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Rank Badge */}
                        <div className="w-6 h-6 rounded-full bg-amber-100 border border-amber-300 text-amber-950 text-xs font-black flex items-center justify-center shrink-0 font-sans shadow-2xs">
                          {item.rank}
                        </div>

                        {/* Avatar with country flag */}
                        <div className="relative w-11 h-11 rounded-full p-0.5 bg-gradient-to-b from-amber-200 to-amber-400 border border-amber-300 shrink-0">
                          <img
                            src={item.user.avatar}
                            alt={item.user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                          {item.user.countryFlag && (
                            <span className="absolute -bottom-1 -left-1 text-xs">
                              {item.user.countryFlag}
                            </span>
                          )}
                        </div>

                        <div className="text-right min-w-0">
                          <VipName
                            name={item.user.name}
                            vipLevel={item.user.vipLevel}
                            fallbackColor="text-slate-900"
                            className="text-xs font-black truncate max-w-[130px]"
                          />
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {/* مستوى السحر */}
                            <CharmBadge level={item.user.charmLevel} size="xs" />
                            <span className="text-[9px] text-slate-500 font-mono">
                              ID:{item.user.id}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Left: قيمة المرمي للحساب فقط (بدون أيقونة طلب صداقة) */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-950 font-black text-xs font-sans shadow-2xs">
                            <span>{item.charmReceived.toLocaleString()}</span>
                            <span className="text-amber-500 text-xs">💎</span>
                          </div>
                          <span className="text-[9px] text-amber-700 mt-0.5 font-bold">
                            مرمي للحساب
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: الغرفة (Room Leaderboard)                                          */}
          {/* مريح للبصر، ذهبي اللون، شيل كلمة كاس، شيل المستطيل الأخضر المكتوب فيه دخول */}
          {/* إظهار اسم الروم وصورة الروم وقيمة المرمي للروم                            */}
          {/* ========================================================================= */}
          {leaderboardTab === 'room' && (
            <>
              {/* TOP 3 PODIUM FOR ROOMS */}
              <div className="relative rounded-3xl bg-gradient-to-b from-white via-amber-50/80 to-amber-100/60 border border-amber-300/70 p-4 shadow-md overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#fde68a_1px,transparent_1px)] [background-size:12px_12px] opacity-40 pointer-events-none" />

                <div className="relative z-10 flex items-end justify-center gap-2 pt-2 pb-1">
                  {/* TOP 2 Room (Silver Podium) */}
                  {topRoom2 && (
                    <div
                      onClick={() => handleEnterRoom(topRoom2.id)}
                      className="flex-1 flex flex-col items-center cursor-pointer group active:scale-95 transition"
                    >
                      <div className="relative mb-1">
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-base filter drop-shadow">
                          🥈
                        </span>
                        {/* صورة الروم */}
                        <div className="w-16 h-16 rounded-2xl p-1 bg-gradient-to-b from-slate-200 to-slate-400 border-2 border-slate-300 shadow-md overflow-hidden">
                          <img
                            src={topRoom2.coverImage}
                            alt={topRoom2.title}
                            className="w-full h-full rounded-xl object-cover"
                          />
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-slate-400 to-slate-600 text-white text-[9px] font-black px-2 py-0.2 rounded-full shadow-xs">
                          #2
                        </div>
                      </div>

                      {/* اسم الروم */}
                      <span className="text-xs font-black text-slate-900 max-w-[85px] mt-1 text-center truncate">
                        {topRoom2.title}
                      </span>

                      {/* قيمة المرمي للروم */}
                      <div className="mt-1 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-950 text-[10px] font-bold shadow-2xs font-sans">
                        <span>{topRoom2.roomGiftsAmount.toLocaleString()}</span>
                        <span>💎</span>
                      </div>
                      <span className="text-[9px] font-bold text-amber-800 mt-0.5">مرمي للروم</span>
                    </div>
                  )}

                  {/* TOP 1 Room (Gold Royal Room Podium with Falcon Aura) */}
                  {topRoom1 && (
                    <div
                      onClick={() => handleEnterRoom(topRoom1.id)}
                      className="flex-1.1 flex flex-col items-center cursor-pointer group active:scale-95 transition -mt-3"
                    >
                      <div className="relative mb-1">
                        {/* صورة الروم المركز الأول */}
                        <div className="w-20 h-20 rounded-2xl p-1.5 bg-gradient-to-b from-amber-300 via-yellow-200 to-amber-500 border-2 border-amber-400 shadow-xl ring-3 ring-amber-300/40 overflow-hidden">
                          <img
                            src={topRoom1.coverImage}
                            alt={topRoom1.title}
                            className="w-full h-full rounded-xl object-cover"
                          />
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[11px] font-black px-3 py-0.5 rounded-full shadow-md border border-white">
                          #1
                        </div>
                      </div>

                      {/* اسم الروم */}
                      <span className="text-sm font-black text-amber-950 max-w-[100px] mt-1 text-center truncate">
                        {topRoom1.title}
                      </span>

                      {/* قيمة المرمي للروم */}
                      <div className="mt-1.5 flex items-center gap-1 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 border border-amber-500 text-slate-950 text-xs font-black shadow-xs font-sans">
                        <span>{topRoom1.roomGiftsAmount.toLocaleString()}</span>
                        <span>💎 مرمي للروم</span>
                      </div>
                    </div>
                  )}

                  {/* TOP 3 Room (Bronze Podium) */}
                  {topRoom3 && (
                    <div
                      onClick={() => handleEnterRoom(topRoom3.id)}
                      className="flex-1 flex flex-col items-center cursor-pointer group active:scale-95 transition"
                    >
                      <div className="relative mb-1">
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-base filter drop-shadow">
                          🥉
                        </span>
                        {/* صورة الروم */}
                        <div className="w-16 h-16 rounded-2xl p-1 bg-gradient-to-b from-amber-600 to-amber-800 border-2 border-amber-600 shadow-md overflow-hidden">
                          <img
                            src={topRoom3.coverImage}
                            alt={topRoom3.title}
                            className="w-full h-full rounded-xl object-cover"
                          />
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-700 to-amber-900 text-white text-[9px] font-black px-2 py-0.2 rounded-full shadow-xs">
                          #3
                        </div>
                      </div>

                      {/* اسم الروم */}
                      <span className="text-xs font-black text-slate-900 max-w-[85px] mt-1 text-center truncate">
                        {topRoom3.title}
                      </span>

                      {/* قيمة المرمي للروم */}
                      <div className="mt-1 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-950 text-[10px] font-bold shadow-2xs font-sans">
                        <span>{topRoom3.roomGiftsAmount.toLocaleString()}</span>
                        <span>💎</span>
                      </div>
                      <span className="text-[9px] font-bold text-amber-800 mt-0.5">مرمي للروم</span>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION: Ranks 4 to 10 for Rooms - بدون المستطيل الأخضر لدخول الروم، النقر على الصف يدخل الروم مباشرة */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-black text-amber-950">
                    قائمة الرومات (4 - 10)
                  </span>
                  <span className="text-[10px] text-amber-800 font-bold">
                    مرتبة حسب قيمة المرمي للروم
                  </span>
                </div>

                {restRoom7.map((room) => {
                  return (
                    <div
                      key={room.id}
                      onClick={() => handleEnterRoom(room.id)}
                      className="p-2.5 rounded-2xl bg-white/95 hover:bg-amber-50/80 border border-amber-200/90 shadow-xs flex items-center justify-between gap-2.5 cursor-pointer active:scale-98 transition group"
                    >
                      {/* Right: Rank + صورة الروم + اسم الروم + المضيف */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Rank Badge */}
                        <div className="w-6 h-6 rounded-full bg-amber-100 border border-amber-300 text-amber-950 text-xs font-black flex items-center justify-center shrink-0 font-sans shadow-2xs">
                          {room.rank}
                        </div>

                        {/* صورة الروم */}
                        <div className="relative w-11 h-11 rounded-xl p-0.5 bg-gradient-to-b from-amber-200 to-amber-400 border border-amber-300 shrink-0 overflow-hidden">
                          <img
                            src={room.coverImage}
                            alt={room.title}
                            className="w-full h-full rounded-lg object-cover"
                          />
                        </div>

                        {/* Room Info */}
                        <div className="text-right min-w-0">
                          <span className="text-xs font-black text-slate-900 block truncate max-w-[140px] group-hover:text-amber-900 transition">
                            {room.title}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-500 truncate max-w-[80px]">
                              المضيف: {room.hostName}
                            </span>
                            <span className="text-[9px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-full font-bold">
                              🎧 {room.activeListeners}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Left: قيمة المرمي للروم فقط (تم حذف المستطيل الأخضر المكتوب فيه دخول) */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-950 font-black text-xs font-sans shadow-2xs">
                            <span>{room.roomGiftsAmount.toLocaleString()}</span>
                            <span className="text-amber-500 text-xs">💎</span>
                          </div>
                          <span className="text-[9px] text-amber-800 mt-0.5 font-bold">
                            مرمي للروم
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

        </div>

        {/* Bottom Floating Bar: Current User Status & Primary Action in Golden Theme */}
        <footer className="absolute bottom-0 inset-x-0 z-30 p-3 bg-white/95 backdrop-blur-md border-t border-amber-300/70 shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-amber-400 shrink-0">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="text-right">
              {leaderboardTab === 'wealth' && (
                <>
                  <span className="text-[10px] text-slate-500 font-bold block">
                    مستوى دعمك الحالي:
                  </span>
                  <div className="flex items-center gap-1 text-xs font-black text-amber-900 font-sans">
                    <span>{(currentUser.wealthExp || 0).toLocaleString()} 🪙</span>
                    <span className="text-[10px] text-slate-400">
                      (مستوى {currentUser.wealthLevel || 1})
                    </span>
                  </div>
                </>
              )}

              {leaderboardTab === 'charm' && (
                <>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500 font-bold">
                      مستوى السحر:
                    </span>
                    <CharmBadge level={currentUser.charmLevel || 1} size="xs" />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-black text-amber-950 font-sans">
                    <span>مرمي لك: {(currentUser.charmExp || 0).toLocaleString()} 💎</span>
                  </div>
                </>
              )}

              {leaderboardTab === 'room' && (
                <>
                  <span className="text-[10px] text-slate-500 font-bold block">
                    دعم الروم الحالي:
                  </span>
                  <div className="flex items-center gap-1 text-xs font-black text-amber-950 font-sans">
                    <span>14,500,000 💎 مرمي للروم</span>
                    <span className="text-[10px] text-slate-400">
                      (تؤام روحي)
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Button - Unified Royal Golden Style */}
          {leaderboardTab === 'wealth' && (
            <button
              onClick={() => {
                sounds.playClick();
                setOpenRechargeModal(true);
              }}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer border border-amber-300/80"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>شحن ودعم الحساب</span>
            </button>
          )}

          {leaderboardTab === 'charm' && (
            <button
              onClick={() => {
                sounds.playClick();
                setOpenRechargeModal(true);
              }}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer border border-amber-300/80"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>زيادة الجاذبية</span>
            </button>
          )}

          {leaderboardTab === 'room' && (
            <button
              onClick={() => {
                sounds.playClick();
                handleEnterRoom('room-soulmate');
              }}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer border border-amber-300/80"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>دخول الروم</span>
            </button>
          )}
        </footer>
      </div>

      {/* ========================================================================= */}
      {/* DIALOG: When is the reset & rules                                         */}
      {/* ========================================================================= */}
      {showResetRulesModal && (
        <div
          className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          dir={isRtl ? 'rtl' : 'ltr'}
          onClick={() => setShowResetRulesModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-slate-800 border border-amber-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-amber-950">
                  {t.resetDialogTitle}
                </h3>
              </div>
              <button
                onClick={() => {
                  sounds.playClick();
                  setShowResetRulesModal(false);
                }}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Answer & Explanation */}
            <div className="space-y-3 text-xs leading-relaxed max-h-[60vh] overflow-y-auto no-scrollbar">
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80">
                <h4 className="font-black text-amber-950 mb-2 flex items-center gap-1.5 text-[13px]">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span>{t.resetOfficialTimes}</span>
                </h4>
                <ul className="space-y-2.5 text-slate-700 font-medium">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <div>
                      <strong className="text-amber-950 text-xs block font-black">
                        1. {t.timeDaily}:
                      </strong>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {t.resetDailyDetail}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <div>
                      <strong className="text-amber-950 text-xs block font-black">
                        2. {t.timeWeekly}:
                      </strong>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {t.resetWeeklyDetail}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <div>
                      <strong className="text-amber-950 text-xs block font-black">
                        3. {t.timeMonthly}:
                      </strong>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {t.resetMonthlyDetail}
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Point Calculation Info */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <h4 className="font-black text-slate-900 mb-1.5 flex items-center gap-1.5 text-[12px]">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span>{t.calculationRulesTitle}</span>
                </h4>
                <div className="space-y-1 text-[11px] text-slate-600">
                  <p>• {t.calcWealth}</p>
                  <p>• {t.calcCharm}</p>
                  <p>• {t.calcRoom}</p>
                </div>
              </div>
            </div>

            {/* Confirmation Button */}
            <button
              onClick={() => {
                sounds.playClick();
                setShowResetRulesModal(false);
              }}
              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-105 text-slate-950 font-black text-xs shadow-md transition cursor-pointer"
            >
              {t.understood}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
