import axios from 'axios';
import wappalyzer from 'simple-wappalyzer';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests allowed' });
    }

    const { target } = req.body;

    if (!target) {
        return res.status(400).json({ error: 'La URL del objetivo es requerida' });
    }

    try {
        const response = await axios.get(target, { timeout: 5000 });
        const detections = await wappalyzer({
            url: target,
            headers: response.headers,
            html: response.data
        });

        res.status(200).json({ technologies: detections });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al analizar el sitio web.', details: error.message });
    }
}