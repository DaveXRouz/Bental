import { useState, useEffect } from 'react';

export interface BrandImages {
  hero: string;
  logo?: string;
  background?: string;
}

const DEFAULT_IMAGES: BrandImages = {
  hero: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=1200',
  logo: 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=400',
  background: 'https://images.pexels.com/photos/355948/pexels-photo-355948.jpeg?auto=compress&cs=tinysrgb&w=1200'
};

export function useBrandImages(): { images: BrandImages; loading: boolean } {
  const [images] = useState<BrandImages>(DEFAULT_IMAGES);
  const [loading] = useState(false);

  return {
    images,
    loading
  };
}

export function getBrandImages(): BrandImages {
  return DEFAULT_IMAGES;
}
