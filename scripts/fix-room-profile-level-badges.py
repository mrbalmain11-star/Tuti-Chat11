from pathlib import Path
p = Path('src/components/VoiceRoomModal.tsx')
s = p.read_text()
imp = "import { ProfileCpCard } from './ProfileCpCard';"
assert s.count(imp) == 1
s = s.replace(imp, imp + "\nimport { RoyalLevelEmblem } from './RoyalLevelEmblem';\nimport { royalProgress } from '../utils/royalLevels';")
for track, xp, ar in [('wealth','wealthExp','الثروة'),('charm','charmExp','السحر')]:
    import re
    pattern = r'<span title={`خبرة '+ar+r' المؤكدة:.*?</span></span>'
    replacement = '<span className="inline-flex items-center gap-1 rounded-xl border border-amber-300/60 bg-slate-900/80 px-2 py-1 text-amber-50"><RoyalLevelEmblem track="'+track+'" level={royalProgress(BigInt(selectedMicVerifiedStatus.'+xp+')).level} kind="badge" size={48} animated={false} /><span>'+ar+' {royalProgress(BigInt(selectedMicVerifiedStatus.'+xp+')).level}</span></span>'
    s, n = re.subn(pattern, lambda m: replacement, s, count=1, flags=re.S)
    assert n == 1, 'Could not find '+track+' generic badge'
p.write_text(s)
print('Replaced both generic room profile pills with verified level emblems')
