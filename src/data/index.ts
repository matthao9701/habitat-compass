import type { City } from './types';
import europe from './cities/europe.json';
import asia from './cities/asia.json';
import africa from './cities/africa.json';
import northAmerica from './cities/north-america.json';
import southAmerica from './cities/south-america.json';
import oceania from './cities/oceania.json';

export const cities: City[] = [
  ...(europe as unknown as City[]),
  ...(asia as unknown as City[]),
  ...(africa as unknown as City[]),
  ...(northAmerica as unknown as City[]),
  ...(southAmerica as unknown as City[]),
  ...(oceania as unknown as City[]),
];

export type { City, Region, ClimateType, VisaStatus, EpiBand, CityClimateDetail, CityVisaDetail } from './types';
