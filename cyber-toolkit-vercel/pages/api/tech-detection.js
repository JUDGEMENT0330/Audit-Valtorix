import axios from 'axios';

const technologies = [
    { name: 'Next.js', headers: { 'x-powered-by': /next.js/i } },
    { name: 'React', html: /<[^>]+data-reactroot/i },
    { name: 'jQuery', html: /jquery\.js/i },
    { name: 'Nginx', headers: { 'server': /nginx/i } },
    { name: 'Apache', headers: { 'server': /apache/i } },
    { name: 'Vercel', headers: { 'server': /vercel/i } },
];

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
        const detectedTechnologies = [];

        for (const tech of technologies) {
            if (tech.headers) {
                for (const header in tech.headers) {
                    if (response.headers[header] && response.headers[header].match(tech.headers[header])) {
                        detectedTechnologies.push(tech.name);
                    }
                }
            }

            if (tech.html) {
                if (response.data.match(tech.html)) {
                    detectedTechnologies.push(tech.name);
                }
            }
        }

        res.status(200).json({ technologies: [...new Set(detectedTechnologies)] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al analizar el sitio web.', details: error.message });
    }
}
