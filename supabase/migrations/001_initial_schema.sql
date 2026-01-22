-- Initial database schema for Giuliana's 40th Birthday Guestbook
-- Tables: profiles, content, reactions

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
-- Extends Supabase auth.users with role and approval status

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'guest' CHECK (role IN ('admin', 'vip', 'guest')),
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CONTENT TABLE
-- ============================================================================
-- Stores text messages, photos, and videos from guests

CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('text', 'image', 'video')),
  text_content TEXT,
  media_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure content has either text or media
  CONSTRAINT content_has_value CHECK (
    (type = 'text' AND text_content IS NOT NULL) OR
    (type IN ('image', 'video') AND media_url IS NOT NULL)
  )
);

-- ============================================================================
-- REACTIONS TABLE
-- ============================================================================
-- Emoji reactions on content (from VIP and admin)

CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One user can only add same emoji once per content
  UNIQUE(content_id, user_id, emoji)
);

-- ============================================================================
-- INDEXES
-- ============================================================================
-- Performance optimization for common queries

CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_content_user ON content(user_id);
CREATE INDEX idx_content_created ON content(created_at DESC);
CREATE INDEX idx_reactions_content ON reactions(content_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_approved ON profiles(is_approved);

-- ============================================================================
-- TRIGGERS
-- ============================================================================
-- Auto-create profile when user signs up

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_approved)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'guest',
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE profiles IS 'User profiles with roles (admin, vip, guest) and approval status';
COMMENT ON TABLE content IS 'User-submitted content (text, images, videos) awaiting or approved by admin';
COMMENT ON TABLE reactions IS 'Emoji reactions on approved content';

COMMENT ON COLUMN profiles.role IS 'User role: admin (Pierluigi), vip (Giuliana), guest (friends)';
COMMENT ON COLUMN profiles.is_approved IS 'Admin must approve guests before they can upload content';
COMMENT ON COLUMN content.status IS 'Moderation status: pending (default), approved (visible to VIP), rejected (hidden)';
COMMENT ON COLUMN content.approved_at IS 'Timestamp when admin approved the content';
