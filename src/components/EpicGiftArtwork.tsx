import React from 'react';

type IconName = 'falcon' | 'throne' | 'dragon' | 'jet' | 'heart';

/** Resolution-independent premium vector illustrations. No emoji or remote assets. */
export const EpicGiftArtwork: React.FC<{ kind: IconName }> = ({ kind }) => {
  const shared = { stroke: 'url(#gold)', strokeWidth: 4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  return (
    <svg viewBox="0 0 320 320" width="min(76vw,310px)" height="min(76vw,310px)" role="img" aria-label={kind} style={{filter:'drop-shadow(0 0 25px var(--epic-glow))'}}>
      <defs>
        <linearGradient id="gold" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#fff9d5"/><stop offset=".35" stopColor="#f9d37b"/><stop offset=".7" stopColor="#b57a29"/><stop offset="1" stopColor="#fff2ba"/></linearGradient>
        <linearGradient id="ruby" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#ffb1d2"/><stop offset=".5" stopColor="#c71e62"/><stop offset="1" stopColor="#650d41"/></linearGradient>
        <linearGradient id="steel" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#fff"/><stop offset=".5" stopColor="#8ac4dc"/><stop offset="1" stopColor="#34627b"/></linearGradient>
      </defs>
      <circle cx="160" cy="160" r="139" fill="none" stroke="url(#gold)" strokeWidth="2" opacity=".3" strokeDasharray="3 12"/>
      {kind === 'falcon' && <g {...shared} fill="url(#gold)">
        <path d="M158 119 Q115 60 23 77 Q70 117 100 156 L24 137 Q75 203 138 194 L158 246 L182 194 Q245 203 296 137 L220 156 Q250 117 297 77 Q205 60 162 119 Z"/>
        <path d="M137 110 Q160 85 183 110 L178 159 L160 177 L142 159 Z" fill="#f8f2d9"/>
        <path d="M160 134 L187 144 L160 156" fill="#d98c1f"/>
        <circle cx="148" cy="128" r="4" fill="#111" stroke="none"/>
        <path d="M113 175 L73 193 M207 175 L247 193 M143 208 L124 242 M177 208 L196 242" fill="none"/>
      </g>}
      {kind === 'throne' && <g {...shared}>
        <path d="M84 232 L84 91 Q160 27 236 91 L236 232 Z" fill="#4b1647"/>
        <path d="M101 211 L101 105 Q160 63 219 105 L219 211" fill="#9e2458" strokeWidth="7"/>
        <path d="M103 211 L217 211 L239 247 L81 247 Z" fill="url(#ruby)"/>
        <path d="M76 160 L100 160 L100 250 L70 250 Z M220 160 L244 160 L250 250 L220 250 Z" fill="url(#gold)"/>
        <path d="M160 64 L175 89 L160 104 L145 89 Z" fill="#d3f8ee"/>
        <path d="M73 258 L247 258 L258 274 L62 274 Z" fill="url(#gold)"/>
        <path d="M112 125 Q160 100 208 125" fill="none"/>
      </g>}
      {kind === 'dragon' && <g {...shared}>
        <path d="M70 234 Q39 195 81 160 Q44 104 109 80 L123 39 L151 78 Q206 65 228 103 L277 91 L249 124 L286 143 L250 159 Q256 205 215 233 Q181 254 141 231 Q122 260 82 268 Q111 240 70 234 Z" fill="#7e2637"/>
        <path d="M120 107 L75 68 L97 137 M175 89 L201 46 L208 113 M131 189 L84 161 L113 213" fill="#f7c762"/>
        <path d="M216 122 L251 125 L228 142" fill="#f8d886"/>
        <circle cx="211" cy="113" r="6" fill="#f9f3bd" stroke="none"/>
        <path d="M245 162 Q282 172 267 198 L292 210 L257 217 L273 240 L237 225" fill="#ffb83e"/>
        <path d="M127 151 Q164 120 194 154 Q167 171 161 203" fill="none"/>
      </g>}
      {kind === 'jet' && <g {...shared}>
        <path d="M157 37 Q175 36 180 66 L196 155 L281 213 Q295 224 290 238 L194 210 L191 254 L218 273 L215 284 L166 269 L119 284 L116 273 L143 254 L140 210 L44 238 Q39 224 53 213 L138 155 L153 66 Q153 48 157 37 Z" fill="url(#steel)"/>
        <path d="M166 64 L166 245 M142 182 L64 224 M190 182 L268 224" fill="none" stroke="#fff4c7" strokeWidth="3"/>
        <path d="M156 99 L177 99 L182 126 L151 126 Z" fill="#29526d"/>
        <path d="M121 279 Q166 301 211 279" fill="none" strokeDasharray="5 10"/>
      </g>}
      {kind === 'heart' && <g {...shared}>
        <path d="M160 268 C122 237 46 189 46 121 C46 63 115 45 160 98 C205 45 274 63 274 121 C274 189 198 237 160 268 Z" fill="url(#ruby)" strokeWidth="7"/>
        <path d="M160 246 L160 108 L104 146 L160 246 L216 146 L160 108" fill="none" stroke="#ffc6d9" strokeWidth="3" opacity=".8"/>
        <path d="M62 127 Q30 104 13 122 Q40 160 71 163 M258 127 Q290 104 307 122 Q280 160 249 163" fill="#fff0cc"/>
        <path d="M102 102 Q125 82 142 109" fill="none" stroke="#fff" strokeWidth="8" opacity=".8"/>
        <path d="M143 76 L160 49 L177 76" fill="none"/>
      </g>}
    </svg>
  );
};
