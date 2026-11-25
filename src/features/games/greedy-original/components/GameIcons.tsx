import React from 'react';
import { RealFoodPhoto } from './RealFoodPhoto';

// Luxury Embossed Gold Coin Icon
export const CoinIcon: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    className={`inline-block drop-shadow-sm transition-transform ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <radialGradient id="coin_rim_grad" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FFF9C4" />
        <stop offset="35%" stopColor="#FBC02D" />
        <stop offset="70%" stopColor="#F57F17" />
        <stop offset="100%" stopColor="#8D3200" />
      </radialGradient>
      <radialGradient id="coin_core_grad" cx="40%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#FFFDE7" />
        <stop offset="50%" stopColor="#FFD54F" />
        <stop offset="85%" stopColor="#FFA000" />
        <stop offset="100%" stopColor="#D84315" />
      </radialGradient>
      <linearGradient id="coin_crown_grad" x1="12" y1="12" x2="28" y2="28">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="50%" stopColor="#FFF176" />
        <stop offset="100%" stopColor="#FF8F00" />
      </linearGradient>
    </defs>
    {/* Outer Coin Body */}
    <circle cx="20" cy="20" r="19" fill="url(#coin_rim_grad)" stroke="#B78103" strokeWidth="1.5" />
    <circle cx="20" cy="20" r="15.5" fill="url(#coin_core_grad)" stroke="#FFF9C4" strokeWidth="1" strokeDasharray="3 1.5" />
    {/* Embossed Crown & Star */}
    <path
      d="M13 24.5L14.8 17L18 20.5L20 15L22 20.5L25.2 17L27 24.5H13Z"
      fill="url(#coin_crown_grad)"
      stroke="#792800"
      strokeWidth="0.8"
    />
    <circle cx="20" cy="24.5" r="1.8" fill="#FFFDE7" stroke="#792800" strokeWidth="0.5" />
    {/* Specular sheen curve */}
    <path
      d="M8 14C11 8 20 6 28 9"
      stroke="#FFFFFF"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeOpacity="0.75"
    />
  </svg>
);

// High-Fidelity 3D Wooden Plank "Greedy" Sign
export const GreedyWoodSign: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
    <svg width="156" height="50" viewBox="0 0 156 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wood_body_grad" x1="78" y1="0" x2="78" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F3D19C" />
          <stop offset="0.25" stopColor="#E0A96D" />
          <stop offset="0.7" stopColor="#B87333" />
          <stop offset="1" stopColor="#6E370F" />
        </linearGradient>
        <filter id="wood_glow" x="-4" y="-3" width="164" height="58" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.5" />
        </filter>
      </defs>
      {/* Wooden Board Silhouette */}
      <path
        d="M6 14L14 4H142L150 16L146 38L140 46H16L8 38L6 14Z"
        fill="url(#wood_body_grad)"
        stroke="#451E06"
        strokeWidth="3"
        filter="url(#wood_glow)"
      />
      {/* Deep wood grain lines */}
      <path d="M16 16C50 13 105 17 140 15" stroke="#7A390C" strokeWidth="1.5" strokeOpacity="0.7" />
      <path d="M18 33C55 35 100 31 138 34" stroke="#7A390C" strokeWidth="1.5" strokeOpacity="0.6" />
      <path d="M12 25H144" stroke="#451E06" strokeWidth="1.2" strokeOpacity="0.4" strokeDasharray="32 6 22 5" />
      {/* Nails */}
      <circle cx="15" cy="25" r="2.5" fill="#2E1303" stroke="#FFF" strokeWidth="0.5" strokeOpacity="0.3" />
      <circle cx="141" cy="25" r="2.5" fill="#2E1303" stroke="#FFF" strokeWidth="0.5" strokeOpacity="0.3" />
    </svg>
    {/* Stylized Embossed Typography - ToTi (توتي) */}
    <span
      className="absolute inset-0 flex items-center justify-center font-black text-2xl tracking-normal text-[#3B1502]"
      style={{
        fontFamily: "'Changa', 'Tajawal', sans-serif",
        textShadow: '0 1px 0 #FFE8A3, 0 -1px 0 #180801, 1px 2px 3px rgba(0,0,0,0.75)',
        letterSpacing: '0.02em',
      }}
    >
      توتي
    </span>
    {/* Fresh Leaves sprouting on top right */}
    <div className="absolute -top-2.5 -right-1.5 pointer-events-none transform rotate-12">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M4 18C4 18 10 16 14 10C18 4 22 2 22 2C22 2 20 6 16 12C12 18 6 20 4 18Z" fill="#76FF03" stroke="#2E7D32" strokeWidth="1.2" />
        <path d="M10 22C10 22 13 18 17 14C21 10 23 7 23 7C23 7 20 9 16 13C12 17 10 22 10 22Z" fill="#00E676" stroke="#1B5E20" strokeWidth="1.2" />
      </svg>
    </div>
  </div>
);

// HOT Flame Badge - compact and cleanly contained within the square slot
export const HotBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`absolute top-0.5 right-0.5 z-20 pointer-events-none ${className}`}>
    <div className="flex items-center justify-center px-1.5 py-0.2 rounded-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 border border-yellow-200 shadow-xs">
      <span className="text-[8px] font-black tracking-tight text-white uppercase italic drop-shadow-xs">
        HOT 🔥
      </span>
    </div>
  </div>
);

// 1. High-Detail Golden Fish (السمك - 45x)
export const FishFoodIcon: React.FC<{ size?: number; className?: string }> = ({ size = 64, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 84 84" fill="none" className={className}>
    <defs>
      <radialGradient id="fish_body_glow" cx="45%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#FFF9C4" />
        <stop offset="35%" stopColor="#FFA726" />
        <stop offset="75%" stopColor="#E65100" />
        <stop offset="100%" stopColor="#7E2400" />
      </radialGradient>
      <linearGradient id="fish_fin_shade" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFE082" />
        <stop offset="60%" stopColor="#FF9800" />
        <stop offset="100%" stopColor="#BF360C" />
      </linearGradient>
    </defs>
    {/* Tail fin with ray ridges */}
    <path d="M24 42 L6 26 C12 36 12 48 6 58 Z" fill="url(#fish_fin_shade)" stroke="#4E1500" strokeWidth="1.8" />
    <path d="M12 36 L22 41" stroke="#FFE082" strokeWidth="1.2" />
    <path d="M12 48 L22 43" stroke="#FFE082" strokeWidth="1.2" />
    {/* Dorsal fin */}
    <path d="M38 24 C46 12 60 14 65 22 C56 24 44 24 38 24 Z" fill="url(#fish_fin_shade)" stroke="#4E1500" strokeWidth="1.5" />
    {/* Ventral & pectoral fin */}
    <path d="M44 48 C50 52 56 56 50 63 C44 60 40 55 44 48 Z" fill="url(#fish_fin_shade)" stroke="#4E1500" strokeWidth="1.5" />
    {/* Torpedo Fish Body */}
    <path
      d="M76 42 C72 28 54 22 32 28 C20 31 16 39 16 42 C16 45 20 53 32 56 C54 62 72 56 76 42 Z"
      fill="url(#fish_body_glow)"
      stroke="#4E1500"
      strokeWidth="2.2"
    />
    {/* Glowing Scales Arcs */}
    <path d="M52 28 C50 36 50 48 52 56" stroke="#8D3200" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M42 31 C40 38 40 46 42 53" stroke="#8D3200" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M32 35 C30 40 30 44 32 49" stroke="#8D3200" strokeWidth="2.2" strokeLinecap="round" />
    {/* Belly highlight */}
    <path d="M28 51 C40 54 58 52 68 45" stroke="#FFE082" strokeWidth="2" strokeOpacity="0.8" />
    {/* Fish Eye */}
    <circle cx="66" cy="37" r="5.5" fill="#FFFFFF" stroke="#4E1500" strokeWidth="1.8" />
    <circle cx="67.5" cy="37" r="3" fill="#1A1A1A" />
    <circle cx="68.5" cy="35.5" r="1.3" fill="#FFFFFF" />
    {/* Gills & Smile */}
    <path d="M58 35 C56 40 56 45 58 50" stroke="#7E2400" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M72 43 C70 46 67 45 65 45" stroke="#4E1500" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 2. High-Detail Juicy Marbled Steak / Meat (اللحم - 25x)
export const MeatFoodIcon: React.FC<{ size?: number; className?: string }> = ({ size = 64, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 84 84" fill="none" className={className}>
    <defs>
      <linearGradient id="steak_red_grad" x1="20" y1="18" x2="68" y2="68" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF5252" />
        <stop offset="0.3" stopColor="#D50000" />
        <stop offset="0.75" stopColor="#990000" />
        <stop offset="1" stopColor="#4A0000" />
      </linearGradient>
      <radialGradient id="bone_center" cx="40%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="70%" stopColor="#FFF8E1" />
        <stop offset="100%" stopColor="#D7CCC8" />
      </radialGradient>
    </defs>
    {/* Meat Body Silhouette */}
    <path
      d="M20 34 C15 48 22 66 40 68 C58 70 72 56 70 40 C68 24 50 16 36 18 C26 20 21 26 20 34 Z"
      fill="url(#steak_red_grad)"
      stroke="#330000"
      strokeWidth="2.5"
    />
    {/* Creamy Fat Cap / Rim */}
    <path
      d="M20 34 C15 48 22 66 40 68"
      stroke="#FFF3E0"
      strokeWidth="4.5"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M20 34 C15 48 22 66 40 68"
      stroke="#FFCDD2"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
    {/* Gourmet Marbling Streaks */}
    <path d="M30 31 C36 33 42 28 48 32" stroke="#FFEBEE" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M28 44 C34 47 43 44 52 48" stroke="#FFEBEE" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M34 55 C41 57 49 54 56 59" stroke="#FFEBEE" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M52 28 C56 31 60 29 64 33" stroke="#FFEBEE" strokeWidth="2" strokeLinecap="round" />
    {/* Ivory Bone Center */}
    <ellipse cx="46" cy="38" rx="6" ry="5" fill="url(#bone_center)" stroke="#795548" strokeWidth="1.5" />
    <circle cx="46" cy="38" r="2.2" fill="#BCAAA4" />
    {/* Herb Garnish (Fresh Thyme sprig) */}
    <path d="M40 24 C44 26 48 24 50 20" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
    <circle cx="44" cy="23" r="1.5" fill="#81C784" />
    <circle cx="48" cy="21" r="1.5" fill="#81C784" />
  </svg>
);

// 3. Crispy Golden Roasted Chicken Drumstick (الدجاج - 15x)
export const ChickenFoodIcon: React.FC<{ size?: number; className?: string }> = ({ size = 64, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 84 84" fill="none" className={className}>
    <defs>
      <linearGradient id="roast_glaze" x1="16" y1="16" x2="68" y2="68" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFE082" />
        <stop offset="0.25" stopColor="#FFA726" />
        <stop offset="0.7" stopColor="#E65100" />
        <stop offset="1" stopColor="#6D1B00" />
      </linearGradient>
    </defs>
    {/* White Knuckle Bone Tips */}
    <circle cx="68" cy="65" r="5" fill="#FAFAFA" stroke="#9E9E9E" strokeWidth="1.5" />
    <circle cx="72" cy="58" r="5" fill="#FAFAFA" stroke="#9E9E9E" strokeWidth="1.5" />
    <path d="M54 50 L68 62" stroke="#FAFAFA" strokeWidth="8" strokeLinecap="round" />
    {/* Plump Roasted Drumstick */}
    <path
      d="M55 48 C60 41 57 29 48 20 C36 8 20 14 13 24 C6 35 11 50 23 57 C34 64 48 58 55 48 Z"
      fill="url(#roast_glaze)"
      stroke="#4E1A00"
      strokeWidth="2.5"
    />
    {/* Caramelized Crispy Glaze Highlights */}
    <ellipse cx="26" cy="27" rx="11" ry="6" transform="rotate(-32 26 27)" fill="#FFF9C4" fillOpacity="0.45" />
    <path d="M22 41 C28 45 38 45 44 38" stroke="#4E1A00" strokeWidth="2" strokeOpacity="0.5" strokeLinecap="round" />
    <path d="M30 48 C36 51 44 49 48 44" stroke="#4E1A00" strokeWidth="2" strokeOpacity="0.4" strokeLinecap="round" />
    {/* Roasted seasoning flakes */}
    <circle cx="28" cy="35" r="1.2" fill="#3E1A00" />
    <circle cx="34" cy="28" r="1.2" fill="#3E1A00" />
    <circle cx="38" cy="40" r="1.2" fill="#3E1A00" />
  </svg>
);

// 4. Succulent Glazed Tiger Shrimp (الروبيان - 10x)
export const ShrimpFoodIcon: React.FC<{ size?: number; className?: string }> = ({ size = 64, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 84 84" fill="none" className={className}>
    <defs>
      <linearGradient id="shrimp_coral_glow" x1="20" y1="18" x2="70" y2="68" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFCCBC" />
        <stop offset="0.35" stopColor="#FF7043" />
        <stop offset="0.75" stopColor="#E64A19" />
        <stop offset="100%" stopColor="#A82800" />
      </linearGradient>
    </defs>
    {/* Fan Tail */}
    <path d="M60 58 C70 62 74 69 71 73 C66 75 60 70 55 64 Z" fill="#FF8A65" stroke="#7A1D00" strokeWidth="1.6" />
    <path d="M55 64 C60 70 62 77 58 79 C53 79 49 73 49 66 Z" fill="#FF7043" stroke="#7A1D00" strokeWidth="1.6" />
    {/* Curled Body */}
    <path
      d="M26 26 C44 13 65 21 69 39 C71 50 64 61 54 67 C45 60 50 49 47 43 C44 35 32 32 26 26 Z"
      fill="url(#shrimp_coral_glow)"
      stroke="#7A1D00"
      strokeWidth="2.2"
    />
    {/* Translucent Shell Segments */}
    <path d="M37 22 C41 29 42 34 40 39" stroke="#FFFDE7" strokeWidth="2" strokeOpacity="0.8" strokeLinecap="round" />
    <path d="M50 24 C54 31 54 37 52 44" stroke="#FFFDE7" strokeWidth="2" strokeOpacity="0.8" strokeLinecap="round" />
    <path d="M61 33 C63 40 61 48 56 54" stroke="#FFFDE7" strokeWidth="2" strokeOpacity="0.8" strokeLinecap="round" />
    {/* Eye */}
    <circle cx="28" cy="27" r="3" fill="#111" stroke="#7A1D00" strokeWidth="1.2" />
    <circle cx="29.2" cy="26" r="1" fill="#FFF" />
    {/* Elegant Whiskers */}
    <path d="M24 24 C16 16 10 16 6 18" stroke="#FFAB91" strokeWidth="2" strokeLinecap="round" />
    <path d="M22 27 C14 27 10 32 8 37" stroke="#FFAB91" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 5. Fresh Heirloom Ruby Tomato (الطماطم - 5x)
export const TomatoFoodIcon: React.FC<{ size?: number; className?: string }> = ({ size = 64, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 84 84" fill="none" className={className}>
    <defs>
      <radialGradient id="tomato_ruby_glow" cx="35%" cy="32%" r="65%">
        <stop offset="0%" stopColor="#FF7070" />
        <stop offset="40%" stopColor="#E53935" />
        <stop offset="80%" stopColor="#B71C1C" />
        <stop offset="100%" stopColor="#5B0000" />
      </radialGradient>
    </defs>
    {/* Plump Round Tomato */}
    <ellipse cx="42" cy="48" rx="28" ry="25" fill="url(#tomato_ruby_glow)" stroke="#4A0000" strokeWidth="2.5" />
    {/* Primary Specular Light Reflection */}
    <ellipse cx="32" cy="40" rx="9" ry="5" transform="rotate(-22 32 40)" fill="#FFFFFF" fillOpacity="0.45" />
    {/* Secondary Gloss Rim */}
    <path d="M22 56 C24 64 34 70 46 70" stroke="#FF8A80" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5" />
    {/* Fresh Green Stem & Star Calyx */}
    <path d="M42 27 L42 16 C42 13 45 11 48 11" stroke="#2E7D32" strokeWidth="3.5" strokeLinecap="round" />
    <path
      d="M42 26 C35 22 29 24 25 22 C29 27 33 28 35 29 C29 32 25 36 24 40 C29 38 34 35 37 33 C36 39 37 44 40 46 C42 41 42 35 43 33 C46 36 51 40 56 41 C55 36 51 33 46 29 C48 28 52 27 57 23 C52 24 47 24 42 26 Z"
      fill="#43A047"
      stroke="#1B5E20"
      strokeWidth="1.5"
    />
  </svg>
);

// 6. Lush Emerald Broccoli Floret (البروكلي - 5x)
export const BroccoliFoodIcon: React.FC<{ size?: number; className?: string }> = ({ size = 64, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 84 84" fill="none" className={className}>
    <defs>
      <linearGradient id="stalk_rich" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#C8E6C9" />
        <stop offset="45%" stopColor="#81C784" />
        <stop offset="100%" stopColor="#388E3C" />
      </linearGradient>
      <radialGradient id="floret_top" cx="40%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#81C784" />
        <stop offset="50%" stopColor="#43A047" />
        <stop offset="100%" stopColor="#1B5E20" />
      </radialGradient>
    </defs>
    {/* Thick Crisp Stalk */}
    <path d="M35 44 L33 71 C33 73 37 75 42 75 C47 75 51 73 51 71 L49 44 Z" fill="url(#stalk_rich)" stroke="#1B5E20" strokeWidth="2.2" />
    {/* Rich Broccoli Florets */}
    <circle cx="28" cy="38" r="15" fill="url(#floret_top)" stroke="#1B5E20" strokeWidth="2" />
    <circle cx="56" cy="38" r="15" fill="url(#floret_top)" stroke="#1B5E20" strokeWidth="2" />
    <circle cx="42" cy="25" r="17" fill="url(#floret_top)" stroke="#1B5E20" strokeWidth="2" />
    <circle cx="33" cy="27" r="12" fill="#66BB6A" stroke="#1B5E20" strokeWidth="1.5" />
    <circle cx="51" cy="27" r="12" fill="#4CAF50" stroke="#1B5E20" strokeWidth="1.5" />
    {/* Crisp Micro Texture Buds */}
    <circle cx="38" cy="21" r="2.5" fill="#C8E6C9" />
    <circle cx="46" cy="23" r="2.5" fill="#A5D6A7" />
    <circle cx="27" cy="36" r="2.2" fill="#C8E6C9" />
    <circle cx="57" cy="36" r="2.2" fill="#A5D6A7" />
    <circle cx="42" cy="33" r="3" fill="#81C784" />
  </svg>
);

// 7. Juicy Sweet Corn on the Cob (الذرة - 5x)
export const CornFoodIcon: React.FC<{ size?: number; className?: string }> = ({ size = 64, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 84 84" fill="none" className={className}>
    <defs>
      <linearGradient id="corn_gold_glow" x1="25" y1="18" x2="60" y2="60" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFFDE7" />
        <stop offset="0.3" stopColor="#FFEE58" />
        <stop offset="0.75" stopColor="#FDD835" />
        <stop offset="1" stopColor="#F57F17" />
      </linearGradient>
    </defs>
    {/* Corn Kernel Cob */}
    <ellipse cx="44" cy="39" rx="16" ry="26" transform="rotate(-26 44 39)" fill="url(#corn_gold_glow)" stroke="#7A3F00" strokeWidth="2.2" />
    {/* Kernels Grid Pattern */}
    <path d="M31 30 C35 32 40 35 44 37" stroke="#C47D00" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M35 39 C39 41 44 44 49 46" stroke="#C47D00" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M39 48 C43 50 48 53 53 55" stroke="#C47D00" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M40 23 C40 34 42 45 44 56" stroke="#C47D00" strokeWidth="1.8" strokeLinecap="round" />
    {/* Peeling Crisp Green Husks */}
    <path
      d="M22 65 C26 52 28 37 24 28 C28 39 32 56 37 67 Z"
      fill="#81C784"
      stroke="#2E7D32"
      strokeWidth="2"
    />
    <path
      d="M50 67 C59 58 63 43 59 34 C65 45 61 58 48 71 Z"
      fill="#66BB6A"
      stroke="#2E7D32"
      strokeWidth="2"
    />
  </svg>
);

// 8. Crisp Sweet Crunchy Carrot (الجزر - 5x)
export const CarrotFoodIcon: React.FC<{ size?: number; className?: string }> = ({ size = 64, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 84 84" fill="none" className={className}>
    <defs>
      <linearGradient id="carrot_vivid" x1="20" y1="18" x2="62" y2="62" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFCC80" />
        <stop offset="0.3" stopColor="#FF9800" />
        <stop offset="0.75" stopColor="#F4511E" />
        <stop offset="1" stopColor="#BF360C" />
      </linearGradient>
    </defs>
    {/* Lush Green Foliage */}
    <path d="M50 14 C50 14 59 5 65 9 C69 13 61 22 61 22 Z" fill="#66BB6A" stroke="#1B5E20" strokeWidth="1.6" />
    <path d="M57 20 C57 20 68 15 72 22 C74 29 63 31 59 27 Z" fill="#4CAF50" stroke="#1B5E20" strokeWidth="1.6" />
    <path d="M48 23 C48 23 55 14 61 16 C63 21 57 27 52 27 Z" fill="#81C784" stroke="#1B5E20" strokeWidth="1.6" />
    {/* Carrot Tapered Body */}
    <path
      d="M54 24 C60 28 58 37 53 44 L25 73 C23 75 19 75 17 73 C15 71 15 67 17 65 L42 26 C46 21 50 21 54 24 Z"
      fill="url(#carrot_vivid)"
      stroke="#8D2600"
      strokeWidth="2.4"
    />
    {/* Horizontal Organic Ridges */}
    <path d="M46 33 C42 34 40 32 38 33" stroke="#8D2600" strokeWidth="2" strokeLinecap="round" />
    <path d="M39 43 C35 44 33 42 31 43" stroke="#8D2600" strokeWidth="2" strokeLinecap="round" />
    <path d="M31 53 C28 54 26 52 24 53" stroke="#8D2600" strokeWidth="2" strokeLinecap="round" />
    <path d="M24 62 C22 63 20 62 19 63" stroke="#8D2600" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Salad Bowl (سلطة - فوز جميع الخضار)
export const SaladBowlIcon: React.FC<{ size?: number; className?: string }> = ({ size = 64, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 84 84" fill="none" className={className}>
    <defs>
      <linearGradient id="bowl_porcelain" x1="42" y1="44" x2="42" y2="76" gradientUnits="userSpaceOnUse">
        <stop stopColor="#90CAF9" />
        <stop offset="0.6" stopColor="#1E88E5" />
        <stop offset="1" stopColor="#0D47A1" />
      </linearGradient>
    </defs>
    {/* Overflowing Salad Greens & Veggies */}
    <circle cx="28" cy="38" r="13" fill="#66BB6A" stroke="#1B5E20" strokeWidth="1.6" />
    <circle cx="56" cy="38" r="13" fill="#4CAF50" stroke="#1B5E20" strokeWidth="1.6" />
    <circle cx="42" cy="32" r="15" fill="#81C784" stroke="#1B5E20" strokeWidth="1.6" />
    {/* Sliced Cherry Tomatoes & Cucumber */}
    <circle cx="35" cy="34" r="5.5" fill="#E53935" stroke="#B71C1C" strokeWidth="1.2" />
    <circle cx="48" cy="36" r="5.5" fill="#FFF59D" stroke="#FBC02D" strokeWidth="1.2" />
    <circle cx="48" cy="36" r="3.5" fill="#A5D6A7" />
    {/* Ceramic Bowl */}
    <path
      d="M12 45 C12 68 25 75 42 75 C59 75 72 68 72 45 Z"
      fill="url(#bowl_porcelain)"
      stroke="#FFD54F"
      strokeWidth="2.8"
    />
    <ellipse cx="42" cy="45" rx="30" ry="7.5" fill="#BBDEFB" stroke="#FFD54F" strokeWidth="2.5" />
  </svg>
);

// Gourmet Pizza (بيتزا - فوز جميع اللحوم)
export const PizzaIcon: React.FC<{ size?: number; className?: string }> = ({ size = 64, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 84 84" fill="none" className={className}>
    <defs>
      <linearGradient id="pizza_crust_gold" x1="42" y1="15" x2="42" y2="72" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFE082" />
        <stop offset="0.5" stopColor="#FFB300" />
        <stop offset="1" stopColor="#E65100" />
      </linearGradient>
      <linearGradient id="pizza_cheese_melt" x1="42" y1="20" x2="42" y2="68" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFFDE7" />
        <stop offset="0.6" stopColor="#FFF176" />
        <stop offset="1" stopColor="#FFD54F" />
      </linearGradient>
    </defs>
    {/* Wooden Peel Board */}
    <ellipse cx="42" cy="48" rx="36" ry="25" fill="#D7CCC8" stroke="#8D6E63" strokeWidth="2.2" />
    {/* Crisp Pizza Crust */}
    <ellipse cx="42" cy="45" rx="32" ry="21" fill="url(#pizza_crust_gold)" stroke="#BF360C" strokeWidth="2.2" />
    {/* Bubbling Melted Mozzarella */}
    <ellipse cx="42" cy="45" rx="27" ry="17" fill="url(#pizza_cheese_melt)" />
    {/* Spicy Pepperoni Slices */}
    <circle cx="30" cy="43" r="5.5" fill="#D32F2F" stroke="#8E0000" strokeWidth="1.2" />
    <circle cx="53" cy="41" r="5.5" fill="#D32F2F" stroke="#8E0000" strokeWidth="1.2" />
    <circle cx="41" cy="49" r="5" fill="#D32F2F" stroke="#8E0000" strokeWidth="1.2" />
    <circle cx="44" cy="37" r="5" fill="#D32F2F" stroke="#8E0000" strokeWidth="1.2" />
    {/* Black Olives */}
    <circle cx="36" cy="48" r="2.8" stroke="#212121" strokeWidth="1.8" fill="none" />
    <circle cx="49" cy="48" r="2.8" stroke="#212121" strokeWidth="1.8" fill="none" />
  </svg>
);

// Ginger Cat Mascot with Sunglasses & Tropical Drink
export const CatMascot: React.FC<{ size?: number; className?: string }> = ({ size = 120, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 140 140" fill="none" className={className}>
    <defs>
      <radialGradient id="cat_fur_grad" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#FFE0B2" />
        <stop offset="40%" stopColor="#FFB74D" />
        <stop offset="85%" stopColor="#F57C00" />
        <stop offset="100%" stopColor="#E65100" />
      </radialGradient>
      <linearGradient id="shades_lens_grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#263238" />
        <stop offset="50%" stopColor="#37474F" />
        <stop offset="100%" stopColor="#212121" />
      </linearGradient>
    </defs>

    {/* Left and Right Ears */}
    <path d="M42 46 L30 18 C30 18 48 24 56 34 Z" fill="url(#cat_fur_grad)" stroke="#8D3200" strokeWidth="2.5" />
    <path d="M40 40 L34 24 C34 24 44 28 48 34 Z" fill="#FF8A80" />
    <path d="M98 46 L110 18 C110 18 92 24 84 34 Z" fill="url(#cat_fur_grad)" stroke="#8D3200" strokeWidth="2.5" />
    <path d="M100 40 L106 24 C106 24 96 28 92 34 Z" fill="#FF8A80" />

    {/* Round Cat Head */}
    <ellipse cx="70" cy="62" rx="36" ry="32" fill="url(#cat_fur_grad)" stroke="#8D3200" strokeWidth="2.5" />

    {/* Cheek Fluff */}
    <path d="M34 66 L22 68 L32 76" fill="url(#cat_fur_grad)" stroke="#8D3200" strokeWidth="2" />
    <path d="M106 66 L118 68 L108 76" fill="url(#cat_fur_grad)" stroke="#8D3200" strokeWidth="2" />

    {/* White Muzzle & Pink Nose */}
    <ellipse cx="70" cy="74" rx="16" ry="11" fill="#FFFFFF" />
    <path d="M67 69 H73 L70 73 Z" fill="#FF4081" />
    <path d="M65 74 C67 78 70 78 70 74 C70 78 73 78 75 74" stroke="#8D3200" strokeWidth="1.8" strokeLinecap="round" fill="none" />

    {/* Aviator Sunglasses with Gold Frame */}
    <path d="M44 54 H96" stroke="#FFD54F" strokeWidth="3" strokeLinecap="round" />
    <rect x="42" y="48" width="24" height="18" rx="8" fill="url(#shades_lens_grad)" stroke="#FFD54F" strokeWidth="2.5" />
    <path d="M46 51 L56 61" stroke="#FFF" strokeWidth="2" strokeOpacity="0.6" strokeLinecap="round" />
    <rect x="74" y="48" width="24" height="18" rx="8" fill="url(#shades_lens_grad)" stroke="#FFD54F" strokeWidth="2.5" />
    <path d="M78 51 L88 61" stroke="#FFF" strokeWidth="2" strokeOpacity="0.6" strokeLinecap="round" />

    {/* Collar & Gold Bell */}
    <path d="M48 92 C48 92 56 86 70 86 C84 86 92 92 92 92 Z" fill="#81C784" stroke="#2E7D32" strokeWidth="2" />
    <circle cx="70" cy="88" r="4.5" fill="#FFD700" stroke="#B78103" strokeWidth="1.2" />

    {/* Cocktail Glass in Left Hand */}
    <g transform="translate(14, 48)">
      <path d="M14 20 L2 4 L26 4 Z" fill="#FF8A65" stroke="#FFD54F" strokeWidth="1.5" />
      <path d="M14 20 V34" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M8 34 H20" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M16 2 L20 -6" stroke="#FF5252" strokeWidth="2" strokeLinecap="round" />
      <circle cx="6" cy="4" r="5" fill="#FFEA00" stroke="#F57F17" strokeWidth="1" />
      <circle cx="14" cy="22" r="6" fill="#FFE0B2" stroke="#8D3200" strokeWidth="1.5" />
    </g>

    {/* Waving Paw in Right Hand with Pink Pads */}
    <g transform="translate(104, 52)">
      <circle cx="10" cy="12" r="8" fill="#FFE0B2" stroke="#8D3200" strokeWidth="2" />
      <circle cx="10" cy="12" r="3.5" fill="#FF80AB" />
      <circle cx="6" cy="7" r="1.5" fill="#FF80AB" />
      <circle cx="10" cy="5" r="1.5" fill="#FF80AB" />
      <circle cx="14" cy="7" r="1.5" fill="#FF80AB" />
    </g>
  </svg>
);

// Food Icon Switcher - 100% Genuine Food Photography (صور حقيقية لجميع الأطعمة بدون تقطيع)
export const FoodIconRenderer: React.FC<{ id: string; size?: number; className?: string }> = ({
  id,
  size = 52,
  className = '',
}) => {
  return <RealFoodPhoto id={id} size={size} className={className} />;
};
