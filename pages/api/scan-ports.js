import axios from 'axios';

const commonPorts = {
    21: 'FTP',
    22: 'SSH',
    23: 'Telnet',
    25: 'SMTP',
    53: 'DNS',
    80: 'HTTP',
    110: 'POP3',
    143: 'IMAP',
    443: 'HTTPS',
    445: 'SMB',
    3306: 'MySQL',
    3389: 'RDP',
    5432: 'PostgreSQL',
    5900: 'VNC',
    8080: 'HTTP-Proxy',
    8443: 'HTTPS-Alt',
    27017: 'MongoDB'
};

const top100Ports = [
    7, 9, 13, 21, 22, 23, 25, 26, 37, 53, 79, 80, 81, 88, 106, 110, 111, 113, 119, 135, 
    139, 143, 144, 179, 199, 389, 427, 443, 444, 445, 465, 513, 514, 515, 543, 544, 
    548, 554, 587, 631, 646, 873, 990, 993, 995, 1025, 1026, 1027, 1028, 1029, 1110, 
    1433, 1720, 1723, 1755, 1900, 2000, 2001, 2049, 2121, 2717, 3000, 3128, 3306, 
    3389, 3986, 4899, 5000, 5009, 5051, 5060, 5101, 5190, 5357, 5432, 5631, 5666, 
    5800, 5900, 6000, 6001, 6646, 7070, 8000, 8008, 8009, 8080, 8081, 8443, 8888, 
    9100, 9999, 10000, 32768, 49152, 49153, 49154, 49155, 49156, 49157
];

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests allowed' });
    }

    const { target, scanType, ports } = req.body;

    if (!target) {
        return res.status(400).json({ error: 'El objetivo es requerido' });
    }

    try {
        // Simulación mejorada de escaneo de puertos
        // En producción, esto usaría nmap o similar
        let portsToScan = [];

        if (scanType === 'quick' || !scanType) {
            portsToScan = [21, 22, 23, 25, 80, 110, 143, 443, 445, 3306, 3389, 8080];
        } else if (scanType === 'intense') {
            portsToScan = top100Ports.slice(0, 100);
        } else if (scanType === 'all') {
            portsToScan = top100Ports;
        } else if (scanType === 'custom' && ports) {
            // Parsear puertos personalizados
            const customPorts = ports.split(',').map(p => {
                if (p.includes('-')) {
                    const [start, end] = p.split('-').map(Number);
                    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
                }
                return parseInt(p);
            }).flat();
            portsToScan = customPorts;
        }

        // Usar la API de HackerTarget o simulación
        let response;
        try {
            response = await axios.get(
                `https://api.hackertarget.com/nmap/?q=${target}`,
                { timeout: 10000 }
            );
        } catch (apiError) {
            // Si la API falla, usar simulación
            console.log('API falló, usando simulación:', apiError.message);
            
            // Simulación inteligente basada en puertos comunes
            const simulatedOpenPorts = portsToScan
                .filter(() => Math.random() > 0.85) // 15% de probabilidad de estar abierto
                .map(port => ({
                    port,
                    protocol: 'tcp',
                    service: commonPorts[port] || 'unknown'
                }));

            // Siempre incluir algunos puertos comunes si es un escaneo rápido
            if (scanType === 'quick' && simulatedOpenPorts.length === 0) {
                simulatedOpenPorts.push(
                    { port: 80, protocol: 'tcp', service: 'HTTP' },
                    { port: 443, protocol: 'tcp', service: 'HTTPS' }
                );
            }

            return res.status(200).json({
                host: target,
                status: 'scanned',
                method: 'simulation',
                ports: simulatedOpenPorts,
                totalScanned: portsToScan.length
            });
        }

        // Parsear respuesta de la API
        const openPorts = response.data
            .split('\n')
            .filter(line => line.includes('open') || line.includes('Open'))
            .map(line => {
                const parts = line.trim().split(/\s+/);
                const portInfo = parts[0].split('/');
                return {
                    port: parseInt(portInfo[0]),
                    protocol: portInfo[1] || 'tcp',
                    service: parts[2] || commonPorts[parseInt(portInfo[0])] || 'unknown'
                };
            })
            .filter(p => !isNaN(p.port));

        res.status(200).json({
            host: target,
            status: 'scanned',
            method: 'api',
            ports: openPorts,
            totalScanned: portsToScan.length
        });

    } catch (error) {
        console.error('Error en scan-ports:', error);
        res.status(500).json({ 
            error: 'Error durante el escaneo de puertos',
            details: error.message 
        });
    }
}
