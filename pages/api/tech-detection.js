import wappalyzer from 'simple-wappalyzer';
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
        // 1. Fetch the target's HTML and headers
        const response = await axios.get(target, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        // 2. Analyze with simple-wappalyzer
        const results = await wappalyzer({
            url: target,
            html: response.data,
            headers: response.headers,
        });
        
        // The output format is slightly different, let's adapt it to match the old structure
        // so the frontend doesn't break.
        const formattedResults = {
            url: target,
            technologies: results.map(app => ({
                name: app.name,
                slug: app.slug,
                version: app.version || null,
                confidence: app.confidence,
                categories: app.categories.map(cat => ({
                    name: cat.name,
                    slug: cat.slug,
                    id: cat.id
                }))
            }))
        };

        res.status(200).json(formattedResults);

    } catch (error) {
        console.error(error);
        let errorMessage = 'Error al analizar el sitio web.';
        if (error.response) {
            errorMessage = `Error al acceder a la URL: Status ${error.response.status}`;
        } else if (error.request) {
            errorMessage = 'No se pudo contactar con la URL. Verifica el dominio y la conectividad.';
        }
        res.status(500).json({ error: errorMessage, details: error.message });
    }
}