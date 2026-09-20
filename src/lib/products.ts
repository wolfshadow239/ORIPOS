
import { Product } from './types';

export const CATEGORIES = [
  'Smartphones',
  'Tablets',
  'Wearables',
  'Audio',
  'TVs',
  'Home Appliances',
  'Laptops',
  'Accessories',
];

export const CAT_EMOJI: Record<string, string> = {
  Smartphones: '📱',
  Tablets: '📲',
  Wearables: '⌚',
  Audio: '🎧',
  TVs: '📺',
  'Home Appliances': '🧺',
  Laptops: '💻',
  Accessories: '🔌',
};

const P = (
  id: string,
  sku: string,
  name: string,
  category: string,
  price: number,
  cost: number,
  gst: number,
): Product => ({ id, sku, name, category, price, cost, gst, emoji: CAT_EMOJI[category] });

export const PRODUCTS: Product[] = [
  // Smartphones
  P('p-s26u', 'SAM-S26U', 'Galaxy S26 Ultra 5G (12/512)', 'Smartphones', 134999, 101200, 18),
  P('p-s26p', 'SAM-S26P', 'Galaxy S26+ 5G (12/256)', 'Smartphones', 109999, 81400, 18),
  P('p-s26', 'SAM-S26', 'Galaxy S26 5G (8/256)', 'Smartphones', 94999, 70300, 18),
  P('p-zfold7', 'SAM-ZFOLD7', 'Galaxy Z Fold7 5G (12/512)', 'Smartphones', 179999, 133200, 18),
  P('p-zflip7', 'SAM-ZFLIP7', 'Galaxy Z Flip7 5G (8/256)', 'Smartphones', 94999, 70300, 18),
  P('p-a56', 'SAM-A56', 'Galaxy A56 5G (8/128)', 'Smartphones', 41999, 31100, 18),
  P('p-a36', 'SAM-A36', 'Galaxy A36 5G (8/128)', 'Smartphones', 30999, 22900, 18),
  P('p-a26', 'SAM-A26', 'Galaxy A26 5G (8/128)', 'Smartphones', 22999, 17000, 18),
  P('p-m56', 'SAM-M56', 'Galaxy M56 5G (8/128)', 'Smartphones', 27999, 20700, 18),
  P('p-m36', 'SAM-M36', 'Galaxy M36 5G (8/128)', 'Smartphones', 21999, 16200, 18),
  P('p-f06', 'SAM-F06', 'Galaxy F06 5G (4/128)', 'Smartphones', 13499, 10000, 18),
  // Tablets
  P('p-tabs10u', 'SAM-TS10U', 'Galaxy Tab S10 Ultra (14.6")', 'Tablets', 109999, 81400, 18),
  P('p-tabs10p', 'SAM-TS10P', 'Galaxy Tab S10+ (12.4")', 'Tablets', 89999, 66600, 18),
  P('p-tabs9fe', 'SAM-TS9FE', 'Galaxy Tab S9 FE (10.9")', 'Tablets', 49999, 37000, 18),
  P('p-taba9p', 'SAM-TA9P', 'Galaxy Tab A9+ (11")', 'Tablets', 20999, 15500, 18),
  P('p-taba9', 'SAM-TA9', 'Galaxy Tab A9 (8.7")', 'Tablets', 14999, 11100, 18),
  // Wearables
  P('p-watch8c', 'SAM-GW8C', 'Galaxy Watch8 Classic 46mm LTE', 'Wearables', 46999, 34800, 18),
  P('p-watch8', 'SAM-GW8', 'Galaxy Watch8 44mm BT', 'Wearables', 34999, 25900, 18),
  P('p-watch7', 'SAM-GW7', 'Galaxy Watch7 40mm BT', 'Wearables', 29999, 22100, 18),
  P('p-watchfe', 'SAM-GWFE', 'Galaxy Watch FE 40mm', 'Wearables', 19999, 14700, 18),
  P('p-ring', 'SAM-RING', 'Galaxy Ring (Titanium)', 'Wearables', 38999, 28800, 18),
  P('p-fit3', 'SAM-FIT3', 'Galaxy Fit3', 'Wearables', 4999, 3700, 18),
  // Audio
  P('p-buds3p', 'SAM-B3PRO', 'Galaxy Buds3 Pro', 'Audio', 19999, 14800, 18),
  P('p-buds3', 'SAM-BUDS3', 'Galaxy Buds3', 'Audio', 14999, 11000, 18),
  P('p-buds2p', 'SAM-B2PRO', 'Galaxy Buds2 Pro', 'Audio', 15999, 11700, 18),
  P('p-budsfe', 'SAM-BFE', 'Galaxy Buds FE', 'Audio', 9999, 7300, 18),
  // TVs (GST 28%)
  P('p-tv85', 'SAM-QN90D85', '85" QN90D Neo QLED 4K', 'TVs', 329999, 244100, 28),
  P('p-tv75', 'SAM-QLED75', '75" QLED 4K Smart TV', 'TVs', 169999, 125800, 28),
  P('p-tv65', 'SAM-C65', '65" Crystal 4K UHD', 'TVs', 89999, 66600, 28),
  P('p-tv55', 'SAM-C55', '55" Crystal 4K UHD', 'TVs', 59999, 44400, 28),
  P('p-tv50', 'SAM-U50', '50" 4K UHD Smart TV', 'TVs', 44999, 33300, 28),
  P('p-tv43', 'SAM-F43', '43" Full HD Smart TV', 'TVs', 29999, 22200, 28),
  P('p-tv32', 'SAM-H32', '32" HD Ready TV', 'TVs', 16999, 12500, 28),
  // Home Appliances
  P('p-ref', 'SAM-BESPOKE', 'Bespoke AI French Door Refrigerator', 'Home Appliances', 89999, 66600, 28),
  P('p-wash', 'SAM-WASHER', 'Bespoke AI Front Load Washer 9kg', 'Home Appliances', 54999, 40700, 28),
  P('p-wd', 'SAM-WDCOMBO', 'Washer Dryer Combo 11kg', 'Home Appliances', 74999, 55400, 28),
  P('p-acw', 'SAM-WINDFREE', '1.5T WindFree AI Inverter AC', 'Home Appliances', 45999, 34000, 28),
  P('p-ac', 'SAM-AC15T', '1.5T Split Inverter AC', 'Home Appliances', 36999, 27300, 28),
  P('p-mwo', 'SAM-MWO28', 'Convection Microwave 28L', 'Home Appliances', 13499, 9700, 18),
  P('p-dress', 'SAM-AIRDRESS', 'AirDresser Steam Closet', 'Home Appliances', 119999, 88700, 28),
  P('p-jetbot', 'SAM-JETBOT', 'Jet Bot+ Robot Vacuum', 'Home Appliances', 49999, 37000, 28),
  P('p-jet75', 'SAM-JET75', 'Jet 75 Cordless Stick Vacuum', 'Home Appliances', 34999, 25900, 28),
  // Laptops
  P('p-book5p', 'SAM-BOOK5P', 'Galaxy Book5 Pro (16", Core Ultra 7)', 'Laptops', 129999, 96200, 18),
  P('p-book5360', 'SAM-BOOK5360', 'Galaxy Book5 360 (15.6" Touch)', 'Laptops', 94999, 70300, 18),
  // Accessories
  P('p-chg45', 'SAM-45W', '45W Fast Travel Charger', 'Accessories', 2999, 1500, 18),
  P('p-wchg', 'SAM-WCHG', 'Wireless Charger Pad', 'Accessories', 3499, 1750, 18),
  P('p-cable', 'SAM-CABLE', 'Type-C Fast Charging Cable', 'Accessories', 999, 500, 18),
  P('p-spen', 'SAM-SPENPRO', 'S Pen Pro', 'Accessories', 9999, 5000, 18),
  P('p-case', 'SAM-CASE', 'Silicone Protective Case', 'Accessories', 1499, 750, 18),
  P('p-glass', 'SAM-GLASS', 'Tempered Screen Protector', 'Accessories', 799, 400, 18),
  P('p-pbank', 'SAM-PBANK', '10000mAh 25W Power Bank', 'Accessories', 2999, 1500, 18),
  P('p-tag', 'SAM-TAG2', 'Galaxy SmartTag2', 'Accessories', 2999, 1500, 18),
];

export const productById = (id: string): Product | undefined => PRODUCTS.find(p => p.id === id);
