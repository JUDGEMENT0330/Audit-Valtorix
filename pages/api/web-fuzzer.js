import axios from 'axios';

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const wordlists = {
    common: [
        '/admin', '/login', '/dashboard', '/wp-admin', '/administrator', '/backup',
        '/config', '/test', '/dev', '/api', '/uploads', '/files', '/images',
        '/css', '/js', '/robots.txt', '/sitemap.xml', '/.htaccess', '/.env',
        '/config.json', '/package.json', '/phpinfo.php', '/admin.php', '/login.php',
        '/register.php', '/vendor/', '/includes/', '/cgi-bin/', '/.git/', '/.svn/'
    ],
    medium: [
        '/admin', '/login', '/dashboard', '/wp-admin', '/administrator', '/backup',
        '/config', '/test', '/dev', '/api', '/uploads', '/files', '/images',
        '/css', '/js', '/static', '/assets', '/media', '/public', '/private',
        '/robots.txt', '/sitemap.xml', '/.htaccess', '/.env', '/.git/', '/.svn/',
        '/config.json', '/package.json', '/composer.json', '/bower.json',
        '/phpinfo.php', '/admin.php', '/login.php', '/register.php', '/profile.php',
        '/user.php', '/account.php', '/settings.php', '/config.php', '/database.php',
        '/vendor/', '/includes/', '/lib/', '/libs/', '/core/', '/app/', '/src/',
        '/cgi-bin/', '/scripts/', '/tmp/', '/temp/', '/cache/', '/logs/', '/log/',
        '/old/', '/backup/', '/backups/', '/db/', '/sql/', '/data/', '/download/',
        '/downloads/', '/doc/', '/docs/', '/documentation/', '/manual/', '/help/',
        '/faq/', '/about/', '/contact/', '/support/', '/forum/', '/forums/',
        '/search/', '/news/', '/blog/', '/shop/', '/store/', '/cart/', '/checkout/',
        '/payment/', '/paypal/', '/invoice/', '/billing/', '/subscribe/', '/unsubscribe/',
        '/panel/', '/console/', '/cpanel/', '/controlpanel/', '/phpmyadmin/',
        '/adminer/', '/manager/', '/webmail/', '/mail/', '/email/', '/smtp/',
        '/server/', '/status/', '/health/', '/version/', '/info/', '/debug/',
        '/.well-known/security.txt', '/.well-known/change-password',
        '/wp-content/', '/wp-includes/', '/wp-json/', '/xmlrpc.php', '/readme.html',
        '/license.txt', '/changelog.txt', '/install.php', '/setup.php',
        '/maintenance.php', '/test.php', '/info.php', '/example.php'
    ],
    extensive: [] // Se llenaría con una wordlist más grande en producción
};

// Llenar extensive con medium + adicionales
wordlists.extensive = [
    ...wordlists.medium,
    '/v1/', '/v2/', '/api/v1/', '/api/v2/', '/rest/', '/graphql/', '/swagger/',
    '/docs/', '/documentation/', '/readme/', '/changelog/', '/license/',
    '/security/', '/privacy/', '/terms/', '/tos/', '/policy/', '/policies/',
    '/legal/', '/disclaimer/', '/credits/', '/team/', '/staff/', '/employees/',
    '/jobs/', '/careers/', '/hiring/', '/apply/', '/application/', '/internship/',
    '/events/', '/calendar/', '/schedule/', '/booking/', '/reservation/', '/appointment/',
    '/gallery/', '/photos/', '/video/', '/videos/', '/stream/', '/streaming/',
    '/podcast/', '/podcasts/', '/radio/', '/tv/', '/live/', '/broadcast/',
    '/social/', '/facebook/', '/twitter/', '/instagram/', '/linkedin/', '/youtube/',
    '/feed/', '/feeds/', '/rss/', '/xml/', '/json/', '/csv/', '/export/',
    '/import/', '/migrate/', '/transfer/', '/sync/', '/webhook/', '/hooks/',
    '/cron/', '/tasks/', '/jobs/', '/queue/', '/worker/', '/batch/', '/scheduled/',
    '/analytics/', '/stats/', '/statistics/', '/metrics/', '/monitor/', '/monitoring/',
    '/report/', '/reports/', '/reporting/', '/dashboard/', '/charts/', '/graphs/',
    '/survey/', '/surveys/', '/poll/', '/polls/', '/vote/', '/voting/', '/quiz/',
    '/form/', '/forms/', '/submission/', '/submissions/', '/feedback/', '/review/',
    '/rating/', '/ratings/', '/comment/', '/comments/', '/discussion/', '/discussions/'
];

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests allowed' });
    }

    const { target, wordlist = 'common', extensions = 'php,html,js,txt' } = req.body;

    if (!target) {
        return res.status(400).json({ error: 'La URL del objetivo es requerida' });
    }

    // Seleccionar wordlist
    const paths = wordlists[wordlist] || wordlists.common;
    
    // Procesar extensiones
    const exts = extensions ? extensions.split(',').map(e => e.trim()) : [];

    const results = {
        found: [],
        notFound: [],
        errors: [],
        totalTested: 0
    };

    // Generar lista completa de URLs a probar
    let urlsToTest = [...paths];
    
    // Agregar variaciones con extensiones
    if (exts.length > 0) {
        const withExtensions = paths.flatMap(path => {
            // Solo agregar extensiones a paths que no las tienen
            if (!path.includes('.') && !path.endsWith('/')) {
                return exts.map(ext => `${path}.${ext}`);
            }
            return [];
        });
        urlsToTest = [...urlsToTest, ...withExtensions];
    }

    results.totalTested = urlsToTest.length;

    // Limitar el número de solicitudes para evitar sobrecarga
    const maxRequests = Math.min(urlsToTest.length, 50);
    const urlsToTestLimited = urlsToTest.slice(0, maxRequests);

    const promises = urlsToTestLimited.map(async (path) => {
        const url = `${target.replace(/\/$/, '')}${path}`;
        try {
            const response = await axios.get(url, {
                timeout: 5000,
                validateStatus: () => true, // No lanzar error en ningún status
                headers: { 
                    'User-Agent': userAgent,
                    'Accept': '*/*',
                    'Connection': 'keep-alive'
                },
                maxRedirects: 0 // No seguir redirects
            });

            const contentLength = response.headers['content-length'] || 
                                (response.data ? response.data.length : 0);

            if (response.status >= 200 && response.status < 400) {
                results.found.push({ 
                    path: url, 
                    status: response.status,
                    size: contentLength,
                    contentType: response.headers['content-type'] || 'unknown'
                });
            } else if (response.status === 401 || response.status === 403) {
                // Recursos protegidos también son interesantes
                results.found.push({ 
                    path: url, 
                    status: response.status,
                    size: contentLength,
                    contentType: response.headers['content-type'] || 'protected'
                });
            } else {
                results.notFound.push({ 
                    path: url, 
                    status: response.status 
                });
            }
        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                results.errors.push({ path: url, error: 'Timeout' });
            } else if (error.response) {
                // El servidor respondió con un código de estado fuera del rango 2xx
                results.notFound.push({ 
                    path: url, 
                    status: error.response.status 
                });
            } else {
                results.errors.push({ 
                    path: url, 
                    error: error.message 
                });
            }
        }
    });

    await Promise.all(promises);

    // Ordenar resultados por código de estado
    results.found.sort((a, b) => a.status - b.status);

    res.status(200).json({
        ...results,
        testedUrls: maxRequests,
        possibleUrls: urlsToTest.length,
        wordlist: wordlist,
        extensions: exts
    });
}
