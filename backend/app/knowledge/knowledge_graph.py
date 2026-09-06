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

class KnowledgeGraph:
    def __init__(self):
        self.graph: nx.DiGraph = nx.DiGraph()
        self.load_knowledge_base()

    def load_knowledge_base(self):
        """Loads nodes and relationships from data JSON files into the NetworkX DiGraph."""
        self.graph.clear()

        # 1. Load Career Roles
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

        # 2. Load Skills
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

        # 3. Load Technologies
        techs_file = DATA_DIR / "technologies.json"
        if techs_file.exists():
            with open(techs_file, "r", encoding="utf-8") as f:
                for tech in json.load(f):
                    self.graph.add_node(
                        tech["name"],
                        node_type="technology",
                        category=tech.get("type", "Technology"),
                        ecosystem=tech.get("ecosystem", ""),
                        use_cases=tech.get("use_cases", [])
                    )

        # 4. Load Relationships (Edges)
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
        Traverses backward along 'prerequisite_of' edges to find foundational
        and intermediate skills that should be learned prior to node_name.
        """
        if not self.graph.has_node(node_name):
            return []

        prereqs = []
        visited = set()

        def dfs(current):
            for predecessor in self.graph.predecessors(current):
                edge_data = self.graph.get_edge_data(predecessor, current)
                if edge_data and edge_data.get("relation") == "prerequisite_of":
                    if predecessor not in visited:
                        visited.add(predecessor)
                        dfs(predecessor)
                        node_attrs = self.graph.nodes[predecessor]
                        prereqs.append({
                            "name": predecessor,
                            "type": node_attrs.get("node_type", "skill"),
                            "category": node_attrs.get("category", ""),
                            "level": node_attrs.get("level", "Foundational")
                        })

        dfs(node_name)
        return prereqs

    def get_unlocked_skills(self, node_name: str) -> List[Dict[str, Any]]:
        """
        Finds technologies and concepts unlocked once node_name is mastered
        (outbound edges where relation == 'prerequisite_of').
        """
        if not self.graph.has_node(node_name):
            return []

        unlocked = []
        for successor in self.graph.successors(node_name):
            edge_data = self.graph.get_edge_data(node_name, successor)
            if edge_data and edge_data.get("relation") == "prerequisite_of":
                node_attrs = self.graph.nodes[successor]
                unlocked.append({
                    "name": successor,
                    "type": node_attrs.get("node_type", "skill"),
                    "category": node_attrs.get("category", ""),
                    "level": node_attrs.get("level", "Intermediate")
                })
        return unlocked

    def get_complementary_tech(self, node_name: str) -> List[Dict[str, Any]]:
        """
        Finds technologies commonly paired with node_name (relation == 'complements').
        """
        if not self.graph.has_node(node_name):
            return []

        complements = []
        # Both directions of complement edges
        for neighbor in self.graph.neighbors(node_name):
            edge = self.graph.get_edge_data(node_name, neighbor)
            if edge and edge.get("relation") == "complements":
                attrs = self.graph.nodes[neighbor]
                complements.append({
                    "name": neighbor,
                    "category": attrs.get("category", ""),
                    "type": attrs.get("node_type", "")
                })

        for predecessor in self.graph.predecessors(node_name):
            edge = self.graph.get_edge_data(predecessor, node_name)
            if edge and edge.get("relation") == "complements":
                if not any(c["name"] == predecessor for c in complements):
                    attrs = self.graph.nodes[predecessor]
                    complements.append({
                        "name": predecessor,
                        "category": attrs.get("category", ""),
                        "type": attrs.get("node_type", "")
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

        # If some items don't have level explicitly, distribute by category
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
        Exports the entire graph in a format ready for visual rendering (e.g. Cytoscape / D3).
        Includes color groups and sizing by degree.
        """
        nodes = []
        edges = []

        for node_id, attrs in self.graph.nodes(data=True):
            in_degree = self.graph.in_degree(node_id)
            out_degree = self.graph.out_degree(node_id)
            node_type = attrs.get("node_type", "concept")

            # Color coding by entity type
            color_map = {
                "role": "#818cf8",        # Indigo
                "skill": "#34d399",       # Emerald Green
                "technology": "#38bdf8",  # Sky Blue
                "concept": "#fbbf24"      # Amber
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
