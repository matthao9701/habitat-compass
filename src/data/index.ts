import type { City } from './types';
import europe from './cities/europe.json';
import americas from './cities/americas.json';
import africa from './cities/africa.json';
import asia from './cities/asia.json';

export const cities: City[] = [
  ...(europe as City[]),
  ...(americas as City[]),
  ...(africa as City[]),
  ...(asia as City[]),
];

export type { City, Region, ClimateType } from './types';
