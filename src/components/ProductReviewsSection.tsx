import { type FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, MessageSquarePlus, Star } from 'lucide-react';
import {
  addProductReview,
  getProductRatingStats,
  getProductReviews,
  type ProductReview,
} from '../lib/reviews.ts';

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
}

export function ProductReviewsSection({ productId, productName }: ProductReviewsSectionProps) {
  const [reviews, setReviews] = useState<ProductReview[]>(() => getProductReviews(productId));
  const [stats, setStats] = useState(() => getProductRatingStats(productId));
  const [showForm, setShowForm] = useState(false);

  const [author, setAuthor] = useState('');
  const [city, setCity] = useState('');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submittedNotice, setSubmittedNotice] = useState(false);

  useEffect(() => {
    setReviews(getProductReviews(productId));
    setStats(getProductRatingStats(productId));
    setShowForm(false);
    setSubmittedNotice(false);
  }, [productId]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !comment.trim()) return;
    addProductReview(productId, {
      author,
      city,
      rating,
      title: title || 'Solid Timber Craftsmanship',
      comment,
    });
    setReviews(getProductReviews(productId));
    setStats(getProductRatingStats(productId));
    setAuthor('');
    setCity('');
    setRating(5);
    setTitle('');
    setComment('');
    setShowForm(false);
    setSubmittedNotice(true);
  };

  return (
    <section
      id="product-reviews"
      className="mt-14 pt-12 border-t border-[#E6DFD3]"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
        <div>
          <p className="text-xs font-mono tracking-[0.2em] text-[#7A6348] uppercase mb-2">
            Verified Customer Reviews
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="font-serif text-3xl font-semibold text-[#18181B]">
              {productName} Reviews
            </h2>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E2CFA8] shadow-xs">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.round(stats.average)
                        ? 'fill-[#D4A14A] text-[#D4A14A]'
                        : 'text-[#D6D3CE]'
                    }`}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-[#143326] tabular-nums">
                {stats.average.toFixed(1)}
              </span>
              <span className="text-xs text-[#57534E]">({stats.count} Reviews)</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowForm((prev) => !prev);
            setSubmittedNotice(false);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1F3A2E] text-white text-xs font-semibold hover:bg-[#162920] transition-colors cursor-pointer self-start sm:self-auto"
        >
          <MessageSquarePlus className="w-4 h-4" aria-hidden="true" />
          <span>{showForm ? 'Cancel' : 'Write a Review'}</span>
        </button>
      </div>

      {submittedNotice && (
        <div
          role="status"
          className="mb-6 p-4 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-xs font-medium text-[#065F46] flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Thank you! Your review has been published for {productName}.</span>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-2xl bg-white border border-[#E2CFA8] p-6 space-y-4 shadow-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="font-serif text-xl font-semibold text-[#18181B]">
              Share your experience
            </h3>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-[#57534E] mr-1">Your Rating:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  aria-label={`Rate ${star} out of 5 stars`}
                  className="p-0.5 cursor-pointer"
                >
                  <Star
                    className={`w-5 h-5 ${
                      star <= rating
                        ? 'fill-[#D4A14A] text-[#D4A14A]'
                        : 'text-[#D6D3CE]'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="rev-name" className="block text-xs font-medium text-[#18181B] mb-1">
                Your Name *
              </label>
              <input
                id="rev-name"
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g., Karthik S."
                className="w-full h-10 px-3 rounded-lg border border-[#E6E4DE] bg-[#FAFAF8] text-sm focus:outline-none focus:border-[#1F3A2E]"
              />
            </div>
            <div>
              <label htmlFor="rev-city" className="block text-xs font-medium text-[#18181B] mb-1">
                City
              </label>
              <input
                id="rev-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Chennai, Coimbatore"
                className="w-full h-10 px-3 rounded-lg border border-[#E6E4DE] bg-[#FAFAF8] text-sm focus:outline-none focus:border-[#1F3A2E]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="rev-title" className="block text-xs font-medium text-[#18181B] mb-1">
              Review Headline
            </label>
            <input
              id="rev-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Rock-solid Burma Teak joinery"
              className="w-full h-10 px-3 rounded-lg border border-[#E6E4DE] bg-[#FAFAF8] text-sm focus:outline-none focus:border-[#1F3A2E]"
            />
          </div>

          <div>
            <label htmlFor="rev-comment" className="block text-xs font-medium text-[#18181B] mb-1">
              Review Details *
            </label>
            <textarea
              id="rev-comment"
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell others about the timber quality, finish, and delivery..."
              className="w-full p-3 rounded-lg border border-[#E6E4DE] bg-[#FAFAF8] text-sm focus:outline-none focus:border-[#1F3A2E]"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#1F3A2E] text-white text-xs font-semibold hover:bg-[#162920] cursor-pointer"
            >
              Submit Review
            </button>
          </div>
        </form>
      )}

      <div className="grid md:grid-cols-3 gap-5">
        {reviews.map((rev) => (
          <article
            key={rev.id}
            className="rounded-2xl bg-white border border-[#E6DFD3] p-5 flex flex-col justify-between shadow-2xs"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < rev.rating ? 'fill-[#D4A14A] text-[#D4A14A]' : 'text-[#E6E4DE]'
                      }`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                {rev.verified && (
                  <span className="text-[10px] font-semibold text-[#1F3A2E] bg-[#1F3A2E]/8 px-2 py-0.5 rounded-full">
                    Verified Buyer
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-[#18181B] leading-snug">{rev.title}</h3>
              <p className="mt-2 text-xs text-[#57534E] leading-relaxed">{rev.comment}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#F3ECE1] flex items-center justify-between text-[11px] text-[#7A6348]">
              <span className="font-semibold text-[#18181B]">
                {rev.author} · {rev.city}
              </span>
              <span className="font-mono">{rev.createdAt}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
