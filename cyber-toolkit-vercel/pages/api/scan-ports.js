import portscanner from 'portscanner';

// This function checks a single port and returns a Promise
const checkPort = (port, host) => {
    return new Promise((resolve, reject) => {
        portscanner.checkPortStatus(port, host, (error, status) => {
            if (error) {
                // Resolve with a closed status on error, as we can't determine if it's open
                return resolve({ port, status: 'closed' });
            }
            resolve({ port, status });
        });
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
