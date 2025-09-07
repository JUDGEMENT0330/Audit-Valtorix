import Head from 'next/head';
import { useState, useEffect } from 'react';

export default function HomePage() {
    const [activeTab, setActiveTab] = useState('port-scanner');
    
    // General state
    const [portTarget, setPortTarget] = useState('');
    const [fuzzerTarget, setFuzzerTarget] = useState('');
    const [techTarget, setTechTarget] = useState('');
    const [scanType, setScanType] = useState('quick');

    const [logs, setLogs] = useState({ port: [], fuzzer: [], tech: [] });
    const [results, setResults] = useState({ port: null, fuzzer: null, tech: null });
    const [loading, setLoading] = useState({ port: false, fuzzer: false, tech: false });

    const logMessage = (logType, message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => ({ ...prev, [logType]: [...prev[logType], { timestamp, message, type }] }));
    };

    const handleApiCall = async (api, body, logType, resultType) => {
        setLoading(prev => ({ ...prev, [logType]: true }));
        setResults(prev => ({ ...prev, [resultType]: null }));
        setLogs(prev => ({ ...prev, [logType]: [] }));
        logMessage(logType, `Iniciando análisis en ${body.target}...`, 'info');

        try {
            const response = await fetch(`/api/${api}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Error en el servidor');
            
            setResults(prev => ({ ...prev, [resultType]: data }));
            logMessage(logType, '✅ Análisis completado.', 'success');
            return data;
        } catch (error) {
            logMessage(logType, `❌ Error: ${error.message}`, 'error');
        } finally {
            setLoading(prev => ({ ...prev, [logType]: false }));
        }
    };

    const startPortScan = async () => {
        if (!portTarget) return alert('Por favor, introduce un objetivo válido');
        const data = await handleApiCall('scan-ports', { target: portTarget, scanType }, 'port', 'port');
        if (data && data.ports) {
            data.ports.forEach(port => {
                 logMessage('port', `Puerto ${port.port} ABIERTO`, 'open');
            });
        }
    };

    const startWebFuzzing = async () => {
        if (!fuzzerTarget) return alert('Por favor, introduce una URL válida');
        const data = await handleApiCall('web-fuzzer', { target: fuzzerTarget }, 'fuzzer', 'fuzzer');
        if (data && data.found) {
            logMessage('fuzzer', `Se encontraron ${data.found.length} rutas.`, 'info');
            data.found.forEach(item => {
                logMessage('fuzzer', `[${item.status}] Encontrado: ${item.path}`, 'found');
            });
        }
    };

    const startTechDetection = () => {
        if (!techTarget) return alert('Por favor, introduce una URL válida');
        handleApiCall('tech-detection', { target: techTarget }, 'tech', 'tech');
    };

    const renderLog = (log) => (
        log.map((entry, index) => {
            let colorClass = 'text-green-400';
            if (entry.type === 'error') colorClass = 'text-red-400 font-bold';
            if (entry.type === 'success') colorClass = 'text-green-300 font-bold';
            if (entry.type === 'open') colorClass = 'text-red-400';
            if (entry.type === 'found') colorClass = 'text-yellow-400';

            return (
                <div key={index} className={`mb-1 ${colorClass}`}>
                    <span className="text-gray-500">[{entry.timestamp}]</span> {entry.message}
                </div>
            );
        })
    );
    
    const TabButton = ({ tabName, label }) => (
        <button 
            onClick={() => setActiveTab(tabName)} 
            className={`tab-button flex-1 min-w-0 px-4 py-3 rounded-md transition-all duration-300 text-sm font-medium ${activeTab === tabName ? 'bg-green-600 text-black' : 'text-green-400'}`}>
            {label}
        </button>
    );

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
                    <p className="text-green-300 opacity-80">Herramientas de Penetración y Análisis Web</p>
                </div>

                <div className="glassmorphism rounded-lg p-1 mb-6">
                    <div className="flex flex-wrap gap-2">
                        <TabButton tabName="port-scanner" label="🔍 Escáner de Puertos" />
                        <TabButton tabName="web-fuzzer" label="🌐 Web Fuzzer" />
                        <TabButton tabName="tech-detector" label="🔧 Detector de Tecnología" />
                    </div>
                </div>

                <div style={{ display: activeTab === 'port-scanner' ? 'block' : 'none' }}>
                    <div className="glassmorphism rounded-lg p-6 mb-6">
                        <h2 className="text-2xl font-bold terminal-text mb-4">🔍 Escáner de Puertos</h2>
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <input type="text" value={portTarget} onChange={e => setPortTarget(e.target.value)} placeholder="Introduce un objetivo..." className="w-full bg-black border border-green-500 rounded-md px-4 py-2 text-green-400 focus:outline-none focus:border-green-300" />
                            <select value={scanType} onChange={e => setScanType(e.target.value)} className="w-full bg-black border border-green-500 rounded-md px-4 py-2 text-green-400 focus:outline-none focus:border-green-300">
                                <option value="quick">Escaneo Rápido</option>
                                <option value="intense">Escaneo Intenso</option>
                                <option value="all">Escaneo Ampliado (Top 1024)</option>
                            </select>
                        </div>
                        <button onClick={startPortScan} disabled={loading.port} className="glow-button bg-green-600 hover:bg-green-500 text-black font-bold py-3 px-6 rounded-md">
                            {loading.port ? 'Escaneando...' : 'Iniciar Escaneo'}
                        </button>
                    </div>
                    {(loading.port || results.port) && (
                        <div className="glassmorphism rounded-lg p-6">
                            <h3 className="text-xl font-bold terminal-text mb-4">Resultados del Escaneo</h3>
                            <div className="bg-black rounded-md p-4 h-64 overflow-y-auto mb-4 border border-green-500">{renderLog(logs.port)}</div>
                            {results.port && (
                                <div className="glassmorphism rounded-md p-4">
                                    <h4 className="text-lg font-bold terminal-text mb-3">📊 Resumen</h4>
                                    <p>Puertos Abiertos: <span className="text-red-400 font-bold">{results.port.ports?.length || 0}</span></p>
                                    <div className="text-red-400 text-sm">{results.port.ports?.map(p => p.port).join(', ')}</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div style={{ display: activeTab === 'web-fuzzer' ? 'block' : 'none' }}>
                     <div className="glassmorphism rounded-lg p-6 mb-6">
                        <h2 className="text-2xl font-bold terminal-text mb-4">🌐 Web Fuzzer</h2>
                        <input type="text" value={fuzzerTarget} onChange={e => setFuzzerTarget(e.target.value)} placeholder="https://ejemplo.com" className="w-full mb-4 bg-black border border-green-500 rounded-md px-4 py-2 text-green-400 focus:outline-none focus:border-green-300" />
                        <button onClick={startWebFuzzing} disabled={loading.fuzzer} className="glow-button bg-green-600 hover:bg-green-500 text-black font-bold py-3 px-6 rounded-md">
                            {loading.fuzzer ? 'Buscando...' : 'Iniciar Fuzzing'}
                        </button>
                    </div>
                    {(loading.fuzzer || results.fuzzer) && (
                        <div className="glassmorphism rounded-lg p-6">
                            <h3 className="text-xl font-bold terminal-text mb-4">Resultados del Fuzzing</h3>
                            <div className="bg-black rounded-md p-4 h-64 overflow-y-auto mb-4 border border-green-500">{renderLog(logs.fuzzer)}</div>
                            {results.fuzzer && (
                                <div className="glassmorphism rounded-md p-4">
                                    <h4 className="text-lg font-bold terminal-text mb-3">📊 Resumen</h4>
                                    <p>Rutas Encontradas: <span className="text-yellow-400 font-bold">{results.fuzzer.found?.length || 0}</span></p>
                                    <p>Rutas Probadas: <span className="text-gray-400">{(results.fuzzer.found?.length || 0) + (results.fuzzer.notFound?.length || 0)}</span></p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div style={{ display: activeTab === 'tech-detector' ? 'block' : 'none' }}>
                    <div className="glassmorphism rounded-lg p-6 mb-6">
                        <h2 className="text-2xl font-bold terminal-text mb-4">🔧 Detector de Tecnología</h2>
                        <input type="text" value={techTarget} onChange={e => setTechTarget(e.target.value)} placeholder="https://ejemplo.com" className="w-full mb-4 bg-black border border-green-500 rounded-md px-4 py-2 text-green-400 focus:outline-none focus:border-green-300" />
                        <button onClick={startTechDetection} disabled={loading.tech} className="glow-button bg-green-600 hover:bg-green-500 text-black font-bold py-3 px-6 rounded-md">
                            {loading.tech ? 'Analizando...' : 'Analizar Tecnología'}
                        </button>
                    </div>
                    {(loading.tech || results.tech) && (
                        <div className="glassmorphism rounded-lg p-6">
                            <h3 className="text-xl font-bold terminal-text mb-4">Análisis de Tecnología</h3>
                            <div className="bg-black rounded-md p-4 h-32 overflow-y-auto mb-4 border border-green-500">{renderLog(logs.tech)}</div>
                            {results.tech && (
                                <div className="glassmorphism rounded-md p-4">
                                     <h4 className="text-lg font-bold terminal-text mb-3">📊 Tecnologías Detectadas</h4>
                                     {results.tech.technologies?.length > 0 ? (
                                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                                            {results.tech.technologies.reduce((acc, tech) => {
                                                tech.categories.forEach(cat => {
                                                    if (!acc[cat.name]) acc[cat.name] = [];
                                                    acc[cat.name].push(tech.name);
                                                });
                                                return acc;
                                            }, {}) 
                                            && Object.entries(results.tech.technologies.reduce((acc, tech) => {
                                                tech.categories.forEach(cat => {
                                                    if (!acc[cat.name]) acc[cat.name] = [];
                                                    acc[cat.name].push(tech.name);
                                                });
                                                return acc;
                                            }, {})).map(([category, techs]) => (
                                                <div key={category}>
                                                    <h5 className="text-green-300 font-semibold mb-1">{category}</h5>
                                                    <p className="text-yellow-400">{techs.join(', ')}</p>
                                                </div>
                                            ))}
                                        </div>
                                     ) : <p>No se detectaron tecnologías específicas.</p>}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}