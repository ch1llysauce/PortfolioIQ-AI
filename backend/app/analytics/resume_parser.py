import re
import io
from typing import List, Dict, Any
from pypdf import PdfReader

# Master skill dictionary for keyword matching
KNOWN_SKILLS = [
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "PHP", "Ruby", "Go", "Rust", "Swift", "Kotlin",
    "Angular", "React", "Vue", "Next.js", "Express", "FastAPI", "Django", "Flask", "Spring Boot", "Laravel",
    "PostgreSQL", "MySQL", "MongoDB", "Supabase", "Firebase", "Redis", "SQLite", "Oracle",
    "Machine Learning", "Deep Learning", "Data Science", "Artificial Intelligence", "NLP", "Computer Vision",
    "Git", "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Linux", "CI/CD", "HTML", "CSS", "Tailwind", "Bootstrap"
]

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
    Parses a PDF resume, extracting matched technical skills and candidate projects.
    """
    text = extract_text_from_pdf(pdf_bytes)
    
    # 1. Match Skills
    found_skills = set()
    text_lower = text.lower()
    
    for skill in KNOWN_SKILLS:
        # Use regex word boundaries for accurate keyword matching (avoid matching 'c' in 'cat')
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text_lower):
            found_skills.add(skill)

    # 2. Extract Candidate Projects / Key Sections
    extracted_projects = []
    
    # Simple heuristic to find project blocks
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

    # Match skills per project description
    for proj in extracted_projects:
        proj_text = (proj["name"] + " " + proj["description"]).lower()
        proj_skills = [s for s in found_skills if re.search(r'\b' + re.escape(s.lower()) + r'\b', proj_text)]
        proj["detected_skills"] = proj_skills

    return {
        "extracted_skills": sorted(list(found_skills)),
        "extracted_projects": extracted_projects,
        "raw_text_length": len(text)
    }

