-- ==============================================================================
-- PortfolioIQ-AI: Master Seed Script for All 14 Career Roles & Skills Catalog
-- ==============================================================================

-- 1. Insert All Core Industry Skills into Catalog
INSERT INTO public.skills (name, category) VALUES
    -- Programming Languages
    ('JavaScript', 'Programming Language'),
    ('TypeScript', 'Programming Language'),
    ('Python', 'Programming Language'),
    ('Java', 'Programming Language'),
    ('C++', 'Programming Language'),
    ('HTML/CSS', 'Programming Language'),
    ('SQL', 'Programming Language'),

    -- Frameworks & Runtimes
    ('Angular', 'Framework'),
    ('React', 'Framework'),
    ('FastAPI', 'Framework'),
    ('Node.js', 'Framework'),
    ('Express', 'Framework'),
    ('Flutter', 'Framework'),
    ('React Native', 'Framework'),
    ('Tailwind CSS', 'Framework'),

    -- Databases & Storage
    ('PostgreSQL', 'Database'),
    ('MongoDB', 'Database'),
    ('Supabase', 'Database'),
    ('Redis', 'Database'),
    ('Relational Database Design', 'Database'),

    -- AI, Machine Learning & Data Science
    ('Machine Learning', 'AI & Data Science'),
    ('Deep Learning', 'AI & Data Science'),
    ('PyTorch', 'AI & Data Science'),
    ('Pandas', 'AI & Data Science'),
    ('NumPy', 'AI & Data Science'),
    ('Scikit-Learn', 'AI & Data Science'),
    ('MLOps', 'AI & Data Science'),

    -- DevOps, Cloud & Tools
    ('Git', 'Tool & DevOps'),
    ('Linux', 'Tool & DevOps'),
    ('Docker', 'Tool & DevOps'),
    ('Kubernetes', 'Tool & DevOps'),
    ('CI/CD', 'Tool & DevOps'),
    ('GitHub Actions', 'Tool & DevOps'),
    ('Terraform', 'Tool & DevOps'),
    ('Cloud Computing', 'Tool & DevOps'),

    -- Architecture & Engineering Concepts
    ('Data Structures & Algorithms', 'Engineering Concept'),
    ('System Design', 'Engineering Concept'),
    ('Microservices', 'Engineering Concept'),
    ('REST API', 'Engineering Concept'),
    ('ETL Pipelines', 'Engineering Concept'),
    ('Apache Spark', 'Engineering Concept'),
    ('Apache Kafka', 'Engineering Concept')
ON CONFLICT (name) DO NOTHING;


-- 2. Insert All 14 Industry-Standard Career Roles
INSERT INTO public.career_roles (name, title, description) VALUES
    (
        'Frontend Developer', 
        'Frontend Developer', 
        'Focuses on building client-side web applications, highly responsive user interfaces, and engaging user experiences.'
    ),
    (
        'Backend Developer', 
        'Backend Developer', 
        'Specializes in server-side logic, database interactions, API security, caching mechanisms, and microservice architecture.'
    ),
    (
        'Full-Stack Developer', 
        'Full-Stack Developer', 
        'Builds complete, production-ready web applications spanning responsive frontend user interfaces, backend APIs, and relational databases.'
    ),
    (
        'AI / ML Engineer', 
        'AI / ML Engineer', 
        'Researches, trains, evaluates, and operationalizes machine learning, deep learning, and generative AI models into scalable production systems.'
    ),
    (
        'Software Engineer', 
        'Software Engineer', 
        'Designs, develops, tests, and maintains scalable software systems and applications using core software engineering and algorithmic principles.'
    ),
    (
        'Data Scientist', 
        'Data Scientist', 
        'Applies statistical modeling, exploratory data analysis, and predictive analytics to discover actionable patterns from complex business data.'
    ),
    (
        'Data Engineer', 
        'Data Engineer', 
        'Architects, constructs, and maintains robust data lakes, warehouses, and real-time streaming ETL pipelines for enterprise analytics.'
    ),
    (
        'DevOps Engineer', 
        'DevOps Engineer', 
        'Automates continuous integration and deployment (CI/CD), manages cloud infrastructure, and ensures system reliability and scalability.'
    ),
    (
        'Mobile Developer', 
        'Mobile Developer', 
        'Creates native or cross-platform mobile experiences for iOS and Android devices focusing on smooth UX and offline synchronization.'
    ),
    (
        'System Architect', 
        'System Architect', 
        'Translates business requirements into resilient, highly-scalable software architecture blueprints, microservices topologies, and cloud infrastructure.'
    ),
    (
        'UI/UX Designer', 
        'UI/UX Designer', 
        'Crafts intuitive digital journeys, design systems, wireframes, and responsive component libraries that maximize developer handoff and usability.'
    ),
    (
        'QA Engineer', 
        'QA Engineer', 
        'Designs automated end-to-end and regression test suites, establishes CI/CD test gates, and ensures software meets production quality standards.'
    ),
    (
        'Product Manager', 
        'Product Manager', 
        'Bridges user needs, business goals, and engineering velocity by managing backlogs, user analytics, and technical product feature roadmaps.'
    ),
    (
        'Security Engineer', 
        'Security Engineer', 
        'Ensures systems remain resilient against vulnerabilities through threat modeling, container security, zero-trust cloud architecture, and compliance.'
    )
ON CONFLICT (name) DO NOTHING;


-- 3. Map Skills to Each Career Role (Matching Knowledge Graph)
-- Note: importance is INTEGER = 1, importance_level is TEXT = 'required'

-- 1. Frontend Developer
INSERT INTO public.role_skills (role_id, skill_id, importance_level, importance)
SELECT r.id, s.id, 'required', 1
FROM public.career_roles r, public.skills s
WHERE COALESCE(r.title, r.name) = 'Frontend Developer'
  AND s.name IN ('HTML/CSS', 'JavaScript', 'TypeScript', 'Angular', 'React', 'Tailwind CSS', 'Git', 'REST API')
ON CONFLICT DO NOTHING;

-- 2. Backend Developer
INSERT INTO public.role_skills (role_id, skill_id, importance_level, importance)
SELECT r.id, s.id, 'required', 1
FROM public.career_roles r, public.skills s
WHERE COALESCE(r.title, r.name) = 'Backend Developer'
  AND s.name IN ('Python', 'FastAPI', 'Node.js', 'PostgreSQL', 'Redis', 'Docker', 'Git', 'REST API', 'SQL')
ON CONFLICT DO NOTHING;

-- 3. Full-Stack Developer
INSERT INTO public.role_skills (role_id, skill_id, importance_level, importance)
SELECT r.id, s.id, 'required', 1
FROM public.career_roles r, public.skills s
WHERE COALESCE(r.title, r.name) = 'Full-Stack Developer'
  AND s.name IN ('TypeScript', 'JavaScript', 'Angular', 'React', 'FastAPI', 'Node.js', 'PostgreSQL', 'Supabase', 'Docker', 'Git')
ON CONFLICT DO NOTHING;

-- 4. AI / ML Engineer
INSERT INTO public.role_skills (role_id, skill_id, importance_level, importance)
SELECT r.id, s.id, 'required', 1
FROM public.career_roles r, public.skills s
WHERE COALESCE(r.title, r.name) = 'AI / ML Engineer'
  AND s.name IN ('Python', 'Machine Learning', 'Deep Learning', 'PyTorch', 'FastAPI', 'Docker', 'Pandas', 'NumPy', 'Scikit-Learn', 'Git')
ON CONFLICT DO NOTHING;

-- 5. Software Engineer
INSERT INTO public.role_skills (role_id, skill_id, importance_level, importance)
SELECT r.id, s.id, 'required', 1
FROM public.career_roles r, public.skills s
WHERE COALESCE(r.title, r.name) = 'Software Engineer'
  AND s.name IN ('Data Structures & Algorithms', 'Python', 'SQL', 'Git', 'Docker', 'REST API', 'System Design')
ON CONFLICT DO NOTHING;

-- 6. Data Scientist
INSERT INTO public.role_skills (role_id, skill_id, importance_level, importance)
SELECT r.id, s.id, 'required', 1
FROM public.career_roles r, public.skills s
WHERE COALESCE(r.title, r.name) = 'Data Scientist'
  AND s.name IN ('Python', 'SQL', 'Pandas', 'NumPy', 'Scikit-Learn', 'Machine Learning', 'Git')
ON CONFLICT DO NOTHING;

-- 7. Data Engineer
INSERT INTO public.role_skills (role_id, skill_id, importance_level, importance)
SELECT r.id, s.id, 'required', 1
FROM public.career_roles r, public.skills s
WHERE COALESCE(r.title, r.name) = 'Data Engineer'
  AND s.name IN ('Python', 'SQL', 'PostgreSQL', 'Docker', 'Linux', 'Git', 'Apache Spark', 'Apache Kafka')
ON CONFLICT DO NOTHING;

-- 8. DevOps Engineer
INSERT INTO public.role_skills (role_id, skill_id, importance_level, importance)
SELECT r.id, s.id, 'required', 1
FROM public.career_roles r, public.skills s
WHERE COALESCE(r.title, r.name) = 'DevOps Engineer'
  AND s.name IN ('Linux', 'Docker', 'Kubernetes', 'CI/CD', 'GitHub Actions', 'Terraform', 'Cloud Computing', 'Git')
ON CONFLICT DO NOTHING;

-- 9. Mobile Developer
INSERT INTO public.role_skills (role_id, skill_id, importance_level, importance)
SELECT r.id, s.id, 'required', 1
FROM public.career_roles r, public.skills s
WHERE COALESCE(r.title, r.name) = 'Mobile Developer'
  AND s.name IN ('Flutter', 'React Native', 'JavaScript', 'TypeScript', 'REST API', 'Git')
ON CONFLICT DO NOTHING;

-- 10. System Architect
INSERT INTO public.role_skills (role_id, skill_id, importance_level, importance)
SELECT r.id, s.id, 'required', 1
FROM public.career_roles r, public.skills s
WHERE COALESCE(r.title, r.name) = 'System Architect'
  AND s.name IN ('System Design', 'Microservices', 'Cloud Computing', 'Docker', 'Python', 'SQL')
ON CONFLICT DO NOTHING;

-- 11. UI/UX Designer
INSERT INTO public.role_skills (role_id, skill_id, importance_level, importance)
SELECT r.id, s.id, 'required', 1
FROM public.career_roles r, public.skills s
WHERE COALESCE(r.title, r.name) = 'UI/UX Designer'
  AND s.name IN ('HTML/CSS', 'Tailwind CSS', 'JavaScript', 'Git')
ON CONFLICT DO NOTHING;

-- 12. QA Engineer
INSERT INTO public.role_skills (role_id, skill_id, importance_level, importance)
SELECT r.id, s.id, 'required', 1
FROM public.career_roles r, public.skills s
WHERE COALESCE(r.title, r.name) = 'QA Engineer'
  AND s.name IN ('Git', 'CI/CD', 'REST API', 'Python')
ON CONFLICT DO NOTHING;

-- 13. Product Manager
INSERT INTO public.role_skills (role_id, skill_id, importance_level, importance)
SELECT r.id, s.id, 'required', 1
FROM public.career_roles r, public.skills s
WHERE COALESCE(r.title, r.name) = 'Product Manager'
  AND s.name IN ('Git', 'SQL', 'REST API')
ON CONFLICT DO NOTHING;

-- 14. Security Engineer
INSERT INTO public.role_skills (role_id, skill_id, importance_level, importance)
SELECT r.id, s.id, 'required', 1
FROM public.career_roles r, public.skills s
WHERE COALESCE(r.title, r.name) = 'Security Engineer'
  AND s.name IN ('Linux', 'Cloud Computing', 'Docker', 'Git')
ON CONFLICT DO NOTHING;

