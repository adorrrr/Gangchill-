import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../../components/common/Container';
import { EmptyState } from '../../components/common/EmptyState';
import { BlogCard } from '../../components/blog/BlogCard';
import { FeaturedBlogCard } from '../../components/blog/FeaturedBlogCard';
import { Seo, SEO_SITE_URL } from '../../components/seo/Seo';
import { blogService } from '../../services/blogService';
import { BlogPost } from '../../types/blog';
import { Search } from 'lucide-react';

export const BlogPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('সব');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = useMemo(() => {
    const rawCategories = Array.from(new Set(posts.map((p) => p.category).filter(Boolean)));
    return ['সব', ...rawCategories];
  }, [posts]);

  useEffect(() => {
    const refreshData = () => {
      setLoading(true);
      Promise.all([
        blogService.getPosts({ category: activeCategory, query: searchQuery }),
        blogService.getFeaturedPost(),
      ]).then(([allPosts, featured]) => {
        setPosts(allPosts);
        setFeaturedPost(featured);
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    };

    refreshData();

    const onUpdate = () => refreshData();
    window.addEventListener('gangchill_blog_updated', onUpdate);
    window.addEventListener('focus', onUpdate);
    return () => {
      window.removeEventListener('gangchill_blog_updated', onUpdate);
      window.removeEventListener('focus', onUpdate);
    };
  }, [activeCategory, searchQuery]);

  const gridPosts = posts.filter((post) => post.slug !== featuredPost?.slug || activeCategory !== 'সব' || searchQuery.trim() !== '');

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Gangchill Blog',
      url: `${SEO_SITE_URL}/blog`,
      description: 'গাংচিলের মাছ সরবরাহ চেইন, বাণিজ্য ও পাইকারি ক্রয়-বিক্রয় সংক্রান্ত গল্প ও অন্তর্দৃষ্টি।',
      inLanguage: 'bn-BD',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'হোম', item: SEO_SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'ব্লগ', item: `${SEO_SITE_URL}/blog` },
      ],
    },
  ];

  return (
    <div className="bg-gangchill-canvas text-gangchill-ink min-h-screen">
      <Seo
        title="মৎস্য বাণিজ্য ব্লগ ও নলেজবেস | Gangchill (গাংচিল)"
        description="গাংচিলের মাছ সরবরাহ চেইন, কোল্ড-চেইন লজিস্টিক্স, পাইকারি ক্রয়-বিক্রয় ও বাংলাদেশের মৎস্য বাণিজ্য নিয়ে বিশ্বাসযোগ্য গল্প ও ব্যবহারিক অন্তর্দৃষ্টি পড়ুন।"
        path="/blog"
        keywords={['মৎস্য ব্লগ', 'মাছের ব্যবসা', 'কোল্ডচেইন লজিস্টিকস', 'ইলিশ মৌসুম', 'মাছ সংগ্রহ', 'Gangchill']}
        structuredData={structuredData}
      />

      {/* Blog Hero */}
      <section className="relative py-14 sm:py-20 border-b border-gangchill-ink/10 bg-gradient-to-b from-white/60 via-gangchill-canvas to-gangchill-canvas overflow-hidden">
        <div className="absolute -top-24 right-0 w-96 h-96 bg-gangchill-cyan/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gangchill-blue/10 rounded-full blur-3xl pointer-events-none" />
        <Container>
          <div className="relative max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-gangchill-blue bg-gangchill-blue/10 px-3 py-1 rounded-full border border-gangchill-blue/20">
              GANGCHILL BLOG · আমাদের গল্প
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold font-serifBangla text-gangchill-ink leading-tight tracking-tight">
              গল্প, অন্তর্দৃষ্টি ও অনুপ্রেরণা
            </h1>
            <p className="text-sm sm:text-lg text-gangchill-ink/75 leading-relaxed font-light">
              বাংলাদেশের নদী, ঘাট ও ঘের থেকে বাজার পর্যন্ত মাছের বাণিজ্য, কোল্ড-চেইন লজিস্টিক্স ও পাইকারি ক্রয়-বিক্রয়ের ব্যবহারিক গল্প—সরাসরি গাংচিল টিমের অভিজ্ঞতা থেকে।
            </p>
          </div>
        </Container>
      </section>

      {/* Featured Article */}
      {featuredPost && (
        <section className="py-10 sm:py-16 border-b border-gangchill-ink/10">
          <Container>
            <FeaturedBlogCard post={featuredPost} />
          </Container>
        </section>
      )}

      {/* Filters + Search + Grid */}
      <section className="py-12 sm:py-20">
        <Container>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 sm:mb-10">
            {/* Category Filters */}
            <nav aria-label="ব্লগ ক্যাটাগরি ফিল্টার" className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  aria-pressed={activeCategory === category}
                  className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold border transition-all ${
                    activeCategory === category
                      ? 'bg-gangchill-blue text-white border-gangchill-blue shadow-xs'
                      : 'bg-white/70 text-gangchill-ink-muted border-gangchill-ink/10 hover:border-gangchill-blue/30 hover:text-gangchill-blue'
                  }`}
                >
                  {category}
                </button>
              ))}
            </nav>

            {/* Search */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gangchill-ink-muted" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="আর্টিকেল খুঁজুন..."
                aria-label="ব্লগ আর্টিকেল অনুসন্ধান করুন"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-white/80 border border-gangchill-ink/10 focus:outline-none focus:ring-2 focus:ring-gangchill-blue/30 focus:border-gangchill-blue/40 placeholder:text-gangchill-ink-light"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16 font-mono text-sm text-gangchill-ink/50">
              আর্টিকেল লোড হচ্ছে...
            </div>
          ) : gridPosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {gridPosts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="কোনো আর্টিকেল খুঁজে পাওয়া যায়নি"
              description="ভিন্ন কোনো ক্যাটাগরি বেছে নিন অথবা অন্য শব্দ দিয়ে অনুসন্ধান করুন।"
            />
          )}
        </Container>
      </section>

      {/* Contact CTA */}
      <section className="pb-16 sm:pb-24">
        <Container>
          <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-gangchill-navy to-gangchill-navy-deep text-white p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-glass-navy">
            <div className="space-y-2 max-w-xl">
              <h2 className="text-xl sm:text-2xl font-bold font-serifBangla">
                পাইকারি মাছ সরবরাহ বা বিনিয়োগ নিয়ে জানতে চান?
              </h2>
              <p className="text-sm text-white/75 font-light leading-relaxed">
                আমাদের সেলস ও প্রকিউরমেন্ট টিমের সাথে সরাসরি যোগাযোগ করুন—আপনার প্রতিষ্ঠানের জন্য সঠিক সমাধান খুঁজে বের করতে সাহায্য করবো।
              </p>
            </div>
            <Link
              to="/contact"
              className="shrink-0 px-6 py-3 rounded-xl bg-white text-gangchill-navy font-bold text-sm hover:bg-gangchill-cyan-tint transition-colors"
            >
              যোগাযোগ করুন
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default BlogPage;
