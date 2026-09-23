import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  BookOpen,
  Image as ImageIcon,
  Sparkles,
  Plus,
  Trash2,
  Eye,
  Type,
  List,
  Quote,
  AlertCircle
} from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { BlogPost, BlogContentBlock } from '../../../types/blog';
import { ImageUploader } from '../../../components/admin/ImageUploader';

const PRESET_BLOG_IMAGES = [
  { label: 'ইলিশ ও পদ্মা মোহনা', url: '/hero-fishermen-boat.png' },
  { label: 'কক্সবাজার শুঁটকি ও উপকূল', url: '/nazirartek-shutki.jpg' },
  { label: 'চলনবিল পাবদা ও দেশি মাছ', url: '/chalanbeel-pabda.jpg' }
];

export const AdminBlogEditPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(slug);

  const [title, setTitle] = useState('');
  const [postSlug, setPostSlug] = useState('');
  const [category, setCategory] = useState('কোল্ড চেইন ও সংরক্ষণ');
  const [excerpt, setExcerpt] = useState('');
  const [featuredImage, setFeaturedImage] = useState('/hero-fishermen-boat.png');
  const [imageAlt, setImageAlt] = useState('');
  const [author, setAuthor] = useState('গাংচিল রিসার্চ টিম');
  const [readingTime, setReadingTime] = useState('৫ মিনিট পড়া');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [keywords, setKeywords] = useState('মাছের কোল্ড চেইন, পাইকারি মাছ, তাজা ইলিশ');
  const [featured, setFeatured] = useState(false);

  // Content blocks
  const [blocks, setBlocks] = useState<BlogContentBlock[]>([
    { type: 'paragraph', text: '' }
  ]);

  const [activePreview, setActivePreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (slug) {
      const posts = adminService.getBlogPosts();
      const existing = posts.find((p) => p.slug === slug);
      if (existing) {
        setTitle(existing.title);
        setPostSlug(existing.slug);
        setCategory(existing.category);
        setExcerpt(existing.excerpt);
        setFeaturedImage(existing.featuredImage);
        setImageAlt(existing.imageAlt);
        setAuthor(existing.author);
        setReadingTime(existing.readingTime);
        setSeoTitle(existing.seoTitle);
        setSeoDescription(existing.seoDescription);
        setKeywords(existing.keywords?.join(', ') || '');
        setFeatured(Boolean(existing.featured));
        setBlocks(existing.content || [{ type: 'paragraph', text: '' }]);
      } else {
        setError('আর্টিকেলটি খুঁজে পাওয়া যায়নি');
      }
    }
  }, [slug]);

  // Auto slug generation if creating
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9\u0980-\u09ff]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setPostSlug(generated || `post-${Date.now()}`);
      if (!seoTitle) setSeoTitle(val);
    }
  };

  // Block management
  const handleAddBlock = (type: 'paragraph' | 'heading' | 'quote' | 'list') => {
    if (type === 'list') {
      setBlocks([...blocks, { type: 'list', items: ['প্রথম পয়েন্ট', 'দ্বিতীয় পয়েন্ট'] }]);
    } else {
      setBlocks([...blocks, { type, text: '' }]);
    }
  };

  const handleUpdateBlockText = (index: number, text: string) => {
    const updated = [...blocks];
    const target = updated[index];
    if (target.type === 'paragraph' || target.type === 'heading' || target.type === 'quote') {
      target.text = text;
      setBlocks(updated);
    }
  };

  const handleUpdateListItem = (blockIndex: number, itemIndex: number, text: string) => {
    const updated = [...blocks];
    const target = updated[blockIndex];
    if (target.type === 'list') {
      target.items[itemIndex] = text;
      setBlocks(updated);
    }
  };

  const handleAddListItem = (blockIndex: number) => {
    const updated = [...blocks];
    const target = updated[blockIndex];
    if (target.type === 'list') {
      target.items.push('');
      setBlocks(updated);
    }
  };

  const handleRemoveListItem = (blockIndex: number, itemIndex: number) => {
    const updated = [...blocks];
    const target = updated[blockIndex];
    if (target.type === 'list') {
      target.items.splice(itemIndex, 1);
      setBlocks(updated);
    }
  };

  const handleRemoveBlock = (index: number) => {
    if (blocks.length <= 1) return;
    setBlocks(blocks.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !postSlug.trim()) {
      setError('শিরোনাম ও স্ল্যাগ আবশ্যক');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const postData: BlogPost = {
        slug: postSlug,
        title,
        excerpt: excerpt || title,
        category,
        featuredImage,
        imageAlt: imageAlt || title,
        author,
        publishedAt: isEditing ? (adminService.getBlogPosts().find(p => p.slug === slug)?.publishedAt || '2026-09-15') : new Date().toISOString().split('T')[0],
        readingTime: readingTime || '৫ মিনিট পড়া',
        seoTitle: seoTitle || title,
        seoDescription: seoDescription || excerpt || title,
        keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
        featured,
        content: blocks.filter((b) => {
          if (b.type === 'list') return b.items.length > 0;
          if (b.type === 'link') return Boolean(b.href);
          return Boolean(b.text.trim());
        })
      };

      if (isEditing && slug) {
        await adminService.updateBlogPost(slug, postData);
      } else {
        await adminService.createBlogPost(postData);
      }

      navigate('/admin/blog');
    } catch (err: any) {
      setError(err?.message || 'ব্লগ সংরক্ষণ ব্যর্থ হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/blog"
            className="p-1.5 sm:p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">ব্লগ তালিকায় ফিরে যান</span>
            {slug && (
              <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md hidden sm:inline">
                /blog/{slug}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActivePreview(!activePreview)}
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            {activePreview ? 'এডিটর দেখুন' : 'লাইভ প্রিভিউ'}
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : (isEditing ? 'আপডেট সংরক্ষণ' : 'আর্টিকেল প্রকাশ করুন')}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 sm:p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          {error}
        </div>
      )}

      {/* Live Preview Mode */}
      {activePreview ? (
        <div className="p-4 sm:p-6 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-4 sm:space-y-5">
          <div className="space-y-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {category}
            </span>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 font-serifBangla">{title || 'আর্টিকেলের শিরোনাম'}</h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 border-b border-slate-200 pb-3">
              <span>লেখক: {author}</span>
              <span>পড়ার সময়: {readingTime}</span>
              <span>তারিখ: {new Date().toLocaleDateString('bn-BD')}</span>
            </div>
          </div>

          {featuredImage && (
            <div className="h-52 sm:h-64 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
              <img src={featuredImage} alt={imageAlt || title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed font-serifBangla italic bg-slate-50 p-3 sm:p-4 rounded-xl border-l-4 border-blue-600">
            {excerpt || 'সংক্ষিপ্ত ভূমিকা...'}
          </div>

          <div className="space-y-3 pt-1 text-slate-800">
            {blocks.map((block, idx) => {
              if (block.type === 'heading') {
                return (
                  <h3 key={idx} className="text-base sm:text-lg font-bold text-slate-900 font-serifBangla pt-2">
                    {block.text}
                  </h3>
                );
              }
              if (block.type === 'quote') {
                return (
                  <blockquote key={idx} className="border-l-2 border-amber-400 bg-amber-50/50 p-2.5 rounded-r-lg italic text-slate-700 text-xs sm:text-sm">
                    "{block.text}"
                  </blockquote>
                );
              }
              if (block.type === 'list') {
                return (
                  <ul key={idx} className="list-disc list-inside space-y-1 text-slate-700 pl-2 text-xs sm:text-sm">
                    {block.items.map((item, iIdx) => (
                      <li key={iIdx}>{item}</li>
                    ))}
                  </ul>
                );
              }
              if (block.type === 'paragraph') {
                return (
                  <p key={idx} className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {block.text}
                  </p>
                );
              }
              if (block.type === 'link') {
                return (
                  <a key={idx} href={block.href} className="text-xs sm:text-sm text-blue-600 underline block">
                    {block.label}
                  </a>
                );
              }
              return null;
            })}
          </div>
        </div>
      ) : (
        /* Edit Mode Form */
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Main Info Card */}
          <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-3.5">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-blue-600" />
              মূল শিরোনাম ও বিবরণ
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">আর্টিকেলের শিরোনাম *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="যেমন: ইলিশ মাছ চেনার সহজ উপায় ও তাজা ইলিশের বৈশিষ্ট্য"
                  className="w-full px-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs sm:text-sm font-semibold focus:outline-hidden focus:bg-white focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">স্ল্যাগ (URL Slug) *</label>
                  <input
                    type="text"
                    required
                    value={postSlug}
                    onChange={(e) => setPostSlug(e.target.value)}
                    placeholder="ilish-mach-chenar-upay"
                    className="w-full px-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-hidden focus:bg-white focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">ক্যাটাগরি *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500 transition-colors cursor-pointer"
                  >
                    <option value="কোল্ড চেইন ও সংরক্ষণ">কোল্ড চেইন ও সংরক্ষণ</option>
                    <option value="মাছের জাত ও পরিচয়">মাছের জাত ও পরিচয়</option>
                    <option value="সি-ফুড ও পুষ্টি">সি-ফুড ও পুষ্টি</option>
                    <option value="বাজার ও সরবরাহ চেইন">বাজার ও সরবরাহ চেইন</option>
                    <option value="রেসিপি ও প্রসেসিং">রেসিপি ও প্রসেসিং</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">সংক্ষিপ্ত সারাংশ (Excerpt) *</label>
                <textarea
                  rows={2}
                  required
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="আর্টিকেলের ২ লাইনের ভূমিকা যা কার্ডে ও সোশ্যাল মিডিয়াতে দেখানো হবে..."
                  className="w-full px-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">লেখক</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:bg-white focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">পড়ার আনুমানিক সময়</label>
                  <input
                    type="text"
                    value={readingTime}
                    onChange={(e) => setReadingTime(e.target.value)}
                    placeholder="৫ মিনিট পড়া"
                    className="w-full px-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="flex items-center gap-2.5 sm:pt-5">
                  <input
                    type="checkbox"
                    id="featured-checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-4 h-4 rounded-sm bg-slate-50 border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="featured-checkbox" className="text-slate-700 font-semibold cursor-pointer text-xs">
                    হোমপেজে ফিচার্ড করুন
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Image & Presets */}
          <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 sm:space-y-4">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
              ফিচার্ড ব্যানার ছবি
            </h2>

            <div className="space-y-3 sm:space-y-4 text-xs">
              <ImageUploader
                multiple={false}
                value={featuredImage}
                onChange={setFeaturedImage}
                presets={PRESET_BLOG_IMAGES}
                helperText="JPG, PNG বা WEBP (সর্বোচ্চ ৫MB)"
              />

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-slate-700 font-medium mb-1 text-[11px] sm:text-xs">ছবির বিবরণ (Alt Text)</label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="যেমন: চাঁদপুরের পদ্মার তাজা রূপালী ইলিশ আহরণ"
                  className="w-full px-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl text-slate-900 text-xs placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Article Body Content Blocks */}
          <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 sm:space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                আর্টিকেলের বডি কনটেন্ট (Content Blocks)
              </h2>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAddBlock('paragraph')}
                  className="px-2 py-1 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] sm:text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3 text-blue-600" />
                  প্যারাগ্রাফ
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBlock('heading')}
                  className="px-2 py-1 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] sm:text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3 text-blue-600" />
                  সাব-হেডিং
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBlock('list')}
                  className="px-2 py-1 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] sm:text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3 text-emerald-600" />
                  তালিকা
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBlock('quote')}
                  className="px-2 py-1 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] sm:text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3 text-amber-500" />
                  উদ্ধৃতি
                </button>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4 text-xs">
              {blocks.map((block, idx) => (
                <div
                  key={idx}
                  className="p-3 sm:p-3.5 rounded-lg sm:rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 relative group"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-mono uppercase font-bold flex items-center gap-1">
                      {block.type === 'heading' && <Type className="w-3 h-3 text-blue-600" />}
                      {block.type === 'paragraph' && <BookOpen className="w-3 h-3 text-blue-600" />}
                      {block.type === 'list' && <List className="w-3 h-3 text-emerald-600" />}
                      {block.type === 'quote' && <Quote className="w-3 h-3 text-amber-500" />}
                      ব্লক {idx + 1}: {block.type}
                    </span>

                    {blocks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveBlock(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                        title="ব্লক মুছুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {block.type === 'heading' && (
                    <input
                      type="text"
                      value={block.text}
                      onChange={(e) => handleUpdateBlockText(idx, e.target.value)}
                      placeholder="উপশিরোনাম লিখুন (যেমন: কোল্ড চেইন সংরক্ষণের ধাপসমূহ)..."
                      className="w-full px-3 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs font-bold focus:outline-hidden focus:border-blue-500 transition-colors"
                    />
                  )}

                  {block.type === 'paragraph' && (
                    <textarea
                      rows={3}
                      value={block.text}
                      onChange={(e) => handleUpdateBlockText(idx, e.target.value)}
                      placeholder="বিস্তারিত প্যারাগ্রাফ লিখুন..."
                      className="w-full px-3 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs leading-relaxed focus:outline-hidden focus:border-blue-500 transition-colors"
                    />
                  )}

                  {block.type === 'quote' && (
                    <input
                      type="text"
                      value={block.text}
                      onChange={(e) => handleUpdateBlockText(idx, e.target.value)}
                      placeholder="গুরুত্বপূর্ণ কোট বা হাইলাইট..."
                      className="w-full px-3 py-1.5 sm:py-2 bg-amber-50/50 border border-amber-300 rounded-lg text-slate-800 text-xs italic focus:outline-hidden focus:border-amber-500 transition-colors"
                    />
                  )}

                  {block.type === 'list' && (
                    <div className="space-y-1.5">
                      {block.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex items-center gap-2">
                          <span className="text-slate-400 text-xs">•</span>
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => handleUpdateListItem(idx, itemIdx, e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-hidden focus:border-blue-500 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveListItem(idx, itemIdx)}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleAddListItem(idx)}
                        className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 pt-1 cursor-pointer font-medium"
                      >
                        <Plus className="w-3 h-3" />
                        আরেকটি পয়েন্ট যোগ করুন
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SEO Optimization Card */}
          <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 sm:space-y-4">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
              এসইও ও মেটাট্যাগ (SEO Settings)
            </h2>

            <div className="space-y-3 sm:space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1 text-[11px] sm:text-xs">এসইও মেটা টাইটেল</label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="গুগল সার্চে প্রদর্শিত টাইটেল (৬০ অক্ষরের মধ্যে)"
                  className="w-full px-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl text-slate-900 text-xs focus:outline-hidden focus:bg-white focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1 text-[11px] sm:text-xs">এসইও মেটা ডেসক্রিপশন</label>
                <textarea
                  rows={2}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="গুগল সার্চে প্রদর্শিত মেটা বিবরণ (১৬০ অক্ষরের মধ্যে)..."
                  className="w-full px-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl text-slate-900 text-xs placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1 text-[11px] sm:text-xs">কীওয়ার্ড / ট্যাগ (কমা দিয়ে লিখুন)</label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="মাছ, কোল্ড চেইন, পাইকারি, ইলিশ"
                  className="w-full px-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl text-slate-900 text-xs placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Bottom Save Bar */}
          <div className="flex items-center justify-end gap-2 sm:gap-2.5 pt-3 sm:pt-4 border-t border-slate-200">
            <Link
              to="/admin/blog"
              className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-colors"
            >
              বাতিল করুন
            </Link>
            <button
              type="submit"
              className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              {isEditing ? 'আপডেট সংরক্ষণ করুন' : 'আর্টিকেল প্রকাশ করুন'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
