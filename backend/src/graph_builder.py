from typing import Dict, Any, List
from .models import GraphResult, Node, Edge, NodeType, GraphStats

class GraphBuilder:
    def __init__(self, extracted_data: Dict[str, Any]):
        self.data = extracted_data
        self.nodes = []
        self.edges = []
        self.stats = GraphStats()
        self.warnings = extracted_data.get("warnings", [])

    def build(self) -> GraphResult:
        listeners = self.data.get("listeners", [])
        route_configs = self.data.get("route_configs", [])
        clusters = self.data.get("clusters", [])
        endpoints = self.data.get("endpoints", [])

        # Index route configs by name for easy lookup
        rc_map = {rc["name"]: rc for rc in route_configs}
        
        # Index clusters by name
        cluster_names = {c["name"] for c in clusters}

        # Helper to add node safely
        added_node_ids = set()
        def add_node(node: Node):
            if node.id not in added_node_ids:
                self.nodes.append(node)
                added_node_ids.add(node.id)

        # Helper to add edge safely
        added_edge_ids = set()
        def add_edge(edge: Edge):
            if edge.id not in added_edge_ids:
                self.edges.append(edge)
                added_edge_ids.add(edge.id)

        # 1. Listeners
        for l in listeners:
            l_id = f"listener:{l['name']}"
            add_node(Node(
                id=l_id,
                type=NodeType.LISTENER,
                label=l["name"],
                data={
                    "address": l["address"],
                    "filters": l.get("filters", [])
                }
            ))
            self.stats.listeners += 1

            # Filters
            for i, f_obj in enumerate(l.get("filters", [])):
                f_id = f"filter:{l['name']}:{i}"
                f_label = f_obj["name"].split(".")[-1] # Shorten label
                
                add_node(Node(
                    id=f_id,
                    type=NodeType.FILTER,
                    label=f_label,
                    data={"full_name": f_obj["name"]}
                ))
                
                # Edge Listener -> Filter
                add_edge(Edge(
                    id=f"{l_id}-{f_id}",
                    source=l_id,
                    target=f_id
                ))

                # Edge Filter -> RouteConfig
                if f_obj["route_config_name"]:
                    rc_name = f_obj["route_config_name"]
                    if rc_name in rc_map:
                        rc_id = f"route_config:{rc_name}"
                        add_edge(Edge(
                            id=f"{f_id}-{rc_id}",
                            source=f_id,
                            target=rc_id
                        ))
                    else:
                        self.warnings.append(f"Filter '{f_label}' references missing RouteConfig '{rc_name}'")
                
                if f_obj["inline_route_config"]:
                    rc_name = f_obj["inline_route_config"]["name"]
                    rc_id = f"route_config:{rc_name}"
                    add_edge(Edge(
                        id=f"{f_id}-{rc_id}",
                        source=f_id,
                        target=rc_id
                    ))

        # 2. RouteConfigs
        for rc in route_configs:
            rc_id = f"route_config:{rc['name']}"
            add_node(Node(
                id=rc_id,
                type=NodeType.ROUTE_CONFIG,
                label=rc["name"]
            ))
            self.stats.route_configs += 1

            # VirtualHosts
            for vh in rc.get("virtual_hosts", []):
                vh_id = f"virtual_host:{rc['name']}:{vh['name']}"
                add_node(Node(
                    id=vh_id,
                    type=NodeType.VIRTUAL_HOST,
                    label=vh["name"],
                    data={"domains": vh["domains"]}
                ))
                self.stats.virtual_hosts += 1
                
                # Edge RC -> VH
                add_edge(Edge(
                    id=f"{rc_id}-{vh_id}",
                    source=rc_id,
                    target=vh_id
                ))

                # Routes
                for i, r in enumerate(vh.get("routes", [])):
                    # Route ID needs to be unique
                    r_label = self._get_route_label(r)
                    r_id = f"route:{vh_id}:{i}"
                    add_node(Node(
                        id=r_id,
                        type=NodeType.ROUTE,
                        label=r_label,
                        data={"match": r["match"], "action": r["action"]}
                    ))
                    self.stats.routes += 1

                    # Edge VH -> Route
                    add_edge(Edge(
                        id=f"{vh_id}-{r_id}",
                        source=vh_id,
                        target=r_id
                    ))

                    # Edge Route -> Cluster
                    target_clusters = []
                    if r.get("cluster"):
                        target_clusters.append(r["cluster"])
                    for wc in r.get("weighted_clusters", []):
                        target_clusters.append(wc["name"])
                    
                    for c_name in target_clusters:
                        if c_name in cluster_names:
                            c_id = f"cluster:{c_name}"
                            add_edge(Edge(
                                id=f"{r_id}-{c_id}",
                                source=r_id,
                                target=c_id
                            ))
                        else:
                            self.warnings.append(f"Route in VH '{vh['name']}' references missing Cluster '{c_name}'")

        # 3. Clusters
        for c in clusters:
            c_id = f"cluster:{c['name']}"
            add_node(Node(
                id=c_id,
                type=NodeType.CLUSTER,
                label=c["name"],
                data={"type": c["type"]}
            ))
            self.stats.clusters += 1

        # 4. Endpoints
        for ep_group in endpoints:
            c_name = ep_group["cluster_name"]
            c_id = f"cluster:{c_name}"
            
            # Only add endpoints if cluster exists
            if c_name in cluster_names:
                for addr in ep_group["endpoints"]:
                    ep_id = f"endpoint:{c_name}:{addr}"
                    add_node(Node(
                        id=ep_id,
                        type=NodeType.ENDPOINT,
                        label=addr
                    ))
                    self.stats.endpoints += 1
                    
                    # Edge Cluster -> Endpoint
                    add_edge(Edge(
                        id=f"{c_id}-{ep_id}",
                        source=c_id,
                        target=ep_id
                    ))

        return GraphResult(
            nodes=self.nodes,
            edges=self.edges,
            stats=self.stats,
            warnings=self.warnings
        )

    def _get_route_label(self, route: Dict[str, Any]) -> str:
        match = route.get("match", {})
        if "prefix" in match:
            return f"Prefix: {match['prefix']}"
        elif "path" in match:
            return f"Path: {match['path']}"
        elif "safe_regex" in match:
            return f"Regex: {match['safe_regex'].get('regex', '...')}"
        return "Route"
