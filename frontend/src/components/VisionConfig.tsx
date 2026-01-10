import React, { useState, useEffect } from 'react';
import { Save, Activity, CheckCircle, XCircle } from 'lucide-react';
import { memoryApi } from '../api/memoryApi';

interface VisionConfigProps {
    onClose: () => void;
}

export const VisionConfig: React.FC<VisionConfigProps> = ({ onClose }) => {
    const [endpoint, setEndpoint] = useState('');
    const [model, setModel] = useState('');
    const [apiKey, setApiKey] = useState('lm-studio');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{type: 'success'|'error'|'info', msg: string} | null>(null);

    useEffect(() => {
        memoryApi.getVisionConfig().then(cfg => {
            setEndpoint(cfg.endpoint_url || 'http://localhost:11434'); // Default hint
            setModel(cfg.model_name || 'llava');
            setApiKey(cfg.api_key || 'lm-studio');
        }).catch(err => {
            console.error(err);
            setStatus({type: 'error', msg: 'Could not load config. Mount drive first.'});
        });
    }, []);

    const handleTest = async () => {
        setLoading(true);
        setStatus({type: 'info', msg: 'Testing connection...'});
        try {
            const res = await memoryApi.testVisionConfig({
                endpoint_url: endpoint,
                model_name: model,
                api_key: apiKey
            });
            if (res.status === 'ok') {
                setStatus({type: 'success', msg: res.details});
            } else {
                setStatus({type: 'error', msg: res.details});
            }
        } catch (err: any) {
            setStatus({type: 'error', msg: err.message});
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await memoryApi.setVisionConfig({
                endpoint_url: endpoint,
                model_name: model,
                api_key: apiKey
            });
            setStatus({type: 'success', msg: 'Configuration saved successfully.'});
            setTimeout(onClose, 1500);
        } catch (err: any) {
            setStatus({type: 'error', msg: err.message});
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    Vision Backend Configuration
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LLM Endpoint URL</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="http://localhost:11434"
                            value={endpoint}
                            onChange={e => setEndpoint(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">e.g. http://localhost:1234 (LM Studio) or http://localhost:11434 (Ollama)</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Model Name</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="llava-v1.6-vicuna"
                            value={model}
                            onChange={e => setModel(e.target.value)}
                        />
                    </div>

                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                         <input
                             type="password"
                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                             placeholder="lm-studio"
                             value={apiKey}
                             onChange={e => setApiKey(e.target.value)}
                         />
                    </div>
                </div>

                {status && status.msg && (
                    <div className={`mt-4 p-3 rounded-md flex items-start gap-2 text-sm ${
                        status.type === 'error' ? 'bg-red-50 text-red-700' :
                        status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                        {status.type === 'success' ? <CheckCircle className="w-4 h-4 mt-0.5" /> :
                         status.type === 'error' ? <XCircle className="w-4 h-4 mt-0.5" /> : null}
                        {status.msg}
                    </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={handleTest}
                        disabled={loading || !endpoint}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                        Test Connection
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading || !endpoint}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2"
                    >
                        {loading ? 'Saving...' : <><Save className="w-4 h-4" /> Save Configuration</>}
                    </button>
                </div>
            </div>
        </div>
    );
};
