import { retailApi } from '@/api/retailApi';

export const DEFAULT_SETTINGS = {
  store_name: '',
  store_tagline: '',
  store_address: '',
  store_phone: '',
  tin: '',
  currency: 'GHS',
  tax_rate: 0,
  receipt_footer: 'Thank you for shopping with us.',
  low_stock_threshold: 5,
};

export async function getSettings() {
  const page = await retailApi.entities.AppSettings.list({ sort: '-created_date', limit: 1 });
  const stored = page.items?.[0];
  if (!stored) return { ...DEFAULT_SETTINGS, id: null };

  const settings = { ...DEFAULT_SETTINGS, ...stored };
  if (settings.store_name === 'RetailPro Store') settings.store_name = '';
  if (settings.store_tagline === 'Provisions & General Goods') settings.store_tagline = '';
  return settings;
}

export async function saveSettings(current, data) {
  if (current?.id) return retailApi.entities.AppSettings.update(current.id, data);
  return retailApi.entities.AppSettings.create(data);
}
