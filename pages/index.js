import Head from 'next/head';
import { useState } from 'react';

// Componentes auxiliares
const TabButton = ({ tabName, activeTab, setActiveTab, label, icon }) => (
    <button 
        onClick={() => setActiveTab(tabName)} 
        className={`tab-button flex-1 min-w-[100px] px-2 sm:px-4 py-2 sm:py-3 transition-all duration-300 text-xs sm:text-sm font-medium rounded-lg ${
            activeTab === tabName 
                ? 'active text-white bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500' 
                : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
        }`}>
        <span className="block sm:inline text-base sm:text-lg mb-1 sm:mb-0 sm:mr-2">{icon}</span>
        <span className="text-[10px] sm:text-sm">{label}</span>
    </button>
);

const LogPanel = ({ logs }) => (
    <div className="bg-black/50 rounded-lg p-3 sm:p-4 h-48 sm:h-64 overflow-y-auto mb-4 border border-emerald-500/20 backdrop-blur-sm">
        <div className="font-mono text-xs">
            {logs.length === 0 ? (
                <div className="text-gray-500 text-center py-8">Esperando resultados...</div>
            ) : (
                logs.map((entry, index) => {
                    let colorClass = 'text-gray-400';
                    if (entry.type === 'error') colorClass = 'text-red-400';
                    if (entry.type === 'success') colorClass = 'text-emerald-400 font-bold';
                    if (entry.type === 'open') colorClass = 'text-red-400';
                    if (entry.type === 'found') colorClass = 'text-yellow-400';
                    if (entry.type === 'info') colorClass = 'text-blue-400';
                    if (entry.type === 'warning') colorClass = 'text-orange-400';

                    return (
                        <div key={index} className={`mb-1 ${colorClass}`}>
                            <span className="text-gray-600">[{entry.timestamp}]</span> {entry.message}
                        </div>
                    );
                })
            )}
        </div>
    </div>
);

const CodeSnippet = ({ code, language = 'bash' }) => (
    <div className="bg-black/70 rounded-lg p-4 border border-emerald-500/20 mb-4">
        <div className="flex items-center justify-between mb-2">
            <span className="text-emerald-400 text-xs font-mono">{language.toUpperCase()}</span>
            <button 
                onClick={() => {
                    // Usar document.execCommand para compatibilidad en iFrames
                    const ta = document.createElement('textarea');
                    ta.value = code;
                    ta.style.position = 'absolute';
                    ta.style.left = '-9999px';
                    document.body.appendChild(ta);
                    ta.select();
                    try {
                        document.execCommand('copy');
                    } catch (err) {
                        console.error('No se pudo copiar al portapapeles', err);
                    }
                    document.body.removeChild(ta);
                }}
                className="text-gray-400 hover:text-emerald-400 text-xs px-2 py-1 rounded border border-gray-600 hover:border-emerald-500 transition-colors">
                Copiar
            </button>
        </div>
        <pre className="text-xs sm:text-sm text-gray-300 font-mono overflow-x-auto">{code}</pre>
    </div>
);

// Herramienta: Escáner de Puertos Mejorado
const PortScanner = ({ useApi }) => {
    const [target, setTarget] = useState('');
    const [scanType, setScanType] = useState('quick');
    const [customPorts, setCustomPorts] = useState('');
    const { logs, results, loading, handleApiCall, logMessage } = useApi('port');

    const scanTypes = [
        { value: 'quick', label: 'Rápido (Puertos comunes)', ports: '21,22,23,25,80,110,143,443,445,3306,3389,8080' },
        { value: 'intense', label: 'Intenso (Top 100)', ports: 'top100' },
        { value: 'all', label: 'Completo (Top 1024)', ports: 'top1024' },
        { value: 'custom', label: 'Personalizado', ports: 'custom' }
    ];

    const startScan = async () => {
        // CORRECCIÓN: No usar alert(). Usar logMessage para mostrar errores.
        if (!target) return logMessage('Por favor, introduce un objetivo válido', 'error');
        const ports = scanType === 'custom' ? customPorts : scanTypes.find(s => s.value === scanType).ports;
        const data = await handleApiCall('scan-ports', { target, scanType, ports });
        if (data && data.ports) {
            data.ports.forEach(port => {
                logMessage(`Puerto ${port.port}/${port.protocol} ABIERTO - ${port.service || 'Desconocido'}`, 'open');
            });
        }
    };

    const exampleCode = `# Escaneo básico con nmap
nmap -p 80,443 ${target || 'target.com'}

# Escaneo de servicios y versiones
nmap -sV -p- ${target || 'target.com'}

# Escaneo sigiloso
nmap -sS -T2 ${target || 'target.com'}`;

    return (
        <div>
            <div className="glassmorphism rounded-xl p-4 sm:p-6 mb-6 animate-fadeIn">
                <div className="flex items-center mb-4">
                    <span className="text-3xl sm:text-4xl mr-3">🔍</span>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold terminal-text">Escáner de Puertos</h2>
                        <p className="text-xs sm:text-sm text-gray-400">Identifica puertos abiertos y servicios activos</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input 
                        type="text" 
                        value={target} 
                        onChange={e => setTarget(e.target.value)} 
                        placeholder="192.168.1.1 o ejemplo.com" 
                        className="w-full rounded-lg px-4 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base" 
                    />
                    <select 
                        value={scanType} 
                        onChange={e => setScanType(e.target.value)} 
                        className="w-full rounded-lg px-4 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base">
                        {scanTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                    </select>
                </div>

                {scanType === 'custom' && (
                    <input 
                        type="text" 
                        value={customPorts} 
                        onChange={e => setCustomPorts(e.target.value)} 
                        placeholder="Ej: 80,443,8080-8090" 
                        className="w-full rounded-lg px-4 py-2 sm:py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" 
                    />
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                        onClick={startScan} 
                        disabled={loading} 
                        className="glow-button font-bold py-2 sm:py-3 px-6 rounded-lg flex-1 text-sm sm:text-base">
                        {loading ? '⏳ Escaneando...' : '🚀 Iniciar Escaneo'}
                    </button>
                    <button 
                        onClick={() => { setTarget(''); useApi('port').handleApiCall('', {}, true); }} // Limpiar
                        className="px-6 py-2 sm:py-3 rounded-lg border border-gray-600 hover:border-emerald-500 transition-colors text-sm sm:text-base">
                        🗑️ Limpiar
                    </button>
                </div>
            </div>

            {(loading || results) && (
                <div className="glassmorphism rounded-xl p-4 sm:p-6 animate-fadeIn">
                    <h3 className="text-lg sm:text-xl font-bold terminal-text mb-4">📊 Resultados del Escaneo</h3>
                    <LogPanel logs={logs} />
                    
                    {results && results.ports && results.ports.length > 0 && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/30 rounded-lg p-4">
                                    <div className="text-3xl font-bold text-red-400">{results.ports.length}</div>
                                    <div className="text-sm text-gray-400">Puertos Abiertos</div>
                                </div>
                                <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/30 rounded-lg p-4">
                                    <div className="text-3xl font-bold text-yellow-400">
                                        {new Set(results.ports.map(p => p.service)).size}
                                    </div>
                                    <div className="text-sm text-gray-400">Servicios Únicos</div>
                                </div>
                                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-lg p-4">
                                    <div className="text-3xl font-bold text-blue-400 truncate">{target}</div>
                                    <div className="text-sm text-gray-400 truncate">Objetivo</div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-emerald-500/30">
                                            <th className="text-left py-2 px-3 text-emerald-400">Puerto</th>
                                            <th className="text-left py-2 px-3 text-emerald-400">Protocolo</th>
                                            <th className="text-left py-2 px-3 text-emerald-400">Servicio</th>
                                            <th className="text-left py-2 px-3 text-emerald-400">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.ports.map((port, idx) => (
                                            <tr key={idx} className="border-b border-gray-700/50 hover:bg-white/5">
                                                <td className="py-2 px-3 text-red-400 font-bold">{port.port}</td>
                                                <td className="py-2 px-3 text-gray-300">{port.protocol}</td>
                                                <td className="py-2 px-3 text-yellow-400">{port.service || 'Desconocido'}</td>
                                                <td className="py-2 px-3">
                                                    <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">
                                                        ABIERTO
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}

            <div className="glassmorphism rounded-xl p-4 sm:p-6 mt-6">
                <h3 className="text-lg sm:text-xl font-bold terminal-text mb-4">💻 Ejemplos de Comandos</h3>
                <CodeSnippet code={exampleCode} />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                        <h4 className="font-bold text-blue-400 mb-2">📚 Uso Educativo</h4>
                        <p className="text-gray-400">Esta herramienta es para entrenamiento en entornos controlados y CTF.</p>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                        <h4 className="font-bold text-yellow-400 mb-2">⚠️ Advertencia Legal</h4>
                        <p className="text-gray-400">Solo usa en sistemas que tengas permiso para auditar.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Herramienta: Web Fuzzer Mejorado
const WebFuzzer = ({ useApi }) => {
    const [target, setTarget] = useState('');
    const [wordlist, setWordlist] = useState('common');
    const [extensions, setExtensions] = useState('php,html,js,txt');
    const { logs, results, loading, handleApiCall, logMessage } = useApi('fuzzer');

    const wordlists = [
        { value: 'common', label: 'Común (Rápido)', count: 30 },
        { value: 'medium', label: 'Medio (Completo)', count: 100 },
        { value: 'extensive', label: 'Extenso (Profundo)', count: 500 }
    ];

    const startFuzzing = async () => {
        // CORRECCIÓN: No usar alert(). Usar logMessage para mostrar errores.
        if (!target) return logMessage('Por favor, introduce una URL válida', 'error');
        const data = await handleApiCall('web-fuzzer', { target, wordlist, extensions });
        if (data && data.found) {
            logMessage(`✅ Se encontraron ${data.found.length} rutas accesibles.`, 'success');
            data.found.forEach(item => {
                logMessage(`[${item.status}] ${item.path} (${item.size || '?'} bytes)`, 'found');
            });
        }
    };

    const exampleCode = `# Fuzzing con ffuf
ffuf -u ${target || 'https://target.com'}/FUZZ -w wordlist.txt

# Fuzzing de extensiones
ffuf -u ${target || 'https://target.com'}/FUZZ -w wordlist.txt -e .php,.html,.js

# Fuzzing con filtro de tamaño
ffuf -u ${target || 'https://target.com'}/FUZZ -w wordlist.txt -fs 0`;

    return (
        <div>
            <div className="glassmorphism rounded-xl p-4 sm:p-6 mb-6 animate-fadeIn">
                <div className="flex items-center mb-4">
                    <span className="text-3xl sm:text-4xl mr-3">🌐</span>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold terminal-text">Web Fuzzer</h2>
                        <p className="text-xs sm:text-sm text-gray-400">Descubre rutas y archivos ocultos en aplicaciones web</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <input 
                        type="text" 
                        value={target} 
                        onChange={e => setTarget(e.target.value)} 
                        placeholder="https://ejemplo.com" 
                        className="w-full rounded-lg px-4 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base" 
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Wordlist</label>
                            <select 
                                value={wordlist} 
                                onChange={e => setWordlist(e.target.value)} 
                                className="w-full rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
                                {wordlists.map(wl => (
                                    <option key={wl.value} value={wl.value}>
                                        {wl.label} ({wl.count} rutas)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Extensiones</label>
                            <input 
                                type="text" 
                                value={extensions} 
                                onChange={e => setExtensions(e.target.value)} 
                                placeholder="php,html,js,txt" 
                                className="w-full rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" 
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                            onClick={startFuzzing} 
                            disabled={loading} 
                            className="glow-button font-bold py-2 sm:py-3 px-6 rounded-lg flex-1">
                            {loading ? '⏳ Fuzzing...' : '🚀 Iniciar Fuzzing'}
                        </button>
                        <button 
                            onClick={() => { setTarget(''); useApi('fuzzer').handleApiCall('', {}, true); }} // Limpiar
                            className="px-6 py-2 sm:py-3 rounded-lg border border-gray-600 hover:border-emerald-500 transition-colors">
                            🗑️ Limpiar
                        </button>
                    </div>
                </div>
            </div>

            {(loading || results) && (
                <div className="glassmorphism rounded-xl p-4 sm:p-6 animate-fadeIn">
                    <h3 className="text-lg sm:text-xl font-bold terminal-text mb-4">📊 Resultados del Fuzzing</h3>
                    <LogPanel logs={logs} />
                    
                    {results && results.found && (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                                <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/30 rounded-lg p-3 sm:p-4">
                                    <div className="text-2xl sm:text-3xl font-bold text-yellow-400">{results.found.length}</div>
                                    <div className="text-xs sm:text-sm text-gray-400">Encontrados</div>
                                </div>
                                <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-lg p-3 sm:p-4">
                                    <div className="text-2xl sm:text-3xl font-bold text-green-400">
                                        {results.found.filter(f => f.status === 200).length}
                                    </div>
                                    <div className="text-xs sm:text-sm text-gray-400">Status 200</div>
                                </div>
                                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-lg p-3 sm:p-4">
                                    <div className="text-2xl sm:text-3xl font-bold text-blue-400">
                                        {results.found.filter(f => f.status >= 300 && f.status < 400).length}
                                    </div>
                                    <div className="text-xs sm:text-sm text-gray-400">Redirects</div>
                                </div>
                                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-lg p-3 sm:p-4">
                                    <div className="text-2xl sm:text-3xl font-bold text-purple-400">
                                        {results.found.filter(f => f.status === 403 || f.status === 401).length}
                                    </div>
                                    <div className="text-xs sm:text-sm text-gray-400">Protegidos</div>
                                </div>
                            </div>

                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {results.found.map((item, idx) => {
                                    let statusColor = 'text-gray-400';
                                    if (item.status === 200) statusColor = 'text-green-400';
                                    if (item.status >= 300 && item.status < 400) statusColor = 'text-blue-400';
                                    if (item.status === 403 || item.status === 401) statusColor = 'text-purple-400';
                                    if (item.status >= 500) statusColor = 'text-red-400';

                                    return (
                                        <div key={idx} className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <code className="text-xs sm:text-sm text-yellow-400 break-all">{item.path}</code>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs sm:text-sm">
                                                    <span className={`font-bold ${statusColor}`}>[{item.status}]</span>
                                                    {item.size && <span className="text-gray-400">{item.size} bytes</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            )}

            <div className="glassmorphism rounded-xl p-4 sm:p-6 mt-6">
                <h3 className="text-lg sm:text-xl font-bold terminal-text mb-4">💻 Ejemplos de Comandos</h3>
                <CodeSnippet code={exampleCode} />
            </div>
        </div>
    );
};

// Herramienta: DNS Dumpster
const DnsDumpster = ({ useApi }) => {
    const [target, setTarget] = useState('');
    const { logs, results, loading, handleApiCall, logMessage } = useApi('dns');

    const startScan = () => {
        // CORRECCIÓN: No usar alert(). Usar logMessage para mostrar errores.
        if (!target) return logMessage('Por favor, introduce un dominio válido', 'error');
        handleApiCall('dns-dumpster', { target });
    };

    const exampleCode = `# Enumerar registros DNS
dig ${target || 'example.com'} ANY

# Buscar subdominios
subfinder -d ${target || 'example.com'}

# Registros específicos
dig ${target || 'example.com'} MX
dig ${target || 'example.com'} TXT`;

    return (
        <div>
            <div className="glassmorphism rounded-xl p-4 sm:p-6 mb-6 animate-fadeIn">
                <div className="flex items-center mb-4">
                    <span className="text-3xl sm:text-4xl mr-3">🗑️</span>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold terminal-text">DNS Dumpster</h2>
                        <p className="text-xs sm:text-sm text-gray-400">Enumera registros DNS y subdominios</p>
                    </div>
                </div>

                <input 
                    type="text" 
                    value={target} 
                    onChange={e => setTarget(e.target.value)} 
                    placeholder="ejemplo.com" 
                    className="w-full mb-4 rounded-lg px-4 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base" 
                />

                <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                        onClick={startScan} 
                        disabled={loading} 
                        className="glow-button font-bold py-2 sm:py-3 px-6 rounded-lg flex-1">
                        {loading ? '⏳ Analizando DNS...' : '🚀 Iniciar Análisis'}
                    </button>
                    <button 
                        onClick={() => { setTarget(''); useApi('dns').handleApiCall('', {}, true); }} // Limpiar
                        className="px-6 py-2 sm:py-3 rounded-lg border border-gray-600 hover:border-emerald-500 transition-colors">
                        🗑️ Limpiar
                    </button>
                </div>
            </div>

            {(loading || results) && (
                <div className="glassmorphism rounded-xl p-4 sm:p-6 animate-fadeIn">
                    <h3 className="text-lg sm:text-xl font-bold terminal-text mb-4">📊 Resultados DNS</h3>
                    <LogPanel logs={logs} />
                    
                    {results && Object.keys(results).length > 0 && (
                        <div className="space-y-4">
                            {/* CORRECCIÓN 1: Comprobar que 'records' es un Array antes de mapear */}
                            {Object.entries(results).map(([type, records]) => 
                                Array.isArray(records) && records.length > 0 && (
                                <div key={type} className="bg-gradient-to-br from-white/5 to-white/10 rounded-lg p-4 border border-emerald-500/20">
                                    <h4 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
                                        <span className="text-lg">📝</span>
                                        <span>{type} Records</span>
                                        <span className="ml-auto text-sm bg-emerald-500/20 px-2 py-1 rounded">
                                            {records.length}
                                        </span>
                                    </h4>
                                    <div className="space-y-2">
                                        {records.map((record, i) => (
                                            <div key={i} className="bg-black/30 rounded px-3 py-2 font-mono text-xs sm:text-sm text-yellow-400 break-all">
                                                {/* CORRECCIÓN 2: Mostrar 'record.data' en lugar del objeto completo */}
                                                {record.data}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="glassmorphism rounded-xl p-4 sm:p-6 mt-6">
                <h3 className="text-lg sm:text-xl font-bold terminal-text mb-4">💻 Ejemplos de Comandos</h3>
                <CodeSnippet code={exampleCode} />
            </div>
        </div>
    );
};

// Herramienta: Detector de Tecnología
const TechDetector = ({ useApi }) => {
    const [target, setTarget] = useState('');
    const { logs, results, loading, handleApiCall, logMessage } = useApi('tech');

    const startScan = () => {
        // CORRECCIÓN: No usar alert(). Usar logMessage para mostrar errores.
        if (!target) return logMessage('Por favor, introduce una URL válida', 'error');
        handleApiCall('tech-detection', { target });
    };

    const exampleCode = `# Detectar tecnologías web
whatweb ${target || 'https://example.com'}

# Análisis detallado con Wappalyzer CLI
wappalyzer ${target || 'https://example.com'}

# Headers y tecnología
curl -I ${target || 'https://example.com'}`;

    return (
        <div>
            <div className="glassmorphism rounded-xl p-4 sm:p-6 mb-6 animate-fadeIn">
                <div className="flex items-center mb-4">
                    <span className="text-3xl sm:text-4xl mr-3">🔧</span>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold terminal-text">Detector de Tecnología</h2>
                        <p className="text-xs sm:text-sm text-gray-400">Identifica frameworks, CMS y tecnologías web</p>
                    </div>
                </div>

                <input 
                    type="text" 
                    value={target} 
                    onChange={e => setTarget(e.target.value)} 
                    placeholder="https://ejemplo.com" 
                    className="w-full mb-4 rounded-lg px-4 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base" 
                />

                <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                        onClick={startScan} 
                        disabled={loading} 
                        className="glow-button font-bold py-2 sm:py-3 px-6 rounded-lg flex-1">
                        {loading ? '⏳ Analizando...' : '🚀 Analizar Tecnología'}
                    </button>
                    <button 
                        onClick={() => { setTarget(''); useApi('tech').handleApiCall('', {}, true); }} // Limpiar
                        className="px-6 py-2 sm:py-3 rounded-lg border border-gray-600 hover:border-emerald-500 transition-colors">
                        🗑️ Limpiar
                    </button>
                </div>
            </div>

            {(loading || results) && (
                <div className="glassmorphism rounded-xl p-4 sm:p-6 animate-fadeIn">
                    <h3 className="text-lg sm:text-xl font-bold terminal-text mb-4">📊 Tecnologías Detectadas</h3>
                    <LogPanel logs={logs} />
                    
                    {/* CORRECCIÓN: Lógica de renderizado mejorada y más segura */}
                    {results && results.technologies && results.technologies.length > 0 && (() => {
                        // Primero, agrupar las tecnologías
                        const groupedTechs = results.technologies.reduce((acc, tech) => {
                            (tech.categories || []).forEach(cat => {
                                if (!acc[cat.name]) acc[cat.name] = [];
                                acc[cat.name].push(tech);
                            });
                            return acc;
                        }, {});

                        // Luego, renderizar el objeto agrupado
                        return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(groupedTechs).map(([category, techs]) => (
                                    <div key={category} className="bg-gradient-to-br from-white/5 to-white/10 rounded-lg p-4 border border-emerald-500/20">
                                        <h4 className="text-emerald-400 font-semibold mb-3 text-sm">{category}</h4>
                                        <div className="space-y-2">
                                            {techs.map((tech, idx) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    {tech.icon && (
                                                        <img src={`https://www.wappalyzer.com/images/icons/${tech.icon}`} alt={tech.name} className="w-5 h-5" />
                                                    )}
                                                    <span className="text-yellow-400 text-xs sm:text-sm">{tech.name}</span>
                                                    {tech.version && (
                                                        <span className="text-gray-500 text-xs">v{tech.version}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </div>
            )}

            <div className="glassmorphism rounded-xl p-4 sm:p-6 mt-6">
                <h3 className="text-lg sm:text-xl font-bold terminal-text mb-4">💻 Ejemplos de Comandos</h3>
                <CodeSnippet code={exampleCode} />
            </div>
        </div>
    );
};

// Componente Principal
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

        const handleApiCall = async (api, body, clear = false) => {
            if (clear) {
                setLogs(prev => ({ ...prev, [logType]: [] }));
                setResults(prev => ({ ...prev, [logType]: null }));
                return;
            }

            setLoading(prev => ({ ...prev, [logType]: true }));
            setResults(prev => ({ ...prev, [logType]: null }));
            setLogs(prev => ({ ...prev, [logType]: [] }));
            logMessage(`🔍 Iniciando análisis en ${body.target}...`);

            try {
                const response = await fetch(`/api/${api}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Error en el servidor');
                
                setResults(prev => ({ ...prev, [logType]: data }));
                logMessage('✅ Análisis completado exitosamente.', 'success');
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
        { id: 'port-scanner', label: 'Puertos', icon: '🔍', Component: PortScanner },
        { id: 'web-fuzzer', label: 'Fuzzer', icon: '🌐', Component: WebFuzzer },
        { id: 'dns-dumpster', label: 'DNS', icon: '🗑️', Component: DnsDumpster },
        { id: 'tech-detector', label: 'Tech', icon: '🔧', Component: TechDetector },
    ];

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.Component;

    return (
        <>
            <Head>
                <title>Valtorix Cyber Toolkit | Herramientas de Ciberseguridad</title>
                <meta name="description" content="Suite profesional de herramientas de ciberseguridad para capacitación, CTF y auditorías en entornos controlados" />
                <link rel="icon" href="https://cybervaltorix.com/wp-content/uploads/2024/07/cropped-Valtorix-Favicon-1-32x32.png" sizes="32x32" />
                <link rel="icon" href="https://cybervaltorix.com/wp-content/uploads/2024/07/cropped-Valtorix-Favicon-1-192x192.png" sizes="192x192" />
                <link rel="apple-touch-icon" href="https://cybervaltorix.com/wp-content/uploads/2024/07/cropped-Valtorix-Favicon-1-180x180.png" />
                <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </Head>

            <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
                {/* Header con Logo */}
                <header className="border-b border-emerald-500/20 bg-black/50 backdrop-blur-lg sticky top-0 z-50">
                    <div className="container mx-auto px-4 py-3 sm:py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <img 
                                    src="https://cybervaltorix.com/wp-content/uploads/2025/09/Logo-Valtorix-1.png" 
                                    alt="Valtorix Logo" 
                                    className="h-8 sm:h-12 w-auto object-contain"
                                    onError={(e) => e.currentTarget.src = 'https://placehold.co/200x50/000000/10b981?text=Valtorix'}
                                />
                                <div className="hidden sm:block">
                                    <h1 className="text-lg sm:text-2xl font-bold terminal-text">CYBER TOOLKIT</h1>
                                    <p className="text-xs text-gray-400">Professional Security Suite</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-4">
                                <span className="hidden sm:inline-block px-3 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    v2.1 Corregido
                                </span>
                                <span className="px-2 sm:px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                    Training Mode
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
                    {/* Hero Section */}
                    <div className="text-center mb-6 sm:mb-8 animate-fadeIn">
                        <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold terminal-text mb-2 sm:mb-4">
                            🛡️ Suite de Ciberseguridad
                        </h2>
                        <p className="text-xs sm:text-base text-gray-400 max-w-3xl mx-auto px-4">
                            Herramientas profesionales para capacitación, CTF y auditorías en entornos controlados.
                            Diseñado para educación y desarrollo de habilidades en seguridad informática.
                        </p>
                    </div>

                    {/* Tabs de Navegación */}
                    <div className="glassmorphism rounded-xl p-2 mb-4 sm:mb-6 animate-fadeIn">
                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                            {tabs.map(tab => (
                                <TabButton 
                                    key={tab.id} 
                                    tabName={tab.id} 
                                    activeTab={activeTab} 
                                    setActiveTab={setActiveTab} 
                                    label={tab.label}
                                    icon={tab.icon}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Contenido Activo */}
                    {ActiveComponent && <ActiveComponent useApi={useApi} />}

                    {/* Footer Informativo */}
                    <footer className="mt-8 sm:mt-12 glassmorphism rounded-xl p-4 sm:p-6 text-center">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                                <div className="text-3xl mb-2">🎓</div>
                                <h3 className="font-bold text-blue-400 mb-2">Educación</h3>
                                <p className="text-xs sm:text-sm text-gray-400">
                                    Para capacitación y desarrollo de habilidades
                                </p>
                            </div>
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                                <div className="text-3xl mb-2">⚡</div>
                                <h3 className="font-bold text-yellow-400 mb-2">CTF & Labs</h3>
                                <p className="text-xs sm:text-sm text-gray-400">
                                    Ideal para competencias y entornos controlados
                                </p>
                            </div>
                            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                <div className="text-3xl mb-2">🔒</div>
                                <h3 className="font-bold text-green-400 mb-2">Auditorías</h3>
                                <p className="text-xs sm:text-sm text-gray-400">
                                    Solo en sistemas autorizados
                                </p>
                            </div>
                        </div>

                        <div className="border-t border-gray-700 pt-4">
                            <p className="text-xs sm:text-sm text-gray-500 mb-2">
                                Desarrollado por <span className="text-emerald-400 font-bold">Valtorix Cybersecurity</span>
                            </p>
                            <p className="text-xs text-gray-600">
                                ⚠️ Uso exclusivo en entornos autorizados • Fines educativos y de capacitación
                            </p>
                        </div>
                    </footer>
                </div>
            </main>

            <style jsx global>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out;
                }

                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }

                .animate-pulse {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </>
    );
}
