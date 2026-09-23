import { BlogPost } from '../types/blog';
import { apiClient } from './apiClient';
import { adminService } from './adminService';

export interface BlogFilterOptions {
  category?: string;
  query?: string;
}

export const blogService = {
  /**
   * Fetch all blog posts from backend API
   */
  async getPosts(filters?: BlogFilterOptions): Promise<BlogPost[]> {
    try {
      const res = await apiClient.get<BlogPost[]>('/blog');
      if (!res.success || !Array.isArray(res.data)) {
        return [];
      }
      let result = [...res.data].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );

      if (!filters) return result;

      if (filters.category && filters.category !== 'সব') {
        result = result.filter((post) => post.category === filters.category);
      }

      if (filters.query && filters.query.trim() !== '') {
        const q = filters.query.trim().toLowerCase();
        result = result.filter(
          (post) =>
            post.title.toLowerCase().includes(q) ||
            post.excerpt.toLowerCase().includes(q) ||
            post.category.toLowerCase().includes(q)
        );
      }

      return result;
    } catch (err) {
      console.error('Failed to fetch blog posts:', err);
      return [];
    }
  },

  /**
   * Get a single article by slug
   */
  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    try {
      const res = await apiClient.get<BlogPost>(`/blog/${encodeURIComponent(slug)}`);
      if (res.success && res.data) {
        return res.data;
      }
      return null;
    } catch (err) {
      console.error(`Failed to fetch blog ${slug}:`, err);
      return null;
    }
  },

  /**
   * Get the featured article
   */
  async getFeaturedPost(): Promise<BlogPost | null> {
    try {
      const allPosts = await this.getPosts();
      const featured = allPosts.find((post) => post.featured);
      return featured || allPosts[0] || null;
    } catch {
      return null;
    }
  },

  /**
   * Get related articles by category
   */
  async getRelatedPosts(slug: string, limit = 3): Promise<BlogPost[]> {
    try {
      const allPosts = await this.getPosts();
      const current = allPosts.find((item) => item.slug === slug);
      if (!current) return [];

      const sameCategory = allPosts.filter(
        (post) => post.slug !== slug && post.category === current.category
      );
      const others = allPosts.filter(
        (post) => post.slug !== slug && post.category !== current.category
      );

      return [...sameCategory, ...others].slice(0, limit);
    } catch {
      return [];
    }
  },

  /**
   * Distinct list of categories present across all articles.
   */
  getCategories(): string[] {
    try {
      const allPosts = adminService.getBlogPosts();
      return Array.from(new Set(allPosts.map((post) => post.category)));
    } catch {
      return [];
    }
  }
};
