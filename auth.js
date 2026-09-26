// ============================================
// 🏭 مصنع الصندل — Auth Module
// ============================================

// ⚠️ استبدل هذه القيم بمفاتيح مشروعك
const SUPABASE_URL = 'https://byenbplirfrqpmoeymba.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5ZW5icGxpcmZycXBtb2V5bWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MzY2NDksImV4cCI6MjEwNjAxMjY0OX0.jVUwwDhEwwT4LEWViJBKdRi1IMFTqkWnupEGl3UOI24';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ✅ اجعل المتغيرات متاحة عالمياً
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

// ------- Auth API -------
const Auth = {
  currentUser: null,
  currentProfile: null,

  async init() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
      if (!location.pathname.endsWith('login.html')) {
        location.href = 'login.html';
      }
      return null;
    }
    this.currentUser = session.user;

    // قراءة البروفايل
    const { data: profile, error } = await sb
      .from('profiles')
      .select('id, full_name, role, department_id, is_active, avatar_url')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error) {
      console.warn('Profile fetch error:', error);
    }

    // إذا لم يوجد بروفايل
    this.currentProfile = profile || {
      id: session.user.id,
      full_name: session.user.email,
      role: 'dept_manager',
      is_active: true
    };

    // جلب الصلاحيات
    if (this.currentProfile.role !== 'admin') {
      try {
        const { data: perms } = await sb
          .from('permissions')
          .select('permission_key')
          .eq('profile_id', session.user.id);
        this.currentProfile.permissions = (perms || []).map(p => p.permission_key);
      } catch (e) {
        this.currentProfile.permissions = [];
      }
    } else {
      this.currentProfile.permissions = ['*'];
    }

    return this.currentProfile;
  },

  isAdmin() {
    return this.currentProfile?.role === 'admin';
  },

  hasPerm(key) {
    if (this.isAdmin()) return true;
    return this.currentProfile?.permissions?.includes(key) || false;
  },

  async logout() {
    await sb.auth.signOut();
    location.href = 'login.html';
  },

  onAuthChange(cb) {
    sb.auth.onAuthStateChange((_event, session) => {
      if (!session && !location.pathname.endsWith('login.html')) {
        location.href = 'login.html';
      } else cb?.(session);
    });
  }
};

// إذا كان مسجلاً دخول، انقله للتطبيق
if (location.pathname.endsWith('login.html')) {
  sb.auth.getSession().then(({ data }) => {
    if (data.session) location.href = 'index.html';
  });
}
