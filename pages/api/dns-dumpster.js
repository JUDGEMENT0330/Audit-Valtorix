import axios from 'axios';

const recordTypes = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'SOA', 'CNAME', 'PTR'];

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests allowed' });
    }

    const { target } = req.body;

    if (!target) {
        return res.status(400).json({ error: 'El dominio del objetivo es requerido' });
    }

    try {
        // Usar Google DNS over HTTPS
        const promises = recordTypes.map(async (type) => {
            try {
                const response = await axios.get(
                    `https://dns.google/resolve?name=${target}&type=${type}`,
                    { timeout: 5000 }
                );
                return { type, data: response.data };
            } catch (error) {
                console.error(`Error fetching ${type} records:`, error.message);
                return { type, data: null };
            }
        });

        const responses = await Promise.all(promises);

        const results = {};
        responses.forEach(({ type, data }) => {
            if (data && data.Answer && data.Answer.length > 0) {
                results[type] = data.Answer.map(ans => ({
                    data: ans.data,
                    ttl: ans.TTL,
                    type: ans.type
                }));
            }
        });

        // Agregar información adicional si está disponible
        if (Object.keys(results).length > 0) {
            results.domain = target;
            results.timestamp = new Date().toISOString();
            results.recordCount = Object.values(results)
                .reduce((sum, records) => sum + (Array.isArray(records) ? records.length : 0), 0);
        }

        res.status(200).json(results);

    } catch (error) {
        console.error('Error en DNS lookup:', error);
        res.status(500).json({ 
            error: 'Ocurrió un error durante la búsqueda de DNS',
            details: error.message 
        });
    }
}
