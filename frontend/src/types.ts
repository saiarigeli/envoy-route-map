export interface Node {
    id: string;
    type: 'listener' | 'route_config' | 'virtual_host' | 'route' | 'cluster' | 'endpoint';
    label: string;
    data: Record<string, any>;
}

export interface Edge {
    id: string;
    source: string;
    target: string;
    label?: string;
}

export interface GraphStats {
    listeners: number;
    route_configs: number;
    virtual_hosts: number;
    routes: number;
    clusters: number;
    endpoints: number;
}

export interface GraphResult {
    nodes: Node[];
    edges: Edge[];
    stats: GraphStats;
    warnings: string[];
}

export interface VisualizeRequest {
    configs: string[];
    format: 'auto' | 'json' | 'yaml';
}
