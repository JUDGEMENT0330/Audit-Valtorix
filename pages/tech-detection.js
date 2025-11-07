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
        // Realizar solicitud al objetivo
        const response = await axios.get(target, { 
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            maxRedirects: 5
        });

        // Detectar tecnologías usando Wappalyzer
        const detections = await wappalyzer({
            url: target,
            headers: response.headers,
            html: response.data
        });

        // Enriquecer la respuesta con información adicional
        const enrichedDetections = detections.map(tech => ({
            ...tech,
            confidence: tech.confidence || 100,
            categories: tech.categories || []
        }));

        // Agrupar por categorías
        const groupedByCategory = enrichedDetections.reduce((acc, tech) => {
            tech.categories.forEach(category => {
                if (!acc[category.name]) {
                    acc[category.name] = [];
                }
                if (!acc[category.name].find(t => t.name === tech.name)) {
                    acc[category.name].push(tech);
                }
            });
            return acc;
        }, {});

        // Información adicional del servidor
        const serverInfo = {
            server: response.headers['server'] || 'Unknown',
            poweredBy: response.headers['x-powered-by'] || null,
            contentType: response.headers['content-type'] || 'Unknown',
            responseTime: response.headers['x-response-time'] || null,
            statusCode: response.status
        };

        res.status(200).json({ 
            technologies: enrichedDetections,
            groupedByCategory,
            serverInfo,
            totalDetected: enrichedDetections.length,
            url: target,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error en tech-detection:', error);
        
        // Proporcionar información útil incluso si hay error
        let errorDetails = {
            error: 'Error al analizar el sitio web',
            message: error.message
        };

        if (error.response) {
            errorDetails.statusCode = error.response.status;
            errorDetails.statusText = error.response.statusText;
        } else if (error.code === 'ECONNABORTED') {
            errorDetails.message = 'Timeout al conectar con el sitio web';
        } else if (error.code === 'ENOTFOUND') {
            errorDetails.message = 'Dominio no encontrado';
        }

        res.status(500).json(errorDetails);
    }
}
