import json
import yaml
from typing import Dict, Any, Tuple, List
from .models import ConfigFormat

class ParseError(Exception):
    pass

def detect_format(config_str: str) -> ConfigFormat:
    stripped = config_str.strip()
    if not stripped:
        return ConfigFormat.YAML 
    
    if stripped.startswith('{') or stripped.startswith('['):
        return ConfigFormat.JSON
    return ConfigFormat.YAML

def parse_single_config(config_str: str, fmt: ConfigFormat = ConfigFormat.AUTO) -> Any:
    if fmt == ConfigFormat.AUTO:
        fmt = detect_format(config_str)
    
    try:
        if fmt == ConfigFormat.JSON:
            return json.loads(config_str)
        else:
            # YAML can have multiple docs
            docs = list(yaml.safe_load_all(config_str))
            if len(docs) == 1:
                return docs[0]
            return docs
    except json.JSONDecodeError as e:
        raise ParseError(f"Invalid JSON: {str(e)}")
    except yaml.YAMLError as e:
        raise ParseError(f"Invalid YAML: {str(e)}")
    except Exception as e:
        raise ParseError(f"Failed to parse config: {str(e)}")

def merge_configs(parsed_configs: List[Any]) -> Dict[str, Any]:
    # We want to produce a structure that looks like a single config or config_dump
    # Strategy:
    # - Collect all listeners, clusters, routes, endpoints into a synthetic config_dump structure
    # - or just return a list of resources that Extractor can handle?
    # Extractor expects a dict (config_dump or static).
    # Let's create a synthetic config_dump.
    
    synthetic_dump = {
        "configs": [],
        "static_resources": {
            "listeners": [],
            "clusters": []
        }
    }

    def add_item(item):
        if isinstance(item, dict):
            # Check what kind of item it is
            if "configs" in item: # It's a config dump
                synthetic_dump["configs"].extend(item["configs"])
            elif "static_resources" in item: # Static config
                sr = item["static_resources"]
                synthetic_dump["static_resources"]["listeners"].extend(sr.get("listeners", []))
                synthetic_dump["static_resources"]["clusters"].extend(sr.get("clusters", []))
            elif "resources" in item: # xDS response
                # Treat resources as a list of items to process recursively
                # They often have @type, so they will be caught by the @type check in the loop
                for res in item["resources"]:
                    add_item(res)
            elif "address" in item and "filter_chains" in item: # It's a Listener
                synthetic_dump["static_resources"]["listeners"].append(item)
            elif "type" in item and "connect_timeout" in item: # It's a Cluster (heuristic)
                synthetic_dump["static_resources"]["clusters"].append(item)
            elif "virtual_hosts" in item: # RouteConfig
                # RouteConfigs in static are usually inline, but if standalone, we might need to wrap them
                # For now, let's assume they are part of a larger structure or we add to configs if typed
                pass
            
            # Check for @type
            if "@type" in item:
                # It's a typed resource, add to configs
                synthetic_dump["configs"].append(item)

        elif isinstance(item, list):
            for sub in item:
                add_item(sub)

    for p in parsed_configs:
        add_item(p)

    return synthetic_dump

def parse_configs(config_strs: List[str], fmt: ConfigFormat = ConfigFormat.AUTO) -> Dict[str, Any]:
    parsed = []
    for s in config_strs:
        if not s.strip(): continue
        p = parse_single_config(s, fmt)
        parsed.append(p)
    
    return merge_configs(parsed)
