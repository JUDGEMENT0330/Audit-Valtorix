import axios from 'axios';

const recordTypes = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'SOA'];

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests allowed' });
    }

    const { target } = req.body;

    if (!target) {
        return res.status(400).json({ error: 'El dominio del objetivo es requerido' });
    }

    try {
        const promises = recordTypes.map(type => 
            axios.get(`https://dns.google/resolve?name=${target}&type=${type}`)
        );

        const responses = await Promise.all(promises);

        const results = {};
        responses.forEach((response, index) => {
            const type = recordTypes[index];
            if (response.data.Answer) {
                results[type] = response.data.Answer.map(ans => ans.data);
            }
        });

        res.status(200).json(results);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ocurrió un error durante la búsqueda de DNS.' });
    }
}
