"""
Stage 12 — Knowledge Graph Engine.
Builds and maintains the in-memory directed knowledge graph (NetworkX)
connecting Career Roles, Skills, Technologies, and Project Archetypes.
"""
import json
from pathlib import Path
from typing import Dict, Any, List, Optional, Set
import networkx as nx

DATA_DIR = Path(__file__).parent / "data"

# Unified, fully-closed role profiles where every single prereq, unlock,
# and complement is guaranteed to exist as a registered node in the graph.
ROLE_PROFILES: Dict[str, Dict[str, Any]] = {
    "Frontend Developer": {
        "category": "Web & Client Engineering",
        "description": "Focuses on building client-side web applications, highly responsive user interfaces, and engaging user experiences.",
        "prereqs": ["HTML/CSS", "JavaScript", "TypeScript", "Git", "Angular", "React", "Tailwind CSS", "REST API"],
        "unlocks": ["Full-Stack Developer", "Mobile Developer", "UI/UX Designer"],
        "complements": ["Backend Developer", "UI/UX Designer", "Full-Stack Developer", "DevOps Engineer"]
    },
    "Backend Developer": {
        "category": "Server & Database Engineering",
        "description": "Specializes in server-side logic, database interactions, API security, caching mechanisms, and microservice architecture.",
        "prereqs": ["Python", "SQL", "Git", "FastAPI", "Node.js", "PostgreSQL", "Redis", "Docker", "REST API"],
        "unlocks": ["Full-Stack Developer", "System Architect", "Data Engineer", "DevOps Engineer"],
        "complements": ["Frontend Developer", "DevOps Engineer", "Data Engineer", "System Architect"]
    },
    "Full-Stack Developer": {
        "category": "End-to-End Application Engineering",
        "description": "Builds complete, production-ready web applications spanning responsive frontend user interfaces, backend APIs, and relational databases.",
        "prereqs": ["TypeScript", "JavaScript", "HTML/CSS", "SQL", "Git", "Angular", "React", "FastAPI", "Node.js", "PostgreSQL", "Supabase", "Docker", "REST API"],
        "unlocks": ["System Architect", "DevOps Engineer", "Mobile Developer"],
        "complements": ["DevOps Engineer", "Product Manager", "QA Engineer", "UI/UX Designer"]
    },
    "AI / ML Engineer": {
        "category": "Machine Learning & Applied AI",
        "description": "Researches, trains, evaluates, and operationalizes machine learning, deep learning, and generative AI models into scalable production systems.",
        "prereqs": ["Python", "SQL", "Git", "Data Structures & Algorithms", "Machine Learning", "Scikit-Learn", "Pandas", "NumPy", "FastAPI", "Docker"],
        "unlocks": ["Data Scientist", "Deep Learning", "PyTorch", "MLOps", "Retrieval-Augmented Generation (RAG)", "Vector Databases"],
        "complements": ["Data Scientist", "Data Engineer", "Backend Developer", "DevOps Engineer"]
    },
    "Software Engineer": {
        "category": "Core Systems & Software Architecture",
        "description": "Designs, develops, tests, and maintains scalable software systems and applications using core software engineering and algorithmic principles.",
        "prereqs": ["Data Structures & Algorithms", "Git", "SQL", "Python", "Docker", "REST API", "Relational Database Design"],
        "unlocks": ["System Architect", "Backend Developer", "Full-Stack Developer"],
        "complements": ["DevOps Engineer", "QA Engineer", "Product Manager", "System Architect"]
    },
    "Data Scientist": {
        "category": "Analytics & Predictive Modeling",
        "description": "Applies statistical modeling, exploratory data analysis, and predictive analytics to discover actionable patterns from complex business data.",
        "prereqs": ["Python", "SQL", "Git", "Pandas", "NumPy", "Scikit-Learn", "Machine Learning"],
        "unlocks": ["AI / ML Engineer", "Deep Learning", "PyTorch", "Data Engineer"],
        "complements": ["Data Engineer", "AI / ML Engineer", "Backend Developer", "Product Manager"]
    },
    "Data Engineer": {
        "category": "Big Data & Pipelines",
        "description": "Architects, constructs, and maintains robust data lakes, warehouses, and real-time streaming ETL pipelines for enterprise analytics.",
        "prereqs": ["Python", "SQL", "Linux", "Git", "PostgreSQL", "Docker", "Relational Database Design"],
        "unlocks": ["Data Scientist", "ETL Pipelines", "Apache Spark", "Apache Kafka", "System Architect"],
        "complements": ["Data Scientist", "Backend Developer", "DevOps Engineer", "AI / ML Engineer"]
    },
    "DevOps Engineer": {
        "category": "Cloud Infrastructure & CI/CD",
        "description": "Automates continuous integration and deployment (CI/CD), manages cloud infrastructure, and ensures system reliability and scalability.",
        "prereqs": ["Linux", "Git", "Docker", "CI/CD", "GitHub Actions"],
        "unlocks": ["Kubernetes", "Cloud Computing", "Terraform", "Security Engineer", "System Architect"],
        "complements": ["Backend Developer", "Software Engineer", "Security Engineer", "Full-Stack Developer"]
    },
    "Mobile Developer": {
        "category": "Mobile Client Engineering",
        "description": "Creates native or cross-platform mobile experiences for iOS and Android devices focusing on smooth UX and offline synchronization.",
        "prereqs": ["JavaScript", "TypeScript", "Git", "Flutter", "React Native", "REST API"],
        "unlocks": ["Frontend Developer", "Full-Stack Developer", "UI/UX Designer"],
        "complements": ["Backend Developer", "UI/UX Designer", "Full-Stack Developer", "Product Manager"]
    },
    "System Architect": {
        "category": "Enterprise System Design",
        "description": "Translates business requirements into resilient, highly-scalable software architecture blueprints, microservices topologies, and cloud infrastructure.",
        "prereqs": ["Software Engineer", "Backend Developer", "System Design", "Microservices", "Cloud Computing"],
        "unlocks": ["Full-Stack Developer", "DevOps Engineer", "Security Engineer"],
        "complements": ["Backend Developer", "DevOps Engineer", "Software Engineer", "Product Manager"]
    },
    "UI/UX Designer": {
        "category": "User Experience & Interface Design",
        "description": "Crafts intuitive digital journeys, design systems, wireframes, and responsive component libraries that maximize developer handoff and usability.",
        "prereqs": ["HTML/CSS", "Tailwind CSS", "JavaScript"],
        "unlocks": ["Frontend Developer", "Mobile Developer"],
        "complements": ["Frontend Developer", "Mobile Developer", "Product Manager"]
    },
    "QA Engineer": {
        "category": "Quality Engineering & Testing",
        "description": "Designs automated end-to-end and regression test suites, establishes CI/CD test gates, and ensures software meets production quality standards.",
        "prereqs": ["Git", "CI/CD", "REST API", "Python"],
        "unlocks": ["Software Engineer", "DevOps Engineer"],
        "complements": ["Software Engineer", "Full-Stack Developer", "DevOps Engineer"]
    },
    "Product Manager": {
        "category": "Technical Product Strategy",
        "description": "Bridges user needs, business goals, and engineering velocity by managing backlogs, user analytics, and technical product feature roadmaps.",
        "prereqs": ["Git", "SQL", "REST API"],
        "unlocks": ["System Architect", "Full-Stack Developer"],
        "complements": ["Software Engineer", "UI/UX Designer", "Data Scientist", "Frontend Developer"]
    },
    "Security Engineer": {
        "category": "Cloud & Infrastructure Security",
        "description": "Ensures systems remain resilient against vulnerabilities through threat modeling, container security, zero-trust cloud architecture, and compliance.",
        "prereqs": ["Linux", "Cloud Computing", "Docker", "Git"],
        "unlocks": ["DevOps Engineer", "System Architect"],
        "complements": ["DevOps Engineer", "Backend Developer", "System Architect"]
    }
}

class KnowledgeGraph:
    def __init__(self):
        self.graph: nx.DiGraph = nx.DiGraph()
        self.load_knowledge_base()

    def load_knowledge_base(self):
        """Loads nodes and relationships from data JSON files into the NetworkX DiGraph."""
        self.graph.clear()

        # 1. Load Career Roles from JSON
        roles_file = DATA_DIR / "career_roles.json"
        if roles_file.exists():
            with open(roles_file, "r", encoding="utf-8") as f:
                for role in json.load(f):
                    self.graph.add_node(
                        role["title"],
                        node_type="role",
                        category="Career Role",
                        description=role.get("description", ""),
                        core_domains=role.get("core_domains", []),
                        key_focus_areas=role.get("key_focus_areas", [])
                    )

        # 2. Load Skills from JSON
        skills_file = DATA_DIR / "skills.json"
        if skills_file.exists():
            with open(skills_file, "r", encoding="utf-8") as f:
                for skill in json.load(f):
                    self.graph.add_node(
                        skill["name"],
                        node_type="skill",
                        category=skill.get("category", "General Skill"),
                        level=skill.get("level", "Foundational"),
                        domain=skill.get("domain", "")
                    )

        # 3. Load Technologies from JSON
        techs_file = DATA_DIR / "technologies.json"
        if techs_file.exists():
            with open(techs_file, "r", encoding="utf-8") as f:
                for tech in json.load(f):
                    self.graph.add_node(
                        tech["name"],
                        node_type="technology",
                        category=tech.get("type", "Technology"),
                        level=tech.get("level", "Intermediate"),
                        ecosystem=tech.get("ecosystem", ""),
                        use_cases=tech.get("use_cases", [])
                    )
                    # Automatically connect pairs_well_with as complements
                    for pair in tech.get("pairs_well_with", []):
                        if not self.graph.has_node(pair):
                            self.graph.add_node(pair, node_type="technology", category="Technology")
                        self.graph.add_edge(tech["name"], pair, relation="complements")
                        self.graph.add_edge(pair, tech["name"], relation="complements")

        # 4. Register all roles in ROLE_PROFILES to guarantee they exist as first-class nodes
        for role_name, profile in ROLE_PROFILES.items():
            if not self.graph.has_node(role_name):
                self.graph.add_node(
                    role_name,
                    node_type="role",
                    category=profile.get("category", "Career Role"),
                    description=profile.get("description", ""),
                    level="Professional"
                )

        # 5. Load Relationships from relationships.json
        rels_file = DATA_DIR / "relationships.json"
        if rels_file.exists():
            with open(rels_file, "r", encoding="utf-8") as f:
                for rel in json.load(f):
                    src = rel["source"]
                    tgt = rel["target"]
                    relation = rel.get("relation", "connected_to")
                    # Ensure nodes exist in graph even if not in catalogs
                    if not self.graph.has_node(src):
                        self.graph.add_node(src, node_type="concept", category="Concept")
                    if not self.graph.has_node(tgt):
                        self.graph.add_node(tgt, node_type="concept", category="Concept")
                    
                    self.graph.add_edge(src, tgt, relation=relation)

    def get_prerequisites(self, node_name: str) -> List[Dict[str, Any]]:
        """
        Returns what to learn first before mastering node_name.
        For Career Roles, returns configured required competencies.
        For Skills/Technologies, traverses backward along prerequisite_of edges.
        """
        if not self.graph.has_node(node_name):
            return []

        # 1. Look up in ROLE_PROFILES
        if node_name in ROLE_PROFILES:
            prereq_names = ROLE_PROFILES[node_name]["prereqs"]
            res = []
            for name in prereq_names:
                attrs = self.graph.nodes.get(name, {})
                res.append({
                    "name": name,
                    "type": attrs.get("node_type", "skill"),
                    "category": attrs.get("category", "Required Competency"),
                    "level": attrs.get("level", "Foundational")
                })
            return res

        # 2. Standard skill/technology backward DFS traversal
        prereqs = []
        visited = set()

        def dfs(current):
            for predecessor in self.graph.predecessors(current):
                edge_data = self.graph.get_edge_data(predecessor, current)
                if edge_data and edge_data.get("relation") == "prerequisite_of":
                    if predecessor not in visited:
                        visited.add(predecessor)
                        dfs(predecessor)
                        attrs = self.graph.nodes.get(predecessor, {})
                        prereqs.append({
                            "name": predecessor,
                            "type": attrs.get("node_type", "skill"),
                            "category": attrs.get("category", ""),
                            "level": attrs.get("level", "Foundational")
                        })

        dfs(node_name)
        return prereqs

    def get_unlocked_skills(self, node_name: str) -> List[Dict[str, Any]]:
        """
        Returns technologies, concepts, and career paths unlocked once node_name is mastered.
        """
        if not self.graph.has_node(node_name):
            return []

        # 1. Look up in ROLE_PROFILES
        if node_name in ROLE_PROFILES:
            unlock_names = ROLE_PROFILES[node_name]["unlocks"]
            res = []
            for name in unlock_names:
                attrs = self.graph.nodes.get(name, {})
                res.append({
                    "name": name,
                    "type": attrs.get("node_type", "role" if name in ROLE_PROFILES else "skill"),
                    "category": attrs.get("category", "Career Progression" if name in ROLE_PROFILES else "Advanced Skill"),
                    "level": attrs.get("level", "Career Goal" if name in ROLE_PROFILES else "Advanced")
                })
            return res

        # 2. Standard skills/technologies unlocks
        unlocked = []
        seen = set()

        # A. Downstream tools via prerequisite_of
        for successor in self.graph.successors(node_name):
            edge_data = self.graph.get_edge_data(node_name, successor)
            if edge_data and edge_data.get("relation") == "prerequisite_of":
                if successor not in seen:
                    seen.add(successor)
                    attrs = self.graph.nodes.get(successor, {})
                    unlocked.append({
                        "name": successor,
                        "type": attrs.get("node_type", "skill"),
                        "category": attrs.get("category", ""),
                        "level": attrs.get("level", "Intermediate")
                    })

        # B. Career Roles that require this skill
        for role_name, profile in ROLE_PROFILES.items():
            if node_name in profile["prereqs"]:
                if role_name not in seen:
                    seen.add(role_name)
                    unlocked.append({
                        "name": role_name,
                        "type": "role",
                        "category": "Target Career Path",
                        "level": "Career Goal"
                    })

        return unlocked

    def get_complementary_tech(self, node_name: str) -> List[Dict[str, Any]]:
        """
        Returns complementary roles or technologies paired with node_name.
        """
        if not self.graph.has_node(node_name):
            return []

        # 1. Look up in ROLE_PROFILES
        if node_name in ROLE_PROFILES:
            comp_names = ROLE_PROFILES[node_name]["complements"]
            res = []
            for name in comp_names:
                attrs = self.graph.nodes.get(name, {})
                res.append({
                    "name": name,
                    "category": attrs.get("category", "Team Collaborator"),
                    "type": attrs.get("node_type", "role")
                })
            return res

        # 2. Standard complementary technology traversal
        complements = []
        seen = {node_name}

        for neighbor in self.graph.neighbors(node_name):
            edge = self.graph.get_edge_data(node_name, neighbor)
            if edge and edge.get("relation") == "complements" and neighbor not in seen:
                seen.add(neighbor)
                attrs = self.graph.nodes.get(neighbor, {})
                complements.append({
                    "name": neighbor,
                    "category": attrs.get("category", "Complementary Tech"),
                    "type": attrs.get("node_type", "technology")
                })

        for predecessor in self.graph.predecessors(node_name):
            edge = self.graph.get_edge_data(predecessor, node_name)
            if edge and edge.get("relation") == "complements" and predecessor not in seen:
                seen.add(predecessor)
                attrs = self.graph.nodes.get(predecessor, {})
                complements.append({
                    "name": predecessor,
                    "category": attrs.get("category", "Complementary Tech"),
                    "type": attrs.get("node_type", "technology")
                })

        return complements

    def get_role_tree(self, role_title: str) -> Dict[str, Any]:
        """
        Builds a comprehensive skill tree for a target career role,
        grouping requirements by level (Foundational, Intermediate, Advanced).
        """
        if not self.graph.has_node(role_title):
            return {"role": role_title, "foundational": [], "intermediate": [], "advanced": []}

        role_attrs = self.graph.nodes[role_title]
        required_nodes = []

        # If in ROLE_PROFILES, take prereqs
        if role_title in ROLE_PROFILES:
            for skill_name in ROLE_PROFILES[role_title]["prereqs"]:
                attrs = self.graph.nodes.get(skill_name, {})
                required_nodes.append({
                    "name": skill_name,
                    "type": attrs.get("node_type", "skill"),
                    "category": attrs.get("category", ""),
                    "level": attrs.get("level", "Intermediate"),
                    "prerequisites": [p["name"] for p in self.get_prerequisites(skill_name)]
                })
        else:
            for successor in self.graph.successors(role_title):
                edge = self.graph.get_edge_data(role_title, successor)
                if edge and edge.get("relation") == "requires":
                    attrs = self.graph.nodes[successor]
                    required_nodes.append({
                        "name": successor,
                        "type": attrs.get("node_type", "skill"),
                        "category": attrs.get("category", ""),
                        "level": attrs.get("level", "Intermediate"),
                        "prerequisites": [p["name"] for p in self.get_prerequisites(successor)]
                    })

        foundational = [n for n in required_nodes if n.get("level") == "Foundational"]
        intermediate = [n for n in required_nodes if n.get("level") == "Intermediate"]
        advanced = [n for n in required_nodes if n.get("level") == "Advanced"]

        unclassified = [n for n in required_nodes if n not in foundational and n not in intermediate and n not in advanced]
        intermediate.extend(unclassified)

        return {
            "role": role_title,
            "description": role_attrs.get("description", ""),
            "core_domains": role_attrs.get("core_domains", []),
            "total_requirements": len(required_nodes),
            "foundational": foundational,
            "intermediate": intermediate,
            "advanced": advanced
        }

    def export_graph_data(self) -> Dict[str, Any]:
        """
        Exports the entire graph in a format ready for visual rendering and dropdowns.
        """
        nodes = []
        edges = []

        for node_id, attrs in self.graph.nodes(data=True):
            in_degree = self.graph.in_degree(node_id)
            out_degree = self.graph.out_degree(node_id)
            node_type = attrs.get("node_type", "concept")

            # Color coding by entity type
            color_map = {
                "role": "#818cf8",               # Indigo
                "skill": "#34d399",              # Emerald Green
                "technology": "#38bdf8",         # Sky Blue
                "concept": "#fbbf24"             # Amber
            }

            nodes.append({
                "id": node_id,
                "label": node_id,
                "type": node_type,
                "category": attrs.get("category", ""),
                "color": color_map.get(node_type, "#94a3b8"),
                "size": max(12, min(36, 12 + (in_degree + out_degree) * 2)),
                "degree": in_degree + out_degree
            })

        # Sort nodes alphabetically for a clean, user-friendly dropdown
        nodes.sort(key=lambda n: n["label"].lower())

        for src, tgt, attrs in self.graph.edges(data=True):
            edges.append({
                "source": src,
                "target": tgt,
                "relation": attrs.get("relation", "connected_to")
            })

        return {
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "nodes": nodes,
            "edges": edges
        }

_GRAPH_INSTANCE: Optional[KnowledgeGraph] = None

def get_knowledge_graph() -> KnowledgeGraph:
    """Returns the singleton instance of the Knowledge Graph."""
    global _GRAPH_INSTANCE
    if _GRAPH_INSTANCE is None:
        _GRAPH_INSTANCE = KnowledgeGraph()
    return _GRAPH_INSTANCE
