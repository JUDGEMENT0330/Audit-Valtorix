import Wappalyzer from 'wappalyzer';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests allowed' });
    }

    const { target } = req.body;

    if (!target) {
        return res.status(400).json({ error: 'La URL del objetivo es requerida' });
    }

    const wappalyzer = new Wappalyzer();

    try {
        await wappalyzer.init();
        const site = await wappalyzer.open(target);
        const results = await site.analyze();
        await wappalyzer.destroy();
        res.status(200).json(results);
    } catch (error) {
        console.error(error);
        await wappalyzer.destroy();
        res.status(500).json({ error: 'Error al analizar el sitio web.', details: error.message });
    }
}