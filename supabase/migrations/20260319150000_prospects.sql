-- Prospects: businesses found without websites
CREATE TYPE prospect_status AS ENUM ('new', 'emailed', 'replied', 'converted', 'rejected');

CREATE TABLE prospects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  business_type TEXT,
  city TEXT,
  country TEXT DEFAULT 'France',
  address TEXT,
  google_place_id TEXT,
  has_website BOOLEAN DEFAULT false,
  website_url TEXT,
  notes TEXT,
  source TEXT DEFAULT 'google_maps',
  status prospect_status DEFAULT 'new',
  email_count INTEGER DEFAULT 0,
  last_emailed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE prospect_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage prospects" ON prospects FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage prospect_emails" ON prospect_emails FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_prospects_updated_at
  BEFORE UPDATE ON prospects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
