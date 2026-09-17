-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'SETTER', 'REVIEWER', 'COMPILER', 'KEYHOLDER', 'CENTRE')),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EXAM CENTRES
CREATE TABLE IF NOT EXISTS exam_centres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    manager_id UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SUBJECTS
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QUESTION BANKS (Multi-Person Network)
CREATE TABLE IF NOT EXISTS question_banks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    code TEXT NOT NULL UNIQUE,
    owner_id UUID REFERENCES profiles(id),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QUESTION BANK MEMBERS
CREATE TABLE IF NOT EXISTS question_bank_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_id UUID REFERENCES question_banks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('OWNER', 'CONTRIBUTOR', 'REVIEWER')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(bank_id, user_id)
);

-- EXAMS
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'COMPILING', 'COMPILED', 'ENCRYPTED', 'KEYS_SPLIT', 'RELEASED', 'COMPLETED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QUESTIONS
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    bank_id UUID REFERENCES question_banks(id) ON DELETE SET NULL,
    subject_id UUID REFERENCES subjects(id),
    setter_id UUID REFERENCES profiles(id),
    content TEXT NOT NULL,
    options JSONB,
    correct_answer TEXT NOT NULL,
    marks INTEGER NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'USED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES profiles(id),
    status TEXT NOT NULL CHECK (status IN ('APPROVED', 'REJECTED', 'CHANGES_REQUESTED')),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PAPERS
CREATE TABLE IF NOT EXISTS papers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id),
    compiler_id UUID REFERENCES profiles(id),
    paper_hash TEXT NOT NULL,
    signature TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'COMPILED' CHECK (status IN ('COMPILED', 'ENCRYPTED', 'KEYS_DISTRIBUTED', 'RELEASED')),
    encrypted_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- KEY SHARES
CREATE TABLE IF NOT EXISTS key_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    holder_id UUID REFERENCES profiles(id),
    share_index INTEGER NOT NULL,
    encrypted_share TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WATERMARKS
CREATE TABLE IF NOT EXISTS watermarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    centre_id UUID REFERENCES exam_centres(id) ON DELETE CASCADE,
    watermark_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    resource_id UUID,
    ip_address TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_questions_exam ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_questions_bank ON questions(bank_id);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_centres ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_bank_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE watermarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES (Drop if exists then create)

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
CREATE POLICY "Admin can view all profiles" ON profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'));

DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;
CREATE POLICY "Admin can update all profiles" ON profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'));

-- Question Banks Policies
DROP POLICY IF EXISTS "Members can view question banks" ON question_banks;
CREATE POLICY "Members can view question banks" ON question_banks FOR SELECT USING (
    is_public = TRUE OR owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM question_bank_members WHERE bank_id = question_banks.id AND user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Setters see own questions" ON questions;
CREATE POLICY "Setters see own questions" ON questions FOR SELECT USING (setter_id = auth.uid());

DROP POLICY IF EXISTS "Setters update own draft questions" ON questions;
CREATE POLICY "Setters update own draft questions" ON questions FOR UPDATE USING (setter_id = auth.uid() AND status = 'DRAFT');

DROP POLICY IF EXISTS "Reviewers see submitted questions" ON questions;
CREATE POLICY "Reviewers see submitted questions" ON questions FOR SELECT USING (status = 'SUBMITTED' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'REVIEWER'));

DROP POLICY IF EXISTS "Compiler sees approved questions" ON questions;
CREATE POLICY "Compiler sees approved questions" ON questions FOR SELECT USING (status = 'APPROVED' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'COMPILER'));

DROP POLICY IF EXISTS "Admin sees all questions" ON questions;
CREATE POLICY "Admin sees all questions" ON questions FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'));

DROP POLICY IF EXISTS "Reviewers see own reviews" ON reviews;
CREATE POLICY "Reviewers see own reviews" ON reviews FOR SELECT USING (reviewer_id = auth.uid());

DROP POLICY IF EXISTS "Setters see reviews of own questions" ON reviews;
CREATE POLICY "Setters see reviews of own questions" ON reviews FOR SELECT USING (EXISTS (SELECT 1 FROM questions WHERE questions.id = reviews.question_id AND questions.setter_id = auth.uid()));

DROP POLICY IF EXISTS "Compiler creates papers" ON papers;
CREATE POLICY "Compiler creates papers" ON papers FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'COMPILER'));

DROP POLICY IF EXISTS "Admin reads paper metadata" ON papers;
CREATE POLICY "Admin reads paper metadata" ON papers FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'));

DROP POLICY IF EXISTS "Holders see own share" ON key_shares;
CREATE POLICY "Holders see own share" ON key_shares FOR SELECT USING (holder_id = auth.uid());

DROP POLICY IF EXISTS "Centres see own watermarks" ON watermarks;
CREATE POLICY "Centres see own watermarks" ON watermarks FOR SELECT USING (EXISTS (SELECT 1 FROM exam_centres WHERE id = centre_id AND manager_id = auth.uid()));

DROP POLICY IF EXISTS "Admin full CRUD on watermarks" ON watermarks;
CREATE POLICY "Admin full CRUD on watermarks" ON watermarks FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'));

DROP POLICY IF EXISTS "Centres see own info" ON exam_centres;
CREATE POLICY "Centres see own info" ON exam_centres FOR SELECT USING (manager_id = auth.uid());

DROP POLICY IF EXISTS "Admin full CRUD on centres" ON exam_centres;
CREATE POLICY "Admin full CRUD on centres" ON exam_centres FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'));

DROP POLICY IF EXISTS "Append only audit logs" ON audit_logs;
CREATE POLICY "Append only audit logs" ON audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin reads audit logs" ON audit_logs;
CREATE POLICY "Admin reads audit logs" ON audit_logs FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'));

-- TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'SETTER')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
