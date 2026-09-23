import { AdminUser } from '../types/admin';
import { apiClient } from './apiClient';

const ADMIN_SESSION_KEY = 'gangchill_admin_session';

const DEFAULT_ADMIN: AdminUser = {
  id: 'adm-001',
  name: 'MD Admin',
  email: 'admin@gangchill.com',
  role: 'superadmin',
  designation: 'ম্যানেজিং ডিরেক্টর ও অ্যাডমিন',
  phone: '01712-345678',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  lastLogin: new Date().toISOString()
};

export const authService = {
  /**
   * Check if an admin is currently logged in
   */
  isAuthenticated(): boolean {
    return Boolean(apiClient.getToken() && this.getCurrentUser());
  },

  /**
   * Get currently logged-in admin user from cache
   */
  getCurrentUser(): AdminUser | null {
    try {
      const data = localStorage.getItem(ADMIN_SESSION_KEY);
      if (!data) return null;
      const parsed = JSON.parse(data) as AdminUser;
      return {
        ...DEFAULT_ADMIN,
        ...parsed,
        name: parsed.name || 'MD Admin',
        designation: parsed.designation || 'ম্যানেজিং ডিরেক্টর ও অ্যাডমিন'
      };
    } catch {
      return null;
    }
  },

  /**
   * Get default fallback admin
   */
  getDefaultAdmin(): AdminUser {
    return { ...DEFAULT_ADMIN };
  },

  /**
   * Update current admin profile via backend API and update local cache
   */
  async updateCurrentUser(updatedProfile: Partial<AdminUser> & { password?: string }): Promise<AdminUser> {
    const current = this.getCurrentUser() || DEFAULT_ADMIN;

    const merged: AdminUser = {
      ...current,
      ...updatedProfile
    };

    // Save locally
    try {
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(merged));
    } catch {
      // ignore
    }

    // Call real backend API
    try {
      const res = await apiClient.post('/auth/update-profile', {
        name: updatedProfile.name,
        designation: updatedProfile.designation,
        phone: updatedProfile.phone,
        avatar: updatedProfile.avatar,
        password: updatedProfile.password
      });
      if (res.success && res.data) {
        const serverUser: AdminUser = {
          ...merged,
          ...res.data
        };
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(serverUser));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('admin_profile_updated', { detail: serverUser }));
        }
        return serverUser;
      }
    } catch (err) {
      console.warn('Could not sync profile update to backend:', err);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('admin_profile_updated', { detail: merged }));
    }
    return merged;
  },

  /**
   * Admin Login using PHP + MySQL backend API
   */
  async login(email: string, password: string): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    try {
      const res = await apiClient.post<{ token: string; user: AdminUser }>('/auth/login', {
        email: email.trim(),
        password: password
      });

      if (res.success && res.data) {
        apiClient.setToken(res.data.token);
        const user = {
          ...DEFAULT_ADMIN,
          ...res.data.user
        };
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(user));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('admin_profile_updated', { detail: user }));
        }
        return { success: true, user };
      }

      return {
        success: false,
        error: res.error || 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।'
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'সার্ভার সংযোগে ত্রুটি ঘটেছে।'
      };
    }
  },

  /**
   * Fetch current user from /auth/me
   */
  async fetchMe(): Promise<AdminUser | null> {
    try {
      const res = await apiClient.get<AdminUser>('/auth/me');
      if (res.success && res.data) {
        const user = { ...DEFAULT_ADMIN, ...res.data };
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(user));
        return user;
      }
    } catch {
      // ignore
    }
    return this.getCurrentUser();
  },

  /**
   * Admin Logout
   */
  logout(): void {
    apiClient.post('/auth/logout').catch(() => {});
    apiClient.removeToken();
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }
};
