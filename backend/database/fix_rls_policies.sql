-- 1. Enable RLS on skills and allow viewing + adding
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view skills" ON public.skills;
DROP POLICY IF EXISTS "Authenticated users can create skills" ON public.skills;
DROP POLICY IF EXISTS "Allow all users to view skills" ON public.skills;
DROP POLICY IF EXISTS "Allow all users to insert skills" ON public.skills;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.skills;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.skills;

CREATE POLICY "Allow all users to view skills"
ON public.skills FOR SELECT TO public USING (true);

CREATE POLICY "Allow all users to insert skills"
ON public.skills FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all users to delete skills" ON public.skills;
CREATE POLICY "Allow all users to delete skills"
ON public.skills FOR DELETE TO public USING (true);


-- 2. Seed Default Technical Skills (Catalog)
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


-- 3. Siguraduhin na may parehong 'name' at 'title' ang career_roles
ALTER TABLE public.career_roles ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.career_roles ADD COLUMN IF NOT EXISTS name TEXT;
UPDATE public.career_roles SET title = name WHERE title IS NULL AND name IS NOT NULL;
UPDATE public.career_roles SET name = title WHERE name IS NULL AND title IS NOT NULL;

-- Siguraduhin na may 'importance' (integer) at 'importance_level' (text) ang role_skills
ALTER TABLE public.role_skills ADD COLUMN IF NOT EXISTS importance_level TEXT DEFAULT 'required';
ALTER TABLE public.role_skills ADD COLUMN IF NOT EXISTS importance INTEGER DEFAULT 1;


-- 4. Set RLS Policies para sa Career Roles & Role Skills
ALTER TABLE public.career_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view career roles" ON public.career_roles;
DROP POLICY IF EXISTS "Authenticated users can view role skills" ON public.role_skills;
DROP POLICY IF EXISTS "Allow all users to view career roles" ON public.career_roles;
DROP POLICY IF EXISTS "Allow all users to view role skills" ON public.role_skills;

CREATE POLICY "Allow all users to view career roles"
ON public.career_roles FOR SELECT TO public USING (true);

CREATE POLICY "Allow all users to view role skills"
ON public.role_skills FOR SELECT TO public USING (true);


-- 5. Seed Career Roles
INSERT INTO public.career_roles (name, title, description) VALUES
    ('Frontend Developer', 'Frontend Developer', 'Focuses on building client-side web applications and UI/UX.'),
    ('Backend Developer', 'Backend Developer', 'Focuses on server-side logic, APIs, database design, and architecture.'),
    ('Full-Stack Developer', 'Full-Stack Developer', 'Handles both client-side and server-side development end-to-end.'),
    ('AI / ML Engineer', 'AI / ML Engineer', 'Develops machine learning models, AI systems, and data pipelines.')
ON CONFLICT DO NOTHING;

-- Map default skills to career roles (note: importance is INTEGER = 1, importance_level is TEXT = 'required')
INSERT INTO public.role_skills (role_id, skill_id, importance_level, importance)
SELECT r.id, s.id, 'required', 1
FROM public.career_roles r, public.skills s
WHERE (COALESCE(r.title, r.name) = 'Frontend Developer' AND s.name IN ('TypeScript', 'JavaScript', 'Angular', 'React', 'Git'))
   OR (COALESCE(r.title, r.name) = 'Backend Developer' AND s.name IN ('Python', 'FastAPI', 'PostgreSQL', 'Supabase', 'Git'))
   OR (COALESCE(r.title, r.name) = 'Full-Stack Developer' AND s.name IN ('TypeScript', 'Angular', 'Python', 'FastAPI', 'PostgreSQL', 'Git'))
   OR (COALESCE(r.title, r.name) = 'AI / ML Engineer' AND s.name IN ('Python', 'FastAPI', 'Machine Learning', 'PostgreSQL', 'Git'))
ON CONFLICT DO NOTHING;


-- 6. Set RLS Policies para sa Project Skills
ALTER TABLE public.project_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view skills of their own projects" ON public.project_skills;
DROP POLICY IF EXISTS "Users can add skills to their own projects" ON public.project_skills;
DROP POLICY IF EXISTS "Users can remove skills from their own projects" ON public.project_skills;
DROP POLICY IF EXISTS "Allow all users to view project_skills" ON public.project_skills;
DROP POLICY IF EXISTS "Allow all users to insert project_skills" ON public.project_skills;
DROP POLICY IF EXISTS "Allow all users to delete project_skills" ON public.project_skills;

CREATE POLICY "Allow all users to view project_skills"
ON public.project_skills FOR SELECT TO public USING (true);

CREATE POLICY "Allow all users to insert project_skills"
ON public.project_skills FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow all users to delete project_skills"
ON public.project_skills FOR DELETE TO public USING (true);
