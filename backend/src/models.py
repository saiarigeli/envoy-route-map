from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field
from enum import Enum

class ConfigFormat(str, Enum):
    AUTO = "auto"
    JSON = "json"
    YAML = "yaml"

class VisualizeRequest(BaseModel):
    configs: List[str]
    format: ConfigFormat = ConfigFormat.AUTO

class NodeType(str, Enum):
    LISTENER = "listener"
    FILTER = "filter"
    ROUTE_CONFIG = "route_config"
    VIRTUAL_HOST = "virtual_host"
    ROUTE = "route"
    CLUSTER = "cluster"
    ENDPOINT = "endpoint"

class Node(BaseModel):
    id: str
    type: NodeType
    label: str
    data: Dict[str, Any] = Field(default_factory=dict)

class Edge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None

class GraphStats(BaseModel):
    listeners: int = 0
    route_configs: int = 0
    virtual_hosts: int = 0
    routes: int = 0
    clusters: int = 0
    endpoints: int = 0

class GraphResult(BaseModel):
    nodes: List[Node]
    edges: List[Edge]
    stats: GraphStats
    warnings: List[str] = Field(default_factory=list)
