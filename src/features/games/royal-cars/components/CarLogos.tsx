import React from 'react';
import { CarId } from '../types/game';

interface LogoProps {
  className?: string;
  size?: number;
}

export const BugattiLogo: React.FC<LogoProps> = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 100 60" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="50" cy="30" rx="48" ry="28" fill="#CC0000" stroke="#E2E8F0" strokeWidth="2.5" />
    <ellipse cx="50" cy="30" rx="44" ry="24" fill="#B91C1C" stroke="#FEE2E2" strokeWidth="1" strokeDasharray="2 2" />
    {/* Stylized EB monogram */}
    <path d="M44 20h4a4 4 0 0 1 4 4c0 2-1.5 3.5-3 3.8 2 .3 3.5 2 3.5 4.2a4 4 0 0 1-4 4h-4.5V20z" fill="#FFFFFF" opacity="0.3" />
    {/* BUGATTI Text */}
    <text
      x="50"
      y="35"
      fill="#FFFFFF"
      fontSize="13"
      fontWeight="900"
      fontFamily="sans-serif"
      letterSpacing="1.5"
      textAnchor="middle"
    >
      BUGATTI
    </text>
  </svg>
);

export const BentleyLogo: React.FC<LogoProps> = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 100 50" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Left Wing */}
    <path
      d="M50 25 C38 12, 18 14, 5 24 C16 28, 34 30, 50 25 Z"
      fill="url(#bentleySilverLeft)"
      stroke="#94A3B8"
      strokeWidth="1"
    />
    <path d="M12 23 C22 20, 35 22, 45 25" stroke="#CBD5E1" strokeWidth="1" />
    <path d="M18 25 C26 23, 36 24, 44 26" stroke="#E2E8F0" strokeWidth="0.8" />
    {/* Right Wing */}
    <path
      d="M50 25 C62 12, 82 14, 95 24 C84 28, 66 30, 50 25 Z"
      fill="url(#bentleySilverRight)"
      stroke="#94A3B8"
      strokeWidth="1"
    />
    <path d="M88 23 C78 20, 65 22, 55 25" stroke="#CBD5E1" strokeWidth="1" />
    <path d="M82 25 C74 23, 64 24, 56 26" stroke="#E2E8F0" strokeWidth="0.8" />
    {/* Center B Disc */}
    <circle cx="50" cy="25" r="14" fill="#0F172A" stroke="#E2E8F0" strokeWidth="2" />
    <text
      x="50"
      y="32"
      fill="#FFFFFF"
      fontSize="19"
      fontWeight="900"
      fontFamily="serif"
      textAnchor="middle"
    >
      B
    </text>
    <defs>
      <linearGradient id="bentleySilverLeft" x1="5" y1="20" x2="50" y2="25" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F8FAFC" />
        <stop offset="0.5" stopColor="#94A3B8" />
        <stop offset="1" stopColor="#CBD5E1" />
      </linearGradient>
      <linearGradient id="bentleySilverRight" x1="95" y1="20" x2="50" y2="25" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F8FAFC" />
        <stop offset="0.5" stopColor="#94A3B8" />
        <stop offset="1" stopColor="#CBD5E1" />
      </linearGradient>
    </defs>
  </svg>
);

export const FerrariLogo: React.FC<LogoProps> = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 60 75" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Yellow Shield */}
    <path
      d="M5 8 C5 4, 8 2, 12 2 L48 2 C52 2, 55 4, 55 8 L55 42 C55 58, 30 73, 30 73 C30 73, 5 58, 5 42 Z"
      fill="#FACC15"
      stroke="#1E293B"
      strokeWidth="2.5"
    />
    {/* Italian flag top bars */}
    <rect x="7" y="3" width="15" height="5" fill="#15803D" />
    <rect x="22" y="3" width="16" height="5" fill="#FFFFFF" />
    <rect x="38" y="3" width="15" height="5" fill="#DC2626" />
    {/* Prancing Horse Silhouette */}
    <path
      d="M32 18 C30 14, 28 17, 27 19 C26 21, 23 21, 22 23 C21 25, 23 27, 24 28 C23 30, 20 32, 19 36 C18 40, 20 42, 23 43 C24 44, 25 43, 26 41 C27 45, 25 50, 26 53 C27 56, 29 55, 30 52 C31 49, 32 46, 32 43 C34 47, 36 51, 38 54 C39 55, 41 53, 40 50 C38 46, 37 42, 36 38 C39 36, 42 33, 42 30 C42 27, 40 26, 37 25 C36 22, 35 19, 32 18 Z"
      fill="#111827"
    />
    {/* S F Letters */}
    <text x="18" y="65" fill="#111827" fontSize="8" fontWeight="bold">S</text>
    <text x="36" y="65" fill="#111827" fontSize="8" fontWeight="bold">F</text>
  </svg>
);

export const LamborghiniLogo: React.FC<LogoProps> = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 60 75" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Shield */}
    <path
      d="M6 8 L54 8 L54 44 C54 60, 30 73, 30 73 C30 73, 6 60, 6 44 Z"
      fill="#111827"
      stroke="#EAB308"
      strokeWidth="2.5"
    />
    <path
      d="M10 11 L50 11 L50 43 C50 56, 30 67, 30 67 C30 67, 10 56, 10 43 Z"
      stroke="#CA8A04"
      strokeWidth="1"
    />
    {/* Arc Text */}
    <text
      x="30"
      y="18"
      fill="#FACC15"
      fontSize="5.5"
      fontWeight="900"
      fontFamily="sans-serif"
      letterSpacing="0.8"
      textAnchor="middle"
    >
      LAMBORGHINI
    </text>
    {/* Charging Bull Silhouette */}
    <path
      d="M38 27 C34 26, 30 28, 27 30 C24 32, 20 33, 17 38 C15 41, 16 44, 20 45 C23 46, 25 43, 27 46 C29 49, 29 53, 31 54 C33 55, 34 53, 33 50 C35 48, 38 46, 42 46 C45 46, 46 49, 47 52 C48 53, 49 52, 49 50 C48 46, 47 42, 45 38 C47 36, 49 33, 47 31 C45 29, 41 28, 38 27 Z"
      fill="#FACC15"
    />
    {/* Bull Horns */}
    <path d="M25 27 C23 25, 21 24, 18 24 C19 26, 22 28, 24 29" stroke="#FEF08A" strokeWidth="1.5" />
  </svg>
);

export const PorscheLogo: React.FC<LogoProps> = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 60 75" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Crest outline */}
    <path
      d="M7 6 L53 6 L53 44 C53 60, 30 73, 30 73 C30 73, 7 60, 7 44 Z"
      fill="#CA8A04"
      stroke="#1E293B"
      strokeWidth="2.5"
    />
    <path
      d="M10 9 L50 9 L50 43 C50 56, 30 68, 30 68 C30 68, 10 56, 10 43 Z"
      fill="#EAB308"
    />
    {/* Top text banner */}
    <rect x="13" y="11" width="34" height="7" fill="#1E293B" rx="1" />
    <text
      x="30"
      y="16.5"
      fill="#FEF08A"
      fontSize="5"
      fontWeight="bold"
      letterSpacing="0.8"
      textAnchor="middle"
    >
      PORSCHE
    </text>
    {/* Quadrants */}
    <rect x="13" y="21" width="16" height="18" fill="#DC2626" />
    <rect x="31" y="21" width="16" height="18" fill="#1E293B" />
    <rect x="13" y="41" width="16" height="18" fill="#1E293B" />
    <rect x="31" y="41" width="16" height="18" fill="#DC2626" />
    {/* Inner center shield with horse */}
    <path
      d="M23 29 L37 29 L37 47 C37 53, 30 57, 30 57 C30 57, 23 53, 23 47 Z"
      fill="#FACC15"
      stroke="#1E293B"
      strokeWidth="1"
    />
    <circle cx="30" cy="40" r="4.5" fill="#1E293B" />
  </svg>
);

export const LandRoverLogo: React.FC<LogoProps> = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 100 55" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="50" cy="27.5" rx="47" ry="25" fill="#065F46" stroke="#94A3B8" strokeWidth="2.5" />
    <ellipse cx="50" cy="27.5" rx="43" ry="21" stroke="#E2E8F0" strokeWidth="1" />
    {/* Main Text */}
    <text
      x="50"
      y="26"
      fill="#FFFFFF"
      fontSize="11"
      fontWeight="900"
      fontFamily="sans-serif"
      letterSpacing="1"
      textAnchor="middle"
    >
      LAND-
    </text>
    <text
      x="50"
      y="38"
      fill="#FFFFFF"
      fontSize="11"
      fontWeight="900"
      fontFamily="sans-serif"
      letterSpacing="1"
      textAnchor="middle"
    >
      ROVER
    </text>
  </svg>
);

export const JaguarLogo: React.FC<LogoProps> = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 70 70" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="35" cy="35" r="32" fill="#7F1D1D" stroke="#E2E8F0" strokeWidth="2.5" />
    <circle cx="35" cy="35" r="28" fill="#991B1B" stroke="#CBD5E1" strokeWidth="1" />
    {/* Roaring Jaguar face icon */}
    <path
      d="M35 18 C27 18, 22 23, 22 30 C22 38, 27 45, 35 48 C43 45, 48 38, 48 30 C48 23, 43 18, 35 18 Z"
      fill="#F1F5F9"
      stroke="#64748B"
      strokeWidth="1.5"
    />
    {/* Eyes & Ears */}
    <path d="M28 24 L25 19 L30 22 Z" fill="#94A3B8" />
    <path d="M42 24 L45 19 L40 22 Z" fill="#94A3B8" />
    <circle cx="29" cy="30" r="2" fill="#0F172A" />
    <circle cx="41" cy="30" r="2" fill="#0F172A" />
    {/* Snout & Fangs */}
    <path d="M32 35 L35 38 L38 35 Z" fill="#0F172A" />
    <path d="M30 40 L32 44 L34 40 L35 44 L36 40 L38 44 L40 40" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const MercedesLogo: React.FC<LogoProps> = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 70 70" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="35" cy="35" r="31" fill="#0F172A" stroke="#E2E8F0" strokeWidth="3" />
    <circle cx="35" cy="35" r="28" stroke="#94A3B8" strokeWidth="1" />
    {/* 3-Pointed Star */}
    {/* Top point */}
    <polygon points="35,7 32,35 35,33" fill="#F8FAFC" />
    <polygon points="35,7 38,35 35,33" fill="#94A3B8" />
    {/* Bottom left point */}
    <polygon points="10,49 35,35 33,38" fill="#F8FAFC" />
    <polygon points="10,49 35,38 33,38" fill="#64748B" />
    {/* Bottom right point */}
    <polygon points="60,49 35,35 37,38" fill="#CBD5E1" />
    <polygon points="60,49 35,38 37,38" fill="#475569" />
  </svg>
);

export const BmwLogo: React.FC<LogoProps> = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 70 70" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Outer chrome ring */}
    <circle cx="35" cy="35" r="32" fill="#111827" stroke="#E2E8F0" strokeWidth="2.5" />
    <circle cx="35" cy="35" r="21" fill="none" stroke="#E2E8F0" strokeWidth="1.5" />
    {/* Inner quadrants */}
    {/* Top-Right: Sky Blue */}
    <path d="M35 14 A21 21 0 0 1 56 35 L35 35 Z" fill="#0284C7" />
    {/* Bottom-Left: Sky Blue */}
    <path d="M35 56 A21 21 0 0 1 14 35 L35 35 Z" fill="#0284C7" />
    {/* Top-Left: White */}
    <path d="M14 35 A21 21 0 0 1 35 14 L35 35 Z" fill="#FFFFFF" />
    {/* Bottom-Right: White */}
    <path d="M56 35 A21 21 0 0 1 35 56 L35 35 Z" fill="#FFFFFF" />
    {/* Letters B M W */}
    <text x="22" y="10" fill="#FFFFFF" fontSize="6.5" fontWeight="900" textAnchor="middle">B</text>
    <text x="35" y="8" fill="#FFFFFF" fontSize="6.5" fontWeight="900" textAnchor="middle">M</text>
    <text x="48" y="10" fill="#FFFFFF" fontSize="6.5" fontWeight="900" textAnchor="middle">W</text>
  </svg>
);

export const VwLogo: React.FC<LogoProps> = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 70 70" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="35" cy="35" r="32" fill="#0284C7" stroke="#E2E8F0" strokeWidth="2.5" />
    <circle cx="35" cy="35" r="28" stroke="#38BDF8" strokeWidth="1.5" />
    {/* Stacked V and W */}
    {/* V at top */}
    <path
      d="M23 18 L35 36 L47 18 M28 18 L35 29 L42 18"
      stroke="#FFFFFF"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* W at bottom */}
    <path
      d="M19 33 L29 52 L35 41 L41 52 L51 33"
      stroke="#FFFFFF"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

export const CarLogoComponent: React.FC<{ carId: CarId; className?: string }> = ({
  carId,
  className = 'w-8 h-8',
}) => {
  switch (carId) {
    case 'bugatti':
      return <BugattiLogo className={className} />;
    case 'bentley':
      return <BentleyLogo className={className} />;
    case 'ferrari':
      return <FerrariLogo className={className} />;
    case 'lamborghini':
      return <LamborghiniLogo className={className} />;
    case 'porsche':
      return <PorscheLogo className={className} />;
    case 'landrover':
      return <LandRoverLogo className={className} />;
    case 'jaguar':
      return <JaguarLogo className={className} />;
    case 'mercedes':
      return <MercedesLogo className={className} />;
    case 'bmw':
      return <BmwLogo className={className} />;
    case 'vw':
      return <VwLogo className={className} />;
    default:
      return null;
  }
};
