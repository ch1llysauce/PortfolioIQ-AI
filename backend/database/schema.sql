-- PROFILES
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    display_name TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- PROJECTS
-- Stores user's developer projects

CREATE TABLE public.projects (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    name TEXT NOT NULL,

    description TEXT,

    status TEXT NOT NULL
        DEFAULT 'idea',

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ROW LEVEL SECURITY

ALTER TABLE public.profiles
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.projects
ENABLE ROW LEVEL SECURITY;

-- POLICIES 

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);


CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own projects"
ON public.projects
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);


CREATE POLICY "Users can create their own projects"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);


CREATE POLICY "Users can update their own projects"
ON public.projects
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


CREATE POLICY "Users can delete their own projects"
ON public.projects
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- ============================================
-- PROFILE CREATION TRIGGER
-- Automatically creates a profile
-- when a Supabase Auth user is registered.
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN

    INSERT INTO public.profiles (
        id,
        display_name
    )
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'display_name'
    );

    RETURN NEW;

END;
$$;


CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();


-- ============================================
-- SKILLS TABLE
-- ============================================
CREATE TABLE public.skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- PROJECT_SKILLS JUNCTION TABLE
-- ============================================
CREATE TABLE public.project_skills (
    project_id UUID NOT NULL
        REFERENCES public.projects(id)
        ON DELETE CASCADE,
    skill_id UUID NOT NULL
        REFERENCES public.skills(id)
        ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (project_id, skill_id)
);


-- ============================================
-- RLS POLICIES FOR SKILLS & PROJECT_SKILLS
-- ============================================
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_skills ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can view available skills
CREATE POLICY "Authenticated users can view skills"
ON public.skills
FOR SELECT
TO authenticated
USING (true);

-- Authenticated users can insert new skills if needed
CREATE POLICY "Authenticated users can create skills"
ON public.skills
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Project Skills RLS (user can only modify skills of their own projects)
CREATE POLICY "Users can view skills of their own projects"
ON public.project_skills
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = project_skills.project_id
          AND projects.user_id = auth.uid()
    )
);

CREATE POLICY "Users can add skills to their own projects"
ON public.project_skills
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = project_skills.project_id
          AND projects.user_id = auth.uid()
    )
);

CREATE POLICY "Users can remove skills from their own projects"
ON public.project_skills
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = project_skills.project_id
          AND projects.user_id = auth.uid()
    )
);


-- ============================================
-- SEED DEFAULT SKILLS
-- ============================================
INSERT INTO public.skills (name, category) VALUES
    ('JavaScript', 'Programming Language'),
    ('TypeScript', 'Programming Language'),
    ('Python', 'Programming Language'),
    ('Java', 'Programming Language'),
    ('C++', 'Programming Language'),
    ('Angular', 'Framework'),
    ('React', 'Framework'),
    ('FastAPI', 'Framework'),
    ('Express', 'Framework'),
    ('PostgreSQL', 'Database'),
    ('MongoDB', 'Database'),
    ('Supabase', 'Database'),
    ('Machine Learning', 'AI & Data Science'),
    ('Git', 'Tool & DevOps')
ON CONFLICT (name) DO NOTHING;


-- ============================================
-- CAREER ROLES TABLE
-- ============================================
CREATE TABLE public.career_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- ROLE_SKILLS JUNCTION TABLE
-- ============================================
CREATE TABLE public.role_skills (
    role_id UUID NOT NULL
        REFERENCES public.career_roles(id)
        ON DELETE CASCADE,
    skill_id UUID NOT NULL
        REFERENCES public.skills(id)
        ON DELETE CASCADE,
    importance_level TEXT DEFAULT 'required',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (role_id, skill_id)
);


-- ============================================
-- RLS POLICIES FOR CAREER ROLES & ROLE SKILLS
-- ============================================
ALTER TABLE public.career_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view career roles"
ON public.career_roles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view role skills"
ON public.role_skills
FOR SELECT
TO authenticated
USING (true);


-- ============================================
-- SEED DEFAULT CAREER ROLES & ROLE SKILLS
-- ============================================
INSERT INTO public.career_roles (title, description) VALUES
    ('Frontend Developer', 'Focuses on building client-side web applications and UI/UX.'),
    ('Backend Developer', 'Focuses on server-side logic, APIs, database design, and architecture.'),
    ('Full-Stack Developer', 'Handles both client-side and server-side development end-to-end.'),
    ('AI / ML Engineer', 'Develops machine learning models, AI systems, and data pipelines.')
ON CONFLICT (title) DO NOTHING;

-- Map default skills to career roles
INSERT INTO public.role_skills (role_id, skill_id, importance_level)
SELECT r.id, s.id, 'required'
FROM public.career_roles r, public.skills s
WHERE (r.title = 'Frontend Developer' AND s.name IN ('TypeScript', 'JavaScript', 'Angular', 'React', 'Git'))
   OR (r.title = 'Backend Developer' AND s.name IN ('Python', 'FastAPI', 'PostgreSQL', 'Supabase', 'Git'))
   OR (r.title = 'Full-Stack Developer' AND s.name IN ('TypeScript', 'Angular', 'Python', 'FastAPI', 'PostgreSQL', 'Git'))
   OR (r.title = 'AI / ML Engineer' AND s.name IN ('Python', 'FastAPI', 'Machine Learning', 'PostgreSQL', 'Git'))
ON CONFLICT (role_id, skill_id) DO NOTHING;
