import os
import json
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False


class GroqCoachEngine:
    CANDIDATE_MODELS = [
        "qwen/qwen3.8-27b",
        "groq/compound-mini",
        "qwen/qwen3.6-27b",
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant"
    ]

    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY", "").strip()
        self.client = None
        self.active_model = "qwen/qwen3.8-27b"
        self._refresh_client()

    def _detect_best_model(self) -> str:
        if not self.client:
            return "qwen/qwen3.8-27b"
        try:
            available = self.client.models.list()
            available_ids = {m.id for m in available.data}
            for candidate in self.CANDIDATE_MODELS:
                if candidate in available_ids:
                    return candidate
            if available.data:
                return available.data[0].id
        except Exception as e:
            print(f"[GroqCoachEngine] Model list query error: {e}")
        return "qwen/qwen3.8-27b"

    def _refresh_client(self):
        load_dotenv(override=True)
        key = os.getenv("GROQ_API_KEY", "").strip()
        if key and (key != self.api_key or self.client is None):
            self.api_key = key
            if GROQ_AVAILABLE:
                try:
                    self.client = Groq(api_key=self.api_key)
                    self.active_model = self._detect_best_model()
                except Exception as e:
                    print(f"[GroqCoachEngine] Initialization error: {e}")
                    self.client = None

    def is_live(self) -> bool:
        if self.client is None or not self.api_key:
            self._refresh_client()
        return self.client is not None and bool(self.api_key)

    def get_status(self) -> Dict[str, Any]:
        return {
            "live": self.is_live(),
            "model": self.active_model if self.is_live() else "Demonstration / Offline Mode",
            "provider": "Groq Cloud" if self.is_live() else "PortfolioIQ Built-in Engine",
            "message": f"Connected to Groq Cloud ({self.active_model})" if self.is_live() else "Groq API key not set. Set GROQ_API_KEY in backend/.env for live LLM inference."
        }

    def _build_system_prompt(self, context: Optional[Dict[str, Any]] = None) -> str:
        ctx = context or {}
        target_role = ctx.get("target_role", "Software Engineer")
        match_score = ctx.get("match_score", 0)
        missing_skills = ctx.get("missing_skills", [])
        acquired_skills = ctx.get("acquired_skills", [])
        health_score = ctx.get("health_score", 0)
        pillars = ctx.get("pillars", {})
        projects = ctx.get("projects", [])
        roadmaps = ctx.get("roadmaps", [])

        projects_summary = ""
        if projects:
            p_list = []
            for p in projects[:6]:
                name = p.get("name") or p.get("title", "Project")
                cat = p.get("category") or p.get("domain", "General")
                skills = ", ".join(p.get("skills", []))
                p_list.append(f"- {name} ({cat}) [Tech: {skills or 'N/A'}]")
            projects_summary = "\n".join(p_list)
        else:
            projects_summary = "No projects recorded yet."

        missing_skills_str = ", ".join(missing_skills[:12]) if missing_skills else "None identified."
        acquired_skills_str = ", ".join(acquired_skills[:15]) if acquired_skills else "None recorded."

        return f"""You are **PortfolioIQ AI Coach**, an elite Principal Software Architect, Engineering Hiring Manager, and Career Mentor.
Your mission is to provide rigorous, actionable, high-signal advice to help developers optimize their portfolios, master critical engineering skills, and land their dream roles.

### USER'S REAL-TIME PORTFOLIO TELEMETRY:
- **Target Career Goal:** {target_role}
- **Role Readiness / Match:** {match_score}%
- **Portfolio Health Score:** {health_score}/100
  * Completeness Pillar: {pillars.get('completeness', 0)}/100
  * Tech Stack Depth: {pillars.get('tech_stack', 0)}/100
  * Engineering Quality: {pillars.get('quality', 0)}/100
  * Domain Diversity: {pillars.get('diversity', 0)}/100
- **Missing Skills for Target Role:** {missing_skills_str}
- **Current Verified Skills:** {acquired_skills_str}
- **Existing Projects:**
{projects_summary}
- **Recommended Learning Prerequisite Pathways:** {", ".join(roadmaps) if roadmaps else "Graph roadmap available in Knowledge Graph"}

### COACHING PRINCIPLES:
1. **Be Specific & Opinionated:** Don't give generic advice. Reference the user's actual target role ({target_role}), missing skills ({missing_skills_str}), and project gaps.
2. **Actionable Blueprints:** When suggesting project ideas or skill improvements, provide realistic tech stacks, architectural components, and deliverables.
3. **Encouraging yet Candid:** Praise solid foundations, but clearly point out red flags that hiring managers look for (e.g. lack of testing, no CI/CD, shallow CRUD projects, single-language portfolio).
4. **Mobile-First Formatting & Roadmaps (CRITICAL):**
   - When presenting 30-Day Roadmaps, timelines, or action steps: **DO NOT use multi-column markdown tables.** Multi-column tables break and become completely unreadable on mobile screens.
   - Instead, ALWAYS format roadmaps as clean, structured **Phase / Milestone Cards** using headers and bullet points:
     ### Phase 1: [Milestone Name] (Days 1–3)
     - **Focus:** [Brief description]
     - **Action Items:** [Bullet points of engineering tasks]
     - **Deliverable:** [Concrete verifiable outcome, e.g. Passing CI test suite]
   - If a table is strictly necessary for short 2-column comparisons: ALWAYS use standard GitHub Markdown pipes (`| Header 1 | Header 2 |`) with concise text (< 6 words per cell). NEVER use space-aligned or ASCII tables.
5. **Language Flexibility:** Respond in English or Tagalog/Taglish based on the user's language.
6. **Direct Resume & ATS Audits:** When the user requests an audit of their uploaded resume or asks for bullet point improvements based on their extracted skills and projects, NEVER state that you cannot read the raw PDF or ask the user to re-paste their resume text. Directly perform the executive ATS audit using the provided extracted skills and projects, evaluate target role keyword alignment, and immediately formulate 3 high-impact STAR-format (Situation-Task-Action-Result) bullet points with quantifiable engineering metrics. IMPORTANT: Render resume bullet points directly as formatted markdown bullet points with bold highlights; NEVER wrap regular text or resume bullets inside ```markdown code blocks.
"""

    def chat(self, messages: List[Dict[str, str]], context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Multi-turn chat interaction with the AI Coach.
        """
        system_prompt = self._build_system_prompt(context)
        
        # If live Groq client is configured:
        if self.is_live():
            groq_messages = [{"role": "system", "content": system_prompt}]
            # Keep last 10 messages for context window management
            for m in messages[-10:]:
                groq_messages.append({
                    "role": m.get("role", "user"),
                    "content": m.get("content", "")
                })

            models_to_try = [self.active_model] + [m for m in self.CANDIDATE_MODELS if m != self.active_model]
            last_err = None

            for model_id in models_to_try:
                try:
                    chat_completion = self.client.chat.completions.create(
                        messages=groq_messages,
                        model=model_id,
                        temperature=0.7,
                        max_tokens=4096,
                    )
                    reply = chat_completion.choices[0].message.content
                    if reply and reply.strip():
                        self.active_model = model_id
                        suggested = self._generate_suggested_followups(reply, context)
                        return {
                            "message": reply,
                            "model": model_id,
                            "is_demo": False,
                            "suggested_followups": suggested
                        }
                except Exception as model_err:
                    print(f"[GroqCoachEngine] Model {model_id} failed: {model_err}")
                    last_err = model_err
                    continue

            # Fall back to demonstration engine if all Groq models encounter errors
            fallback = self._generate_smart_fallback(messages[-1].get("content", ""), context)
            fallback["message"] += f"\n\n*(Note: Groq live API encountered an issue: {str(last_err)[:100]}. Rendered via PortfolioIQ local fallback.)*"
            return fallback
        else:
            # Smart Offline / Demonstration Mode
            user_msg = messages[-1].get("content", "") if messages else "Hello"
            return self._generate_smart_fallback(user_msg, context)

    def generate_critique(self, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Produces a comprehensive executive portfolio critique.
        """
        ctx = context or {}
        target_role = ctx.get("target_role", "Software Engineer")
        health = ctx.get("health_score", 0)
        missing = ctx.get("missing_skills", [])
        
        prompt = (
            f"Please conduct an executive audit and critique of my developer portfolio for the role of {target_role}. "
            f"Provide: (1) Executive Summary, (2) Top 3 Core Strengths, (3) 3 Most Critical Deficiencies to Address, "
            f"and (4) A 30-Day Step-by-Step Strategic Roadmap formatted as Phase Milestone Cards with bullet points (DO NOT use wide tables)."
        )

        response = self.chat([{"role": "user", "content": prompt}], context)
        return {
            "target_role": target_role,
            "overall_health_score": health,
            "missing_skills_count": len(missing),
            "critique_markdown": response["message"],
            "model": response["model"],
            "is_demo": response["is_demo"]
        }

    def generate_project_ideas(self, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Generates 3 tailored project ideas designed to fill user skill gaps.
        """
        ctx = context or {}
        target_role = ctx.get("target_role", "Software Engineer")
        missing = ctx.get("missing_skills", [])
        missing_str = ", ".join(missing[:6]) if missing else "Modern Cloud & Production Architectures"

        prompt = (
            f"Propose 3 distinct, production-grade portfolio projects tailored for a developer targeting {target_role}. "
            f"Specifically design each project to showcase these missing skills: {missing_str}. "
            f"For each project, detail: Title, Problem Statement, Architecture/Tech Stack, Key Learning Outcomes, and Estimated Hours."
        )

        response = self.chat([{"role": "user", "content": prompt}], context)
        return {
            "target_role": target_role,
            "target_skills_covered": missing[:6],
            "ideas_markdown": response["message"],
            "model": response["model"],
            "is_demo": response["is_demo"]
        }

    def generate_dynamic_custom_blueprint(
        self,
        target_role: str,
        missing_skills: List[str],
        user_skills: List[str],
        effort_budget_hours: int = 40,
        existing_projects: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Dynamically synthesizes a 100% custom, production-grade project blueprint
        tailored to the user's specific target role, skill gaps, and effort budget.
        """
        missing_str = ", ".join(missing_skills[:6]) if missing_skills else "advanced industry practices"
        user_skills_str = ", ".join(user_skills[:8]) if user_skills else "core foundational skills"
        tier_label = "Sprint (~20 hrs)" if effort_budget_hours <= 25 else ("Standard (~40 hrs)" if effort_budget_hours <= 50 else "Comprehensive (~80 hrs)")

        system_instruction = (
            "You are an Elite Principal Software Architect & AI Engineering Coach at PortfolioIQ AI. "
            "You MUST output valid JSON strictly without markdown fences or additional commentary. "
            "Return a single JSON object with the following schema:\n"
            "{\n"
            '  "title": "string (Compelling, modern production-grade project title)",\n'
            '  "domain": "string (e.g. UI/UX Design, Frontend Development, AI / ML, Backend Development, DevOps)",\n'
            '  "difficulty": "string (Beginner / Intermediate / Advanced)",\n'
            '  "estimated_hours": number (realistic hours close to the specified budget),\n'
            '  "skills": ["string", "string"] (list of 4-7 specific skills taught/used, prioritizing the missing skills),\n'
            '  "description": "string (2-3 concise sentences on problem statement, business value, and what the project accomplishes)",\n'
            '  "architecture_highlights": "string (Technical stack, patterns, design principles, e.g. Design tokens, JWT auth, Vector embeddings)",\n'
            '  "key_deliverables": ["string", "string", "string"] (3 bullet points of concrete artifacts built),\n'
            '  "roi_rationale": "string (1-2 sentences explaining why this project maximizes hiring ROI for the role)"\n'
            "}"
        )

        user_prompt = (
            f"Generate a customized {tier_label} portfolio blueprint for a developer aiming for the role of '{target_role}'.\n"
            f"- Missing Skill Gaps to Close: {missing_str}\n"
            f"- Existing Skills: {user_skills_str}\n"
            f"- Effort Budget Limit: {effort_budget_hours} hours\n\n"
            f"Requirements:\n"
            f"1. Make the project realistic, production-grade, and tailored specifically for {target_role}.\n"
            f"2. Ensure the scope directly addresses the missing skill gaps within {effort_budget_hours} hours."
        )

        if self.client and self.api_key:
            try:
                chat_completion = self.client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": user_prompt}
                    ],
                    model=self.active_model,
                    temperature=0.4,
                    max_tokens=900,
                    response_format={"type": "json_object"}
                )
                raw_json = chat_completion.choices[0].message.content.strip()
                parsed = json.loads(raw_json)
                
                # Tag and validate
                parsed["id"] = f"dynamic-ai-{int(effort_budget_hours)}h"
                parsed["is_ai_generated"] = True
                parsed["model"] = self.active_model
                parsed["covered_gaps"] = [s for s in parsed.get("skills", []) if s.lower() in {m.lower() for m in missing_skills}]
                parsed["new_skills"] = [s for s in parsed.get("skills", []) if s.lower() not in {u.lower() for u in user_skills}]
                return parsed
            except Exception as e:
                print(f"[GroqCoachEngine] Dynamic blueprint generation error: {e}")

        # Intelligent Fallback when offline or error
        fallback_skills = list(missing_skills[:4]) if missing_skills else ["Clean Architecture", "API Integration", "CI/CD"]
        if "UI/UX" in target_role or "Designer" in target_role:
            domain = "UI/UX Design"
            title = f"Interactive {tier_label} Design System & Accessible Component Showcase"
            desc = "Production-grade design token hierarchy and responsive WCAG-compliant UI components designed to prove mastery of modern product design principles."
            arch = "Design tokens, atomic components, Figma-to-code sync, responsive utility styling."
            deliverables = ["Figma Component Library", "Interactive Storybook Documentation", "Live Responsive Prototype"]
            fallback_skills = list(set(["Figma", "UI/UX Design", "Design Systems", "Tailwind CSS"] + fallback_skills))
        elif "Frontend" in target_role:
            domain = "Frontend Development"
            title = f"High-Performance {tier_label} Reactive SPA with Real-Time State"
            desc = "Modular client-side application with optimistic UI updates, responsive layouts, and seamless API integration."
            arch = "Signal state management, standalone component hierarchy, responsive grid system."
            deliverables = ["Responsive Web Application", "State Management Store", "API Client Module"]
            fallback_skills = list(set(["TypeScript", "Angular", "Tailwind CSS", "REST API"] + fallback_skills))
        elif "Backend" in target_role:
            domain = "Backend Development"
            title = f"High-Concurrency {tier_label} Microservice API with Distributed Cache"
            desc = "Scalable backend REST service with asynchronous request processing, relational data modeling, and automated Swagger documentation."
            arch = "Async/await I/O, Redis caching, PostgreSQL connection pooling, JWT security."
            deliverables = ["Containerized REST API", "Relational Database Schema", "Automated Postman Collection"]
            fallback_skills = list(set(["Python", "FastAPI", "PostgreSQL", "Docker"] + fallback_skills))
        elif "AI" in target_role or "Machine Learning" in target_role or "Data" in target_role:
            domain = "AI & Data Science"
            title = f"Intelligent {tier_label} RAG Knowledge Retrieval & Analytics Pipeline"
            desc = "Vector search embedding pipeline with real-time semantic query citations and statistical data validation."
            arch = "Vector similarity search, semantic chunking, prompt engineering, FastAPI serving."
            deliverables = ["Vector Embeddings Pipeline", "AI Search Agent", "Performance Evaluation Report"]
            fallback_skills = list(set(["Python", "FastAPI", "Vector Databases", "Retrieval-Augmented Generation (RAG)"] + fallback_skills))
        else:
            domain = "Software Engineering"
            title = f"Full-Stack {tier_label} Production Service & Automated Quality Gate"
            desc = "End-to-end full-stack software service with automated test coverage, database migrations, and container deployment."
            arch = "Clean architecture, automated CI/CD pipeline, relational persistence."
            deliverables = ["Production Service Codebase", "CI/CD Deployment Manifest", "API Documentation"]
            fallback_skills = list(set(["Git", "REST API", "Docker", "SQL"] + fallback_skills))

        return {
            "id": f"dynamic-ai-{int(effort_budget_hours)}h",
            "title": title,
            "domain": domain,
            "difficulty": "Intermediate" if effort_budget_hours <= 45 else "Advanced",
            "estimated_hours": min(effort_budget_hours, 40) if effort_budget_hours <= 40 else effort_budget_hours,
            "skills": fallback_skills,
            "description": desc,
            "architecture_highlights": arch,
            "key_deliverables": deliverables,
            "roi_rationale": f"Engineered specifically to close your identified skill gaps in {missing_str} while fitting within {effort_budget_hours} hours.",
            "is_ai_generated": True,
            "model": "local-fallback",
            "covered_gaps": [s for s in fallback_skills if s.lower() in {m.lower() for m in missing_skills}],
            "new_skills": [s for s in fallback_skills if s.lower() not in {u.lower() for u in user_skills}]
        }

    def _generate_suggested_followups(self, reply: str, context: Optional[Dict[str, Any]] = None) -> List[str]:
        """
        Generates intelligent follow-up prompt chips.
        """
        ctx = context or {}
        target_role = ctx.get("target_role", "Developer")
        missing = ctx.get("missing_skills", [])
        
        followups = [
            f"How do I close the gap in {missing[0]}?" if missing else "What's the best next project to build?",
            f"What interview questions are asked for {target_role}?",
            "How can I boost my Portfolio Health Score above 85?",
            "Review my project architecture and suggest improvements."
        ]
        return followups[:3]

    def _generate_smart_fallback(self, user_query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Intelligent local fallback engine when GROQ_API_KEY is not configured or offline.
        """
        ctx = context or {}
        target_role = ctx.get("target_role", "Full-Stack Developer")
        match_score = ctx.get("match_score", 65)
        health_score = ctx.get("health_score", 70)
        missing = ctx.get("missing_skills", ["Docker", "Kubernetes", "CI/CD"])
        acquired = ctx.get("acquired_skills", ["Python", "JavaScript", "SQL"])
        projects = ctx.get("projects", [])
        q = user_query.lower()

        missing_list_str = ", ".join([f"`{s}`" for s in missing[:5]])
        acquired_list_str = ", ".join([f"`{s}`" for s in acquired[:5]])

        if "critique" in q or "audit" in q or "review" in q or "score" in q:
            reply = f"""### 📊 Executive Portfolio Critique for **{target_role}**

**Overall Health Score:** `{health_score}/100` | **Role Match:** `{match_score}%`

#### 🌟 Key Strengths
- **Solid Core Baseline:** You have demonstrated proficiency in {acquired_list_str}.
- **Active Project Portfolio:** You have {len(projects)} logged project(s) showcasing hands-on problem solving.

#### ⚠️ Critical Vulnerabilities & Skill Gaps
1. **Missing Role Prerequisites:** Your target role requires {missing_list_str}, which are currently unrepresented in your portfolio.
2. **Production-Readiness Gap:** Hiring managers look for automated testing, containerization, and monitoring rather than isolated local scripts.

#### 🚀 3-Step Remediation Plan
1. **Week 1-2:** Containerize your latest project with Docker and configure a GitHub Actions CI pipeline.
2. **Week 3-4:** Build a targeted portfolio project integrating {missing[0] if missing else 'Cloud Deployment'}.
3. **Week 5:** Refactor documentation to highlight metrics (e.g., *latency reduction*, *query optimization*).
"""
        elif "project" in q or "recommend" in q or "idea" in q:
            top_gap = missing[0] if missing else "Cloud Architecture"
            second_gap = missing[1] if len(missing) > 1 else "CI/CD"
            reply = f"""### 💡 3 High-Impact Project Blueprints for **{target_role}**

To bridge your primary skill gaps in {missing_list_str}, here are 3 production-grade project recommendations:

#### 1. Real-Time Distributed Telemetry Pipeline
- **Target Gaps:** {top_gap}, Distributed Systems
- **Tech Stack:** Python/Go, Redis, Docker, Prometheus
- **Deliverable:** A microservice capturing events with sub-50ms latency, visualized via Grafana dashboards.

#### 2. Automated Cloud CI/CD & Deployment Platform
- **Target Gaps:** {second_gap}, Infrastructure as Code
- **Tech Stack:** Terraform, Docker, GitHub Actions, AWS/GCP
- **Deliverable:** Zero-downtime rolling deployment pipeline with automated smoke testing and rollback.

#### 3. AI-Powered Knowledge Assistant Service
- **Target Gaps:** API Integration, Vector Search, Containerization
- **Tech Stack:** FastAPI, LangChain/LlamaIndex, PostgreSQL (pgvector), Docker
- **Deliverable:** Fully functional semantic search API with JWT authentication and comprehensive swagger docs.
"""
        elif "learn" in q or "prerequisite" in q or "roadmap" in q or "next" in q:
            top_gap = missing[0] if missing else "Advanced DevOps"
            reply = f"""### 🎯 Recommended Learning Path for **{target_role}**

Based on our **Knowledge Graph dependency solver**:

1. **Immediate Focus:** `{top_gap}`
   - *Why:* It is a direct hard prerequisite for 3+ downstream competencies in the {target_role} track.
   - *Estimated Effort:* 15–20 hours of focused project application.
2. **Secondary Competency:** `{missing[1] if len(missing) > 1 else 'System Design'}`
   - Focus on practical architecture over pure theory. Build a small prototype demonstrating this skill.
3. **Milestone Goal:** Once completed, your projected role readiness will increase by **+15% to 22%**!
"""
        else:
            reply = f"""Hello! I'm your **PortfolioIQ AI Developer Coach**.

I've analyzed your portfolio telemetry for **{target_role}**:
- **Health Score:** `{health_score}/100`
- **Role Readiness:** `{match_score}%`
- **Top Skill Gaps:** {missing_list_str}

**How can I assist your engineering career today?**
- Ask for a **deep-dive portfolio critique**
- Request **tailored project ideas** to close specific skill gaps
- Get **interview preparation questions** for {target_role}
- Ask how to refactor your existing projects for maximum recruiter impact!
"""

        note = "\n\n> 💡 *Note: Running in PortfolioIQ Built-in Demonstration Coach. To activate live Groq Llama-3 inference, add `GROQ_API_KEY=your_key` to `backend/.env`.*"
        
        return {
            "message": reply + note,
            "model": "PortfolioIQ Smart Engine (Demo Mode)",
            "is_demo": True,
            "suggested_followups": [
                f"How do I master {missing[0]}?" if missing else "Give me project ideas",
                "Critique my portfolio health score",
                f"What do {target_role} recruiters look for?"
            ]
        }


# Global singleton instance
coach_engine = GroqCoachEngine()

