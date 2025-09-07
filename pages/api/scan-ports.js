import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests allowed' });
    }

    const { target } = req.body;

    if (!target) {
        return res.status(400).json({ error: 'La URL del objetivo es requerida' });
    }

    try {
        const response = await axios.get(`https://api.hackertarget.com/nmap/?q=${target}`);
        
        // The API returns plain text, so we'll parse it to find open ports.
        const openPorts = response.data
            .split('\n')
            .filter(line => line.includes('open'))
            .map(line => {
                const parts = line.split('/');
                return {
                    port: parseInt(parts[0]),
                    protocol: parts[1],
                    service: parts[2]
                };
            });

        res.status(200).json({
            host: target,
            status: 'scanned',
            ports: openPorts
        });

    } catch (error) {
        console.error(error);
        // It's possible the API requires a key now, or the request failed for other reasons.
        if (error.response && error.response.data && error.response.data.includes('key required')) {
            return res.status(500).json({ error: 'La API de HackerTarget ahora requiere una clave de API.' });
        }
        res.status(500).json({ error: 'Ocurrió un error durante el escaneo de puertos.' });
    }
}