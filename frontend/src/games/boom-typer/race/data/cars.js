// Car catalog — maps the server's carId pool to GLB files in
// public/models/cars/ plus a display label and an accent color used by the
// rank panel / lobby chips. Keys must match backend config.js CAR_POOL.

export const CARS = {
  italia: { label: 'Italia', file: '/models/cars/italia.glb', color: '#ff3b3b' },
  coupe:  { label: 'Coupe',  file: '/models/cars/coupe.glb',  color: '#ffd23b' },
  fenyr:  { label: 'Fenyr',  file: '/models/cars/fenyr.glb',  color: '#3bd1ff' },
  ghini:  { label: 'Ghini',  file: '/models/cars/ghini.glb',  color: '#9d6bff' },
  lamb:   { label: 'Lambo',  file: '/models/cars/lamb.glb',   color: '#5cff8f' },
  rally:  { label: 'Rally',  file: '/models/cars/rally.glb',  color: '#ff8f3b' },
  kamaro: { label: 'Kamaro', file: '/models/cars/kamaro.glb', color: '#ff5ec4' },
  jeep:   { label: 'Jeep',   file: '/models/cars/jeep.glb',   color: '#8fd14f' },
  van:    { label: 'Van',    file: '/models/cars/van.glb',    color: '#4f9dd1' },
  mobil:  { label: 'Mobil',  file: '/models/cars/mobil.glb',  color: '#d1b04f' },
  police: { label: 'Police', file: '/models/cars/police.glb', color: '#4f6bd1' },
  armor:  { label: 'Armor',  file: '/models/cars/armor.glb',  color: '#9aa3a0' },
};

export const CAR_IDS = Object.keys(CARS);
const FALLBACK = 'italia';

export function carFile(id) {
  return (CARS[id] || CARS[FALLBACK]).file;
}
export function carColor(id) {
  return (CARS[id] || CARS[FALLBACK]).color;
}
export function carLabel(id) {
  return (CARS[id] || CARS[FALLBACK]).label;
}
