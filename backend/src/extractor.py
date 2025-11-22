from typing import Dict, Any, List, Optional
from collections import defaultdict

class Extractor:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.listeners = []
        self.route_configs = []
        self.clusters = []
        self.endpoints = []
        self.warnings = []

    def extract(self):
        # Detect if config_dump or static config
        # Process both sources if present
        self._extract_from_config_dump()
        self._extract_from_static_config()
        
        return {
            "listeners": self.listeners,
            "route_configs": self.route_configs,
            "clusters": self.clusters,
            "endpoints": self.endpoints,
            "warnings": self.warnings
        }

    def _extract_from_config_dump(self):
        # Handle config_dump structure
        # Usually it's a list of configs in "configs" or root level
        configs = self.config.get("configs", [])
        if not configs and isinstance(self.config, list):
            configs = self.config # Maybe the list itself is the dump
        
        for cfg in configs:
            type_url = cfg.get("@type", "")
            # Handle wrapped dynamic_active_clusters etc.
            if "dynamic_listeners" in cfg:
                for l in cfg.get("dynamic_listeners", []):
                    state = l.get("active_state", {}).get("listener", {})
                    if state:
                        self._process_listener(state)
            elif "dynamic_route_configs" in cfg:
                for r in cfg.get("dynamic_route_configs", []):
                    state = r.get("route_config", {})
                    if state:
                        self._process_route_config(state)
            elif "dynamic_active_clusters" in cfg:
                for c in cfg.get("dynamic_active_clusters", []):
                    state = c.get("cluster", {})
                    if state:
                        self._process_cluster(state)
            
            # Also check for static resources inside config dump if present
            if "static_listeners" in cfg:
                for l in cfg.get("static_listeners", []):
                    state = l.get("listener", {})
                    if state:
                        self._process_listener(state)
            if "static_clusters" in cfg:
                for c in cfg.get("static_clusters", []):
                    state = c.get("cluster", {})
                    if state:
                        self._process_cluster(state)

    def _extract_from_static_config(self):
        static = self.config.get("static_resources", {})
        for l in static.get("listeners", []):
            self._process_listener(l)
        for c in static.get("clusters", []):
            self._process_cluster(c)
        # Static config usually doesn't have separate route configs unless defined in RDS (unlikely for pure static)
        # But inline route configs are handled in listener processing

    def _process_listener(self, listener: Dict[str, Any]):
        # Extract basic info
        name = listener.get("name", "unknown_listener")
        address = listener.get("address", {})
        # Simplification: just get socket address
        addr_str = "unknown"
        if "socket_address" in address:
            sa = address["socket_address"]
            addr_str = f"{sa.get('address', '')}:{sa.get('port_value', '')}"
        
        l_obj = {
            "name": name,
            "address": addr_str,
            "route_config_names": [],
            "inline_route_configs": []
        }

        # Look for HCM and other filters
        filters = []
        for fc in listener.get("filter_chains", []):
            for f in fc.get("filters", []):
                f_name = f.get("name", "unknown")
                filter_obj = {
                    "name": f_name,
                    "route_config_name": None,
                    "inline_route_config": None
                }
                
                if "http_connection_manager" in f.get("typed_config", {}).get("@type", ""):
                    hcm = f["typed_config"]
                    if "rds" in hcm:
                        rc_name = hcm["rds"].get("route_config_name")
                        if rc_name:
                            filter_obj["route_config_name"] = rc_name
                            # Keep track globally for processing, but link here
                            l_obj["route_config_names"].append(rc_name)
                            
                    elif "route_config" in hcm:
                        # Inline route config
                        rc = hcm["route_config"]
                        # Give it a synthetic name if missing
                        if "name" not in rc:
                            rc["name"] = f"{name}_route_config"
                        
                        filter_obj["inline_route_config"] = rc
                        l_obj["inline_route_configs"].append(rc)
                        # Also process this route config immediately
                        self._process_route_config(rc)
                
                filters.append(filter_obj)
        
        l_obj["filters"] = filters
        self.listeners.append(l_obj)

    def _process_route_config(self, rc: Dict[str, Any]):
        name = rc.get("name", "unknown_route_config")
        vhosts = []
        for vh in rc.get("virtual_hosts", []):
            vh_obj = {
                "name": vh.get("name", "unknown_vh"),
                "domains": vh.get("domains", []),
                "routes": []
            }
            for r in vh.get("routes", []):
                match = r.get("match", {})
                action = "unknown"
                cluster = None
                weighted_clusters = []
                
                if "route" in r:
                    action = "route"
                    rt = r["route"]
                    if "cluster" in rt:
                        cluster = rt["cluster"]
                    elif "weighted_clusters" in rt:
                        for wc in rt["weighted_clusters"].get("clusters", []):
                            weighted_clusters.append({
                                "name": wc.get("name"),
                                "weight": wc.get("weight")
                            })
                elif "redirect" in r:
                    action = "redirect"
                elif "direct_response" in r:
                    action = "direct_response"

                vh_obj["routes"].append({
                    "match": match,
                    "action": action,
                    "cluster": cluster,
                    "weighted_clusters": weighted_clusters
                })
            vhosts.append(vh_obj)
        
        self.route_configs.append({
            "name": name,
            "virtual_hosts": vhosts
        })

    def _process_cluster(self, cluster: Dict[str, Any]):
        name = cluster.get("name", "unknown_cluster")
        ctype = cluster.get("type", "unknown")
        self.clusters.append({
            "name": name,
            "type": ctype
        })
        # Note: Endpoints (CLA) are often in a separate part of config_dump (endpoint_config)
        # For static config, they might be in load_assignment
        if "load_assignment" in cluster:
            self._process_cla(cluster["load_assignment"])

    def _process_cla(self, cla: Dict[str, Any]):
        cluster_name = cla.get("cluster_name", "")
        endpoints = []
        for ep in cla.get("endpoints", []):
            for lb_ep in ep.get("lb_endpoints", []):
                endpoint = lb_ep.get("endpoint", {})
                addr = endpoint.get("address", {}).get("socket_address", {})
                if addr:
                    endpoints.append(f"{addr.get('address')}:{addr.get('port_value')}")
        
        if endpoints:
            self.endpoints.append({
                "cluster_name": cluster_name,
                "endpoints": endpoints
            })
