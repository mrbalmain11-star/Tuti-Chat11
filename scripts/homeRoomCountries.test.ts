import assert from 'node:assert/strict';
import { filterRoomsByCountry, roomCountries, roomCountryCode } from '../src/data/roomCountries';

const rooms = ['العراق', 'المملكة العربية السعودية', 'السعودية', 'سوريا', '', 'Iraq'].map((country, id) => ({ id, country }));
assert.deepEqual(filterRoomsByCountry(rooms, 'IQ').map(room => room.id), [0, 5]);
assert.deepEqual(filterRoomsByCountry(rooms, 'SA').map(room => room.id), [1, 2]);
assert.deepEqual(filterRoomsByCountry(rooms, 'SY').map(room => room.id), [3]);
assert.deepEqual(filterRoomsByCountry(rooms, 'KW'), []);
assert.equal(filterRoomsByCountry(rooms, 'all'), rooms);
assert.equal(roomCountryCode('عمان'), 'OM');
assert.equal(roomCountryCode(null), '');
assert.equal(roomCountries.find(country => country.code === 'SA')?.flag, '🇸🇦');
console.log('Home room country aliases, exact filters, empty results and existing room order passed.');
