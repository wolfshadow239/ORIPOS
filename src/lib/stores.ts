
import { Store } from './types';

export const STORES: Store[] = [
  { id: 'amanora',   name: 'Orison Retail - Amanora Mall',                 short: 'Amanora',    area: 'Amanora Mall',    city: 'Pune', phone: '+91 20 4000 1001', size: 1.25 },
  { id: 'season',    name: 'Orison Retail - Season Mall',                  short: 'Season',     area: 'Season Mall',     city: 'Pune', phone: '+91 20 4000 1002', size: 1.10 },
  { id: 'viman',     name: 'Orison Retail - Viman Nagar',                  short: 'Viman Ngr',  area: 'Viman Nagar',     city: 'Pune', phone: '+91 20 4000 1003', size: 1.00 },
  { id: 'wakad',     name: 'Orison Retail - Wakad',                        short: 'Wakad',      area: 'Wakad',           city: 'Pune', phone: '+91 20 4000 1004', size: 0.95 },
  { id: 'pimple',    name: 'Orison Retail - Pimple Saudagar',              short: 'Pimple Sdg', area: 'Pimple Saudagar', city: 'Pune', phone: '+91 20 4000 1005', size: 0.85 },
  { id: 'ravet',     name: 'Orison Retail - Ravet',                        short: 'Ravet',      area: 'Ravet',           city: 'Pune', phone: '+91 20 4000 1006', size: 0.70 },
  { id: 'moshi',     name: 'Orison Retail - Moshi',                        short: 'Moshi',      area: 'Moshi',           city: 'Pune', phone: '+91 20 4000 1007', size: 0.65 },
  { id: 'chinchwad', name: 'Orison Retail - Chinchwad',                    short: 'Chinchwad',  area: 'Chinchwad',       city: 'Pune', phone: '+91 20 4000 1008', size: 0.80 },
  { id: 'viman-sc',  name: 'Orison Retail - Viman Nagar Service Centre',   short: 'VN Service', area: 'Viman Nagar',     city: 'Pune', phone: '+91 20 4000 1009', size: 0.60 },
];

export const storeById = (id: string): Store => STORES.find(s => s.id === id) || STORES[0];
