import React, { useMemo, useCallback } from 'react';
import {
    ReactFlow,
    type Node as FlowNode,
    type Edge as FlowEdge,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    ConnectionLineType,
    MarkerType,
    type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import type { Node, Edge } from '../types';

interface GraphPanelProps {
    nodes: Node[];
    edges: Edge[];
    onNodeClick: (node: Node) => void;
}

const nodeTypes: NodeTypes = {
    // We can define custom node types here if needed
};

function getNodeColor(type: string): string {
    switch (type) {
        case 'listener': return '#2563eb'; // blue-600
        case 'filter': return '#9333ea'; // purple-600
        case 'route_config': return '#7c3aed'; // violet-600
        case 'virtual_host': return '#db2777'; // pink-600
        case 'route': return '#ea580c'; // orange-600
        case 'cluster': return '#16a34a'; // green-600
        case 'endpoint': return '#0891b2'; // cyan-600
        default: return '#4b5563';
    }
}

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const nodeWidth = 180;
    const nodeHeight = 50;

    dagreGraph.setGraph({ rankdir: 'LR', ranksep: 100, nodesep: 30 });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    return nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        // Fallback if dagre fails to position a node (e.g. disconnected)
        const x = nodeWithPosition ? nodeWithPosition.x - nodeWidth / 2 : 0;
        const y = nodeWithPosition ? nodeWithPosition.y - nodeHeight / 2 : 0;

        return {
            id: node.id,
            type: 'default',
            position: { x, y },
            data: { label: node.label },
            style: {
                width: nodeWidth,
                background: getNodeColor(node.type),
                color: '#fff',
                border: '1px solid #555',
                fontSize: '12px',
                borderRadius: '4px',
                padding: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            },
        };
    });
};

export const GraphPanel: React.FC<GraphPanelProps> = ({ nodes, edges, onNodeClick }) => {
    const flowNodes: FlowNode[] = useMemo(() => {
        return getLayoutedElements(nodes, edges);
    }, [nodes, edges]);

    const flowEdges: FlowEdge[] = useMemo(() => {
        return edges.map(e => ({
            id: e.id,
            source: e.source,
            target: e.target,
            type: ConnectionLineType.Bezier,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: '#64748b', strokeWidth: 2 },
            animated: true,
        }));
    }, [edges]);

    const [rfNodes, setRfNodes, onNodesChange] = useNodesState<FlowNode>([]);
    const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);

    const [filterType, setFilterType] = React.useState<string>('all');
    const [searchTerm, setSearchTerm] = React.useState('');

    // Update state when props change
    React.useEffect(() => {
        setRfNodes(flowNodes);
        setRfEdges(flowEdges);
    }, [flowNodes, flowEdges, setRfNodes, setRfEdges]);

    // Filter nodes
    const visibleNodes = useMemo(() => {
        return rfNodes.filter((n: FlowNode) => {
            const originalNode = nodes.find(on => on.id === n.id);
            if (!originalNode) return false;

            const typeMatch = filterType === 'all' || originalNode.type === filterType;
            const searchMatch = !searchTerm ||
                originalNode.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                originalNode.id.toLowerCase().includes(searchTerm.toLowerCase());

            return typeMatch && searchMatch;
        });
    }, [rfNodes, nodes, filterType, searchTerm]);

    const visibleEdges = useMemo(() => {
        const visibleNodeIds = new Set(visibleNodes.map((n: FlowNode) => n.id));
        return rfEdges.filter((e: FlowEdge) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));
    }, [rfEdges, visibleNodes]);

    const handleNodeClick = useCallback((_: React.MouseEvent, node: FlowNode) => {
        const originalNode = nodes.find(n => n.id === node.id);
        if (originalNode) onNodeClick(originalNode);
    }, [nodes, onNodeClick]);

    return (
        <div className="h-full w-full bg-gray-950 relative">
            <div className="absolute top-4 right-4 z-10 flex gap-2 bg-gray-800/90 backdrop-blur p-2 rounded-lg border border-gray-700 shadow-xl items-center">
                <span className="text-xs text-gray-400 font-medium uppercase px-1">Filter:</span>
                <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    className="bg-gray-900 border border-gray-600 text-white text-xs rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                    <option value="all">All Types</option>
                    <option value="listener">Listener</option>
                    <option value="route_config">Route Config</option>
                    <option value="virtual_host">Virtual Host</option>
                    <option value="route">Route</option>
                    <option value="cluster">Cluster</option>
                    <option value="endpoint">Endpoint</option>
                </select>
                <div className="w-px h-4 bg-gray-700 mx-1" />
                <input
                    type="text"
                    placeholder="Search nodes..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="bg-gray-900 border border-gray-600 text-white text-xs rounded px-2 py-1.5 w-48 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>

            <div className="absolute inset-0">
                <ReactFlow
                    nodes={visibleNodes}
                    edges={visibleEdges}
                    onNodeClick={handleNodeClick}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    fitView
                    minZoom={0.1}
                    maxZoom={4}
                    attributionPosition="bottom-right"
                >
                    <Background color="#333" gap={16} />
                    <Controls className="bg-gray-800 border-gray-700 fill-white text-white" />
                </ReactFlow>
            </div>
        </div>
    );
};
