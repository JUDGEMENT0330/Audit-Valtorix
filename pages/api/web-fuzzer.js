import axios from 'axios';

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests allowed' });
    }

    const { target } = req.body;

    if (!target) {
        return res.status(400).json({ error: 'La URL del objetivo es requerida' });
    }

    const commonPaths = [
        '/admin', '/login', '/dashboard', '/wp-admin', '/administrator', '/backup',
        '/config', '/test', '/dev', '/api', '/uploads', '/files', '/images',
        '/css', '/js', '/robots.txt', '/sitemap.xml', '/.htaccess', '/.env',
        '/config.json', '/package.json', '/phpinfo.php', '/admin.php', '/login.php',
        '/register.php', '/vendor/', '/includes/', '/cgi-bin/', '/.git/', '/.svn/',
        '/old/', '/temp/', '/tmp/', '/logs/', '/.well-known/security.txt'
    ];

    const results = {
        found: [],
        notFound: [],
        errors: []
    };

    const promises = commonPaths.map(async (path) => {
        const url = `${target.replace(/\/$/, '')}${path}`;
        try {
            const response = await axios.get(url, {
                timeout: 5000,
                validateStatus: () => true,
                headers: { 'User-Agent': userAgent }
            });

            if (response.status >= 200 && response.status < 400) {
                results.found.push({ path: url, status: response.status });
            } else {
                results.notFound.push({ path: url, status: response.status });
            }
        } catch (error) {
            results.errors.push({ path: url, status: 'Error', error: error.message });
        }
    });

    await Promise.all(promises);
    res.status(200).json(results);
}
