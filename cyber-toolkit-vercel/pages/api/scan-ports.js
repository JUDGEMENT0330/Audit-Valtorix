import net from 'net';

// This function checks a single port
const checkPort = (port, host) => {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(1500); // 1.5 seconds timeout

        socket.on('connect', () => {
            socket.destroy();
            resolve({ port, status: 'open' });
        });

        socket.on('timeout', () => {
            socket.destroy();
            resolve({ port, status: 'closed' });
        });

        socket.on('error', (err) => {
            // Ignore ECONNREFUSED, it just means the port is closed.
            // Other errors might be more significant but for this simple scanner,
            // we'll treat them as closed.
            socket.destroy();
            resolve({ port, status: 'closed' });
        });

        socket.connect(port, host);
    });
};


export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests allowed' });
    }

    const { target, scanType } = req.body;

    if (!target) {
        return res.status(400).json({ error: 'El objetivo es requerido' });
    }

    // Define port lists
    const quickPorts = [21, 22, 25, 53, 80, 110, 143, 443, 3306, 3389, 5432, 8080, 8443];
    const intensePorts = [...quickPorts, 20, 23, 445, 993, 995, 1433, 1521, 5900, 6379, 27017];
    
    let portsToScan;
    switch (scanType) {
        case 'quick':
            portsToScan = quickPorts;
            break;
        case 'intense':
            portsToScan = intensePorts;
            break;
        case 'all':
            // A full port scan is too slow for a serverless function.
            // We'll limit it to a larger, but still reasonable, list.
            portsToScan = [...new Set([...intensePorts, ...Array.from({length: 1024}, (_, i) => i + 1)])];
            break;
        default:
            portsToScan = quickPorts;
    }

    try {
        const results = await Promise.all(portsToScan.map(port => checkPort(port, target)));
        const openPorts = results.filter(r => r.status === 'open');
        
        // The response structure is simplified compared to the nmap one
        res.status(200).json({
            host: target,
            status: 'scanned',
            ports: openPorts
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ocurrió un error durante el escaneo de puertos.' });
    }
}