import { useState } from 'react';
import { ConfigPanel } from './components/ConfigPanel';
import { GraphPanel } from './components/GraphPanel';
import { api } from './api/client';
import type { VisualizeRequest, GraphResult, Node } from './types';

import { Component, type ErrorInfo, type ReactNode } from 'react';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-red-500 p-4">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <pre className="bg-gray-950 p-4 rounded overflow-auto max-h-96 text-sm">
              {this.state.error?.toString()}
              {this.state.error?.stack}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [graphData, setGraphData] = useState<GraphResult | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const handleVisualize = async (request: VisualizeRequest) => {
    setIsLoading(true);
    setError(undefined);
    setGraphData(null);
    setSelectedNode(null);

    try {
      const result = await api.visualize(request);
      setGraphData(result);
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || err.message || 'Unknown error';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="h-screen w-screen flex overflow-hidden bg-gray-950 text-white font-sans">
        <div className="w-1/3 min-w-[400px] max-w-[600px] h-full">
          <ConfigPanel
            onVisualize={handleVisualize}
            isLoading={isLoading}
            stats={graphData?.stats}
            warnings={graphData?.warnings || []}
            error={error}
          />
        </div>

        <div className="flex-1 h-full relative">
          {graphData ? (
            <GraphPanel
              nodes={graphData.nodes}
              edges={graphData.edges}
              onNodeClick={setSelectedNode}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 flex-col gap-4">
              <div className="p-4 bg-gray-900 rounded-lg border border-gray-800 max-w-md text-center">
                <h2 className="text-xl font-semibold mb-2 text-gray-300">Ready to Visualize</h2>
                <p className="text-sm">
                  Paste your Envoy config or config_dump JSON on the left and click Visualize.
                </p>
              </div>
            </div>
          )}

          {selectedNode && (
            <div className="absolute top-4 right-4 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-mono text-gray-500 uppercase">{selectedNode.type}</span>
                  <h3 className="font-bold text-lg break-all">{selectedNode.label}</h3>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-gray-500 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase mb-1">ID</h4>
                  <code className="text-xs bg-gray-950 p-1 rounded block break-all">{selectedNode.id}</code>
                </div>

                {Object.entries(selectedNode.data).length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase mb-1">Data</h4>
                    <pre className="text-xs bg-gray-950 p-2 rounded overflow-x-auto">
                      {JSON.stringify(selectedNode.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
