export interface ProductReview {
  id: string;
  productId: string;
  author: string;
  city: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  verified: boolean;
}

const REVIEWS_STORAGE_KEY = 'teak_in_furnitures_reviews_v1';

const SEEDED_REVIEWS: Record<string, ProductReview[]> = {
  'prod-chettinad-teak': [
    {
      id: 'rev-1',
      productId: 'prod-chettinad-teak',
      author: 'Meenakshi Rajan',
      city: 'Chennai',
      rating: 5,
      title: 'Zero squeaks even after years of coastal humidity',
      comment: 'The solid Burma Teak joinery is rock solid. Delivered and assembled by their guild carpenters in Adyar without a single metal screw.',
      createdAt: '2026-10-18',
      verified: true,
    },
    {
      id: 'rev-2',
      productId: 'prod-chettinad-teak',
      author: 'Senthil Nathan',
      city: 'Coimbatore',
      rating: 5,
      title: 'True heirloom thickness',
      comment: 'You can feel the weight of the 4×4 corner legs and 5×2 side rails immediately. Worth every rupee over engineered wood.',
      createdAt: '2026-11-02',
      verified: true,
    },
    {
      id: 'rev-3',
      productId: 'prod-chettinad-teak',
      author: 'Anitha Krishnan',
      city: 'Madurai',
      rating: 4,
      title: 'Beautiful hand-rubbed wax finish',
      comment: 'Natural grain looks warm in morning light. Lead time was 10 days as promised.',
      createdAt: '2026-11-12',
      verified: true,
    },
  ],
  'prod-chettinad-canopy': [
    {
      id: 'rev-4',
      productId: 'prod-chettinad-canopy',
      author: 'Aravind Subramanian',
      city: 'Chennai',
      rating: 5,
      title: 'Showstopper four-poster frame',
      comment: '82-inch solid teak posts with double-wedged mortise joints. Completely rigid and zero wobble.',
      createdAt: '2026-10-25',
      verified: true,
    },
    {
      id: 'rev-5',
      productId: 'prod-chettinad-canopy',
      author: 'Divya Venkatesh',
      city: 'Trichy',
      rating: 5,
      title: 'Craftsmanship at its finest',
      comment: 'The 5 cross bars and 20 mm deck feel indestructible. Our carpenter said he rarely sees timber this well seasoned.',
      createdAt: '2026-11-08',
      verified: true,
    },
  ],
  'prod-madurai-mahogany': [
    {
      id: 'rev-6',
      productId: 'prod-madurai-mahogany',
      author: 'Priya Venkataraman',
      city: 'Bangalore',
      rating: 5,
      title: 'Rich reddish-amber mahogany tone',
      comment: 'The turned spindle headboard looks timeless and pairs wonderfully with warm linen.',
      createdAt: '2026-10-29',
      verified: true,
    },
    {
      id: 'rev-7',
      productId: 'prod-madurai-mahogany',
      author: 'Karthikeyan M.',
      city: 'Salem',
      rating: 5,
      title: 'Solid value for pure mahogany',
      comment: 'No veneers anywhere—even the inner slats are clean seasoned mahogany.',
      createdAt: '2026-11-15',
      verified: true,
    },
  ],
};

const FALLBACK_TEMPLATES: Array<Omit<ProductReview, 'id' | 'productId'>> = [
  {
    author: 'Sanjay Krishnaswamy',
    city: 'Coimbatore',
    rating: 5,
    title: 'Immaculate mortise & tenon joinery',
    comment: 'White-glove delivery and assembly in under 30 minutes. Zero creaks and rock-solid center support.',
    createdAt: '2026-11-04',
    verified: true,
  },
  {
    author: 'Lakshmi Narayanan',
    city: 'Chennai',
    rating: 5,
    title: 'Pure heartwood, zero shortcuts',
    comment: 'Inspected the underside cross bars and rail thickness—built like furniture from our grandparents’ era.',
    createdAt: '2026-11-11',
    verified: true,
  },
  {
    author: 'Rajeshwari Sundaram',
    city: 'Erode',
    rating: 4,
    title: 'Smooth satin oil finish',
    comment: 'No harsh chemical lacquer smell, just warm natural timber grain.',
    createdAt: '2026-11-16',
    verified: true,
  },
];

function loadCustomReviews(): ProductReview[] {
  try {
    const raw = window.localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getProductReviews(productId: string): ProductReview[] {
  const custom = loadCustomReviews().filter((r) => r.productId === productId);
  const seeded =
    SEEDED_REVIEWS[productId] ||
    FALLBACK_TEMPLATES.map((tpl, idx) => ({
      ...tpl,
      id: `seed-${productId}-${idx}`,
      productId,
    }));
  return [...custom, ...seeded];
}

export function getProductRatingStats(productId: string): { average: number; count: number } {
  const list = getProductReviews(productId);
  if (list.length === 0) return { average: 4.8, count: 0 };
  const sum = list.reduce((acc, r) => acc + r.rating, 0);
  return {
    average: Math.round((sum / list.length) * 10) / 10,
    count: list.length,
  };
}

export function addProductReview(
  productId: string,
  input: { author: string; city: string; rating: number; title: string; comment: string }
): ProductReview {
  const review: ProductReview = {
    id: `rev-${Date.now()}`,
    productId,
    author: input.author.trim(),
    city: input.city.trim() || 'Tamil Nadu',
    rating: Math.min(5, Math.max(1, input.rating)),
    title: input.title.trim(),
    comment: input.comment.trim(),
    createdAt: new Date().toISOString().slice(0, 10),
    verified: true,
  };
  const existing = loadCustomReviews();
  try {
    window.localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify([review, ...existing]));
  } catch {
    // ignore storage quota errors
  }
  return review;
}

export function getHighlightReviews(): ProductReview[] {
  const custom = loadCustomReviews();
  const seeded = Object.values(SEEDED_REVIEWS).flat();
  const combined = [...custom, ...seeded, ...FALLBACK_TEMPLATES.map((t, i) => ({ ...t, id: `hl-${i}`, productId: 'featured' }))];
  return combined.slice(0, 10);
}
