import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { activeVipTier, hasVipChatBubble, hasVipEntrance } from '../src/utils/vipPerks';

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
for (let tier = 1; tier <= 12; tier += 1) {
  const key = String(tier).padStart(2, '0');
  assert.equal(activeVipTier(tier), tier);
  assert.equal(hasVipEntrance(tier), tier >= 6);
  assert.equal(hasVipChatBubble(tier), tier <= 8);
  assert.match(css, new RegExp('\\.vip-shine-' + tier + '\\s*\\{'));
  for (const path of ['frames/vip' + key + '.webp', 'badges/vip_badge_' + key + '.png', 'showcase/vip' + key + '.png']) {
    assert.ok(existsSync(new URL('../public/assets/vip/' + path, import.meta.url)), path);
  }
}
for (const tier of [undefined, 0, -1, 5.5, 13, Infinity, NaN]) {
  assert.equal(activeVipTier(tier), 0);
  assert.equal(hasVipEntrance(tier), false);
  assert.equal(hasVipChatBubble(tier), false);
}
console.log('VIP1–12 asset paths, name styles and entrance/bubble thresholds passed.');
