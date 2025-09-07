import Head from 'next/head';
import { useState } from 'react';

const TabButton = ({ tabName, activeTab, setActiveTab, label }) => (
    <button 
        onClick={() => setActiveTab(tabName)} 
        className={`tab-button flex-1 min-w-0 px-4 py-3 transition-all duration-300 text-sm font-medium ${activeTab === tabName ? 'active text-white' : 'text-gray-400 hover:text-white'}`}>
        {label}
    </button>
);

const LogPanel = ({ logs }) => (
    <div className="bg-black rounded-md p-4 h-64 overflow-y-auto mb-4 border border-gray-700">
        {logs.map((entry, index) => {
            let colorClass = 'text-gray-400';
            if (entry.type === 'error') colorClass = 'text-red-500 font-bold';
            if (entry.type === 'success') colorClass = 'text-green-400 font-bold';
            if (entry.type === 'open') colorClass = 'text-red-500';
            if (entry.type === 'found') colorClass = 'text-yellow-500';

            return (
                <div key={index} className={`mb-1 ${colorClass}`}>
                    <span className="text-gray-600">[{entry.timestamp}]</span> {entry.message}
                </div>
            );
        })}
    </div>
);

const PortScanner = ({ useApi }) => {
    const [target, setTarget] = useState('');
    const [scanType, setScanType] = useState('quick');
    const { logs, results, loading, handleApiCall, logMessage } = useApi('port');

    const startScan = async () => {
        if (!target) return alert('Por favor, introduce un objetivo válido');
        const data = await handleApiCall('scan-ports', { target, scanType });
        if (data && data.ports) {
            data.ports.forEach(port => {
                 logMessage(`Puerto ${port.port} ABIERTO`, 'open');
            });
        }
    };

    return (
        <div>
            <div className="glassmorphism rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold terminal-text mb-4">🔍 Escáner de Puertos</h2>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <input type="text" value={target} onChange={e => setTarget(e.target.value)} placeholder="Introduce un objetivo..." className="w-full rounded-md px-4 py-2 focus:outline-none" />
                    <select value={scanType} onChange={e => setScanType(e.target.value)} className="w-full rounded-md px-4 py-2 focus:outline-none">
                        <option value="quick">Escaneo Rápido</option>
                        <option value="intense">Escaneo Intenso</option>
                        <option value="all">Escaneo Ampliado (Top 1024)</option>
                    </select>
                </div>
                <button onClick={startScan} disabled={loading} className="glow-button font-bold py-3 px-6 rounded-md">
                    {loading ? 'Escaneando...' : 'Iniciar Escaneo'}
                </button>
            </div>
            {(loading || results) && (
                <div className="glassmorphism rounded-lg p-6">
                    <h3 className="text-xl font-bold terminal-text mb-4">Resultados del Escaneo</h3>
                    <LogPanel logs={logs} />
                    {results && (
                        <div className="glassmorphism rounded-md p-4">
                            <h4 className="text-lg font-bold terminal-text mb-3">📊 Resumen</h4>
                            <p>Puertos Abiertos: <span className="text-red-500 font-bold">{results.ports?.length || 0}</span></p>
                            <div className="text-red-500 text-sm">{results.ports?.map(p => p.port).join(', ')}</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const WebFuzzer = ({ useApi }) => {
    const [target, setTarget] = useState('');
    const { logs, results, loading, handleApiCall, logMessage } = useApi('fuzzer');

    const startFuzzing = async () => {
        if (!target) return alert('Por favor, introduce una URL válida');
        const data = await handleApiCall('web-fuzzer', { target });
        if (data && data.found) {
            logMessage(`Se encontraron ${data.found.length} rutas.`, 'info');
            data.found.forEach(item => {
                logMessage(`[${item.status}] Encontrado: ${item.path}`, 'found');
            });
        }
    };

    return (
        <div>
            <div className="glassmorphism rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold terminal-text mb-4">🌐 Web Fuzzer</h2>
                <input type="text" value={target} onChange={e => setTarget(e.target.value)} placeholder="https://ejemplo.com" className="w-full mb-4 rounded-md px-4 py-2 focus:outline-none" />
                <button onClick={startFuzzing} disabled={loading} className="glow-button font-bold py-3 px-6 rounded-md">
                    {loading ? 'Buscando...' : 'Iniciar Fuzzing'}
                </button>
            </div>
            {(loading || results) && (
                <div className="glassmorphism rounded-lg p-6">
                    <h3 className="text-xl font-bold terminal-text mb-4">Resultados del Fuzzing</h3>
                    <LogPanel logs={logs} />
                    {results && (
                        <div className="glassmorphism rounded-md p-4">
                            <h4 className="text-lg font-bold terminal-text mb-3">📊 Resumen</h4>
                            <p>Rutas Encontradas: <span className="text-yellow-500 font-bold">{results.found?.length || 0}</span></p>
                            <p>Rutas Probadas: <span className="text-gray-400">{(results.found?.length || 0) + (results.notFound?.length || 0)}</span></p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const DnsDumpster = ({ useApi }) => {
    const [target, setTarget] = useState('');
    const { logs, results, loading, handleApiCall } = useApi('dns');

    const startScan = () => {
        if (!target) return alert('Por favor, introduce un dominio válido');
        handleApiCall('dns-dumpster', { target });
    };

    return (
        <div>
            <div className="glassmorphism rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold terminal-text mb-4">🗑️ DNS Dumpster</h2>
                <input type="text" value={target} onChange={e => setTarget(e.target.value)} placeholder="ejemplo.com" className="w-full mb-4 rounded-md px-4 py-2 focus:outline-none" />
                <button onClick={startScan} disabled={loading} className="glow-button font-bold py-3 px-6 rounded-md">
                    {loading ? 'Buscando...' : 'Iniciar Búsqueda DNS'}
                </button>
            </div>
            {(loading || results) && (
                <div className="glassmorphism rounded-lg p-6">
                    <h3 className="text-xl font-bold terminal-text mb-4">Resultados de DNS</h3>
                    <LogPanel logs={logs} />
                    {results && (
                        <div className="glassmorphism rounded-md p-4">
                            <h4 className="text-lg font-bold terminal-text mb-3">📊 Resumen de Registros DNS</h4>
                            {Object.entries(results).map(([type, records]) => (
                                <div key={type} className="mb-2">
                                    <h5 className="text-green-400 font-semibold">{type}</h5>
                                    <ul className="list-disc list-inside text-yellow-500">
                                        {records.map((record, i) => <li key={i}>{record}</li>)}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const TechDetector = ({ useApi }) => {
    const [target, setTarget] = useState('');
    const { logs, results, loading, handleApiCall } = useApi('tech');

    const startScan = () => {
        if (!target) return alert('Por favor, introduce una URL válida');
        handleApiCall('tech-detection', { target });
    };

    return (
        <div>
            <div className="glassmorphism rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold terminal-text mb-4">🔧 Detector de Tecnología</h2>
                <input type="text" value={target} onChange={e => setTarget(e.target.value)} placeholder="https://ejemplo.com" className="w-full mb-4 rounded-md px-4 py-2 focus:outline-none" />
                <button onClick={startScan} disabled={loading} className="glow-button font-bold py-3 px-6 rounded-md">
                    {loading ? 'Analizando...' : 'Analizar Tecnología'}
                </button>
            </div>
            {(loading || results) && (
                <div className="glassmorphism rounded-lg p-6">
                    <h3 className="text-xl font-bold terminal-text mb-4">Análisis de Tecnología</h3>
                    <LogPanel logs={logs} />
                    {results && (
                        <div className="glassmorphism rounded-md p-4">
                             <h4 className="text-lg font-bold terminal-text mb-3">📊 Tecnologías Detectadas</h4>
                             {results.technologies?.length > 0 ? (
                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                    {results.technologies.reduce((acc, tech) => {
                                        tech.categories.forEach(cat => {
                                            if (!acc[cat.name]) acc[cat.name] = [];
                                            acc[cat.name].push(tech.name);
                                        });
                                        return acc;
                                    }, {}) 
                                    && Object.entries(results.technologies.reduce((acc, tech) => {
                                        tech.categories.forEach(cat => {
                                            if (!acc[cat.name]) acc[cat.name] = [];
                                            acc[cat.name].push(tech.name);
                                        });
                                        return acc;
                                    }, {})).map(([category, techs]) => (
                                        <div key={category}>
                                            <h5 className="text-green-400 font-semibold mb-1">{category}</h5>
                                            <p className="text-yellow-500">{techs.join(', ')}</p>
                                        </div>
                                    ))}
                                </div>
                             ) : <p>No se detectaron tecnologías específicas.</p>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default function HomePage() {
    const [activeTab, setActiveTab] = useState('port-scanner');
    
    const [logs, setLogs] = useState({ port: [], fuzzer: [], tech: [], dns: [] });
    const [results, setResults] = useState({ port: null, fuzzer: null, tech: null, dns: null });
    const [loading, setLoading] = useState({ port: false, fuzzer: false, tech: false, dns: false });

    const useApi = (logType) => {
        const logMessage = (message, type = 'info') => {
            const timestamp = new Date().toLocaleTimeString();
            setLogs(prev => ({ ...prev, [logType]: [...prev[logType], { timestamp, message, type }] }));
        };

        const handleApiCall = async (api, body) => {
            setLoading(prev => ({ ...prev, [logType]: true }));
            setResults(prev => ({ ...prev, [logType]: null }));
            setLogs(prev => ({ ...prev, [logType]: [] }));
            logMessage(`Iniciando análisis en ${body.target}...`);

            try {
                const response = await fetch(`/api/${api}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Error en el servidor');
                
                setResults(prev => ({ ...prev, [logType]: data }));
                logMessage('✅ Análisis completado.', 'success');
                return data;
            } catch (error) {
                logMessage(`❌ Error: ${error.message}`, 'error');
            } finally {
                setLoading(prev => ({ ...prev, [logType]: false }));
            }
        };

        return { logs: logs[logType], results: results[logType], loading: loading[logType], handleApiCall, logMessage };
    };

    const tabs = [
        { id: 'port-scanner', label: '🔍 Escáner de Puertos', Component: PortScanner },
        { id: 'web-fuzzer', label: '🌐 Web Fuzzer', Component: WebFuzzer },
        { id: 'dns-dumpster', label: '🗑️ DNS Dumpster', Component: DnsDumpster },
        { id: 'tech-detector', label: '🔧 Detector de Tecnología', Component: TechDetector },
    ];

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.Component;

    return (
        <>
            <Head>
                <title>Herramientas de Ciberseguridad</title>
                <link rel="icon" href="/favicon.ico" />
                <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600&display=swap" rel="stylesheet" />
            </Head>
            <main className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold terminal-text mb-2">CYBER SECURITY TOOLKIT</h1>
                    <p className="text-gray-400 opacity-80">Herramientas de Penetración y Análisis Web</p>
                </div>

                <div className="glassmorphism rounded-lg p-1 mb-6">
                    <div className="flex flex-wrap gap-2">
                        {tabs.map(tab => (
                            <TabButton key={tab.id} tabName={tab.id} activeTab={activeTab} setActiveTab={setActiveTab} label={tab.label} />
                        ))}
                    </div>
                </div>

                {ActiveComponent && <ActiveComponent useApi={useApi} />}

            </main>
        </>
    );
}