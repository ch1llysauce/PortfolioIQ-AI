import re
import io
from typing import List, Dict, Any
from pypdf import PdfReader
from app.knowledge.entity_extractor import extract_entities_from_text, _load_knowledge_entities

# Comprehensive master skill dictionary for keyword matching
KNOWN_SKILLS = [
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "PHP", "Ruby", "Go", "Rust", "Swift", "Kotlin", "Dart",
    "Angular", "React", "React Native", "Vue", "Next.js", "Express", "Express.js", "FastAPI", "Django", "Flask", "Spring Boot", "Laravel", "NestJS",
    "PostgreSQL", "MySQL", "MongoDB", "Supabase", "Firebase", "Firestore", "Redis", "SQLite", "Oracle", "SQL",
    "Machine Learning", "Deep Learning", "Data Science", "Artificial Intelligence", "NLP", "Computer Vision",
    "Git", "GitHub", "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Linux", "CI/CD", "HTML", "CSS", "HTML5", "CSS3",
    "Tailwind", "Tailwind CSS", "Bootstrap", "Flutter", "Expo", "Vite", "Postman", "Vercel", "VS Code", "PWA",
    "Responsive Web Design", "RESTful APIs", "REST API", "Agile / Scrum", "Problem Solving", "Code Reviews", "Technical Documentation", "Adaptability",
    "Software Engineering"
]

def _contains_word(text: str, term: str) -> bool:
    """
    Non-alphanumeric boundary matching that safely handles special characters
    like C++, C#, .NET, CI/CD, React.js, etc. without regex word boundary \b failures.
    """
    escaped = re.escape(term.lower())
    pattern = rf"(?<![a-zA-Z0-9_]){escaped}(?![a-zA-Z0-9_])"
    return bool(re.search(pattern, text, re.IGNORECASE))

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extracts plain text content from PDF file bytes using pypdf."""
    reader = PdfReader(io.BytesIO(pdf_bytes))
    extracted_text = ""
    for page in reader.pages:
        text = page.extract_text()
        if text:
            extracted_text += text + "\n"
    return extracted_text

def parse_resume(pdf_bytes: bytes) -> Dict[str, Any]:
    """
    Parses a PDF resume, extracting matched technical skills and candidate projects
    using both NLP knowledge extraction and symbol-safe keyword scanning.
    All synonyms (e.g. RESTful APIs -> REST API) are canonicalized.
    """
    text = extract_text_from_pdf(pdf_bytes)
    
    knowledge = _load_knowledge_entities()
    aliases = knowledge.get("aliases", {})
    
    # 1. Match Skills via NLP Entity Extractor
    found_skills = set()
    try:
        nlp_res = extract_entities_from_text(text)
        for s in nlp_res.get("skills", []) + nlp_res.get("technologies", []):
            canonical = aliases.get(s.lower(), s)
            found_skills.add(canonical)
    except Exception:
        pass

    # 2. Match Skills via symbol-safe boundary matching
    for skill in KNOWN_SKILLS:
        if _contains_word(text, skill):
            canonical = aliases.get(skill.lower(), skill)
            found_skills.add(canonical)

    # 3. Extract Candidate Projects / Key Sections
    extracted_projects = []
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    in_project_section = False
    current_project = None

    project_keywords = ["projects", "personal projects", "academic projects", "key projects"]
    section_break_keywords = ["education", "experience", "work history", "certifications", "skills", "references"]

    for line in lines:
        line_lower = line.lower()
        
        # Check if entering projects section
        if any(keyword in line_lower for keyword in project_keywords) and len(line) < 35:
            in_project_section = True
            continue
            
        # Check if exiting projects section
        if in_project_section and any(keyword in line_lower for keyword in section_break_keywords) and len(line) < 35:
            in_project_section = False
            if current_project:
                extracted_projects.append(current_project)
                current_project = None
            continue

        if in_project_section:
            # Bullet point or header detection
            if line.startswith("•") or line.startswith("-") or line.startswith("*"):
                if current_project:
                    current_project["description"] += " " + line.lstrip("•-* ").strip()
            elif len(line) < 50 and not line.endswith("."):
                # Potential new project title
                if current_project:
                    extracted_projects.append(current_project)
                current_project = {
                    "name": line,
                    "description": "",
                    "detected_skills": []
                }
            else:
                if current_project:
                    current_project["description"] += " " + line

    if current_project:
        extracted_projects.append(current_project)

    # Match skills per project description with symbol-safe matching
    for proj in extracted_projects:
        proj_text = proj["name"] + " " + proj["description"]
        proj_skills = [s for s in found_skills if _contains_word(proj_text, s)]
        proj["detected_skills"] = sorted(proj_skills)

    return {
        "extracted_skills": sorted(list(found_skills)),
        "extracted_projects": extracted_projects,
        "raw_text_length": len(text)
    }

