import axios from 'axios';

// Lista de subdominios comunes para enumerar
const commonSubdomains = [
    'www', 'mail', 'ftp', 'localhost', 'webmail', 'smtp', 'pop', 'ns1', 'webdisk',
    'ns2', 'cpanel', 'whm', 'autodiscover', 'autoconfig', 'admin', 'blog', 'api',
    'dev', 'staging', 'test', 'demo', 'beta', 'shop', 'store', 'mobile', 'm',
    'forum', 'support', 'help', 'docs', 'vpn', 'secure', 'ssl', 'cdn', 'static',
    'media', 'images', 'img', 'downloads', 'files', 'portal', 'dashboard', 'panel',
    'app', 'apps', 'cloud', 'backup', 'db', 'database', 'mysql', 'postgres',
    'redis', 'git', 'gitlab', 'jenkins', 'ci', 'monitoring', 'status', 'stats',
    'analytics', 'metrics', 'logs', 'kibana', 'grafana', 'prometheus', 'alertmanager'
];

const additionalSubdomains = [
    'api-dev', 'api-staging', 'api-prod', 'api-test', 'api-v1', 'api-v2',
    'mail1', 'mail2', 'smtp1', 'smtp2', 'mx1', 'mx2', 'ns3', 'ns4',
    'admin-panel', 'cpanel', 'whm', 'plesk', 'directadmin', 'webmin',
    'remote', 'ssh', 'sftp', 'ftp2', 'ftps', 'www2', 'www3',
    'old', 'new', 'legacy', 'v1', 'v2', 'v3', 'alpha', 'beta', 'gamma',
    'stg', 'uat', 'preprod', 'production', 'development',
    'jenkins', 'bamboo', 'travis', 'circleci', 'drone',
    'docker', 'k8s', 'kubernetes', 'rancher', 'nomad',
    'vault', 'consul', 'etcd', 'zookeeper',
    'elasticsearch', 'logstash', 'kibana', 'grafana', 'prometheus'
];

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests allowed' });
    }

    const { target, mode = 'standard' } = req.body;

    if (!target) {
        return res.status(400).json({ error: 'El dominio es requerido' });
    }

    // Limpiar el dominio de http:// o https://
    const cleanDomain = target.replace(/^https?:\/\//, '').replace(/\/$/, '');

    try {
        // Seleccionar lista de subdominios según el modo
        let subdomainsToCheck = mode === 'extensive' 
            ? [...commonSubdomains, ...additionalSubdomains]
            : commonSubdomains;

        const results = {
            found: [],
            notFound: [],
            errors: [],
            domain: cleanDomain,
            totalChecked: subdomainsToCheck.length
        };

        // Limitar requests simultáneos
        const batchSize = 10;
        for (let i = 0; i < subdomainsToCheck.length; i += batchSize) {
            const batch = subdomainsToCheck.slice(i, i + batchSize);
            
            const promises = batch.map(async (subdomain) => {
                const fullDomain = `${subdomain}.${cleanDomain}`;
                
                try {
                    // Intentar resolver el subdominio usando DNS de Google
                    const dnsResponse = await axios.get(
                        `https://dns.google/resolve?name=${fullDomain}&type=A`,
                        { timeout: 3000 }
                    );

                    if (dnsResponse.data.Answer && dnsResponse.data.Answer.length > 0) {
                        const ips = dnsResponse.data.Answer.map(a => a.data);
                        
                        // Intentar hacer request HTTP para obtener más info
                        let httpStatus = null;
                        let title = null;
                        try {
                            const httpCheck = await axios.get(`https://${fullDomain}`, {
                                timeout: 2000,
                                maxRedirects: 5,
                                validateStatus: () => true
                            });
                            httpStatus = httpCheck.status;
                            
                            // Extraer título de la página
                            const titleMatch = httpCheck.data.match(/<title>(.*?)<\/title>/i);
                            if (titleMatch) {
                                title = titleMatch[1].substring(0, 100);
                            }
                        } catch (httpError) {
                            // Intentar con HTTP si HTTPS falla
                            try {
                                const httpCheck = await axios.get(`http://${fullDomain}`, {
                                    timeout: 2000,
                                    maxRedirects: 5,
                                    validateStatus: () => true
                                });
                                httpStatus = httpCheck.status;
                            } catch {
                                httpStatus = 'No HTTP';
                            }
                        }

                        results.found.push({
                            subdomain: fullDomain,
                            ips: ips,
                            httpStatus: httpStatus,
                            title: title,
                            timestamp: new Date().toISOString()
                        });
                    } else {
                        results.notFound.push(fullDomain);
                    }
                } catch (error) {
                    if (error.response && error.response.data && error.response.data.Status === 3) {
                        // NXDOMAIN - el subdominio no existe
                        results.notFound.push(fullDomain);
                    } else {
                        results.errors.push({
                            subdomain: fullDomain,
                            error: error.message
                        });
                    }
                }
            });

            await Promise.all(promises);
        }

        // Ordenar resultados encontrados por subdominio
        results.found.sort((a, b) => a.subdomain.localeCompare(b.subdomain));

        res.status(200).json({
            ...results,
            summary: {
                total: results.totalChecked,
                found: results.found.length,
                notFound: results.notFound.length,
                errors: results.errors.length
            }
        });

    } catch (error) {
        console.error('Error en subdomain enumeration:', error);
        res.status(500).json({ 
            error: 'Error durante la enumeración de subdominios',
            details: error.message 
        });
    }
}
