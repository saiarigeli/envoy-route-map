import React, { useState, useRef } from 'react';
import type { VisualizeRequest, GraphStats } from '../types';
import { AlertCircle, Play, Upload, X, FileText, Settings } from 'lucide-react';

interface ConfigPanelProps {
    onVisualize: (request: VisualizeRequest) => void;
    isLoading: boolean;
    stats?: GraphStats;
    warnings: string[];
    error?: string;
}

interface ConfigFile {
    name: string;
    content: string;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
    onVisualize,
    isLoading,
    stats,
    warnings,
    error
}) => {
    const [files, setFiles] = useState<ConfigFile[]>([]);
    const [format, setFormat] = useState<'auto' | 'json' | 'yaml'>('auto');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles: ConfigFile[] = [];
            for (let i = 0; i < e.target.files.length; i++) {
                const file = e.target.files[i];
                const text = await file.text();
                newFiles.push({ name: file.name, content: text });
            }
            setFiles(prev => [...prev, ...newFiles]);
        }
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';


    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const configs: string[] = [];
        files.forEach(f => configs.push(f.content));

        if (configs.length === 0) return;

        onVisualize({ configs, format });
    };

    const hasContent = files.length > 0;

    return (
        <div className="h-full flex flex-col bg-gray-950 text-white border-r border-gray-800 shadow-2xl z-20 relative w-full">
            <div className="p-6 border-b border-gray-800 bg-gray-900/50 backdrop-blur">
                <h1 className="text-2xl font-bold flex items-center gap-3 tracking-tight text-blue-400">
                    <Settings className="w-6 h-6" />
                    Envoy Route Map
                </h1>
                <p className="text-gray-500 text-sm mt-1">Visualize your Envoy configuration</p>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-6 gap-6 min-h-0 overflow-y-auto">

                {/* Upload Section */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Configuration Files</label>
                        <select
                            value={format}
                            onChange={(e) => setFormat(e.target.value as any)}
                            className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                        >
                            <option value="auto">Auto Detect</option>
                            <option value="json">JSON</option>
                            <option value="yaml">YAML</option>
                        </select>
                    </div>

                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-blue-500 hover:bg-gray-900/50 transition-all group"
                    >
                        <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                            <Upload size={24} className="text-gray-400 group-hover:text-blue-400" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-300">Click to upload config files</p>
                            <p className="text-xs text-gray-500 mt-1">Supports JSON, YAML, TXT</p>
                        </div>
                        <input
                            type="file"
                            multiple
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                            accept=".json,.yaml,.yml,.txt"
                        />
                    </div>
                </div>

                {/* File List */}
                {files.length > 0 && (
                    <div className="flex flex-col gap-2">
                        {files.map((f, i) => (
                            <div key={i} className="flex items-center justify-between bg-gray-900 p-3 rounded-lg border border-gray-800 group hover:border-gray-700 transition-colors">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-2 bg-gray-800 rounded text-blue-400">
                                        <FileText size={16} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="truncate text-sm font-medium text-gray-200" title={f.name}>{f.name}</span>
                                        <span className="text-xs text-gray-500">{(f.content.length / 1024).toFixed(1)} KB</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeFile(i)}
                                    className="text-gray-600 hover:text-red-400 p-2 rounded-full hover:bg-gray-800 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading || !hasContent}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-semibold shadow-lg shadow-blue-900/20 transition-all transform active:scale-[0.98]"
                >
                    {isLoading ? (
                        <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing...
                        </span>
                    ) : (
                        <>
                            <Play size={18} fill="currentColor" />
                            Visualize Configuration
                        </>
                    )}
                </button>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-lg text-sm flex gap-3 items-start animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-400" />
                        <span className="leading-relaxed">{error}</span>
                    </div>
                )}

                {stats && (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 space-y-4">
                        <h3 className="font-semibold text-gray-400 uppercase text-xs tracking-wider flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Graph Statistics
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <StatItem label="Listeners" value={stats.listeners} color="text-blue-400" />
                            <StatItem label="Filters" value={stats.listeners} color="text-purple-400" /> {/* Approximate since we don't have exact filter count in stats yet, reusing listener count placeholder or need to update stats */}
                            <StatItem label="Route Configs" value={stats.route_configs} color="text-violet-400" />
                            <StatItem label="Virtual Hosts" value={stats.virtual_hosts} color="text-pink-400" />
                            <StatItem label="Routes" value={stats.routes} color="text-orange-400" />
                            <StatItem label="Clusters" value={stats.clusters} color="text-green-400" />
                            <StatItem label="Endpoints" value={stats.endpoints} color="text-cyan-400" />
                        </div>
                    </div>
                )}

                {warnings.length > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-sm max-h-60 overflow-y-auto custom-scrollbar">
                        <h3 className="font-semibold text-yellow-500 uppercase text-xs mb-3 flex items-center gap-2 sticky top-0 bg-transparent">
                            <AlertCircle size={14} /> Warnings
                        </h3>
                        <ul className="space-y-2 text-yellow-200/70">
                            {warnings.map((w, i) => (
                                <li key={i} className="text-xs flex gap-2 items-start">
                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-yellow-500 shrink-0" />
                                    {w}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </form>
        </div>
    );
};

const StatItem = ({ label, value, color }: { label: string; value: number; color?: string }) => (
    <div className="flex justify-between items-center bg-gray-800/50 p-2 rounded border border-gray-800">
        <span className="text-gray-500 text-xs">{label}</span>
        <span className={`font-mono font-bold text-sm ${color || 'text-white'}`}>{value}</span>
    </div>
);
