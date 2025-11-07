import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests allowed' });
    }

    const { target } = req.body;

    if (!target) {
        return res.status(400).json({ error: 'La URL es requerida' });
    }

    // Limpiar URL
    const cleanUrl = target.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const httpsUrl = `https://${cleanUrl}`;

    try {
        const results = {
            url: cleanUrl,
            ssl: {
                enabled: false,
                valid: false,
                issuer: null,
                validFrom: null,
                validTo: null,
                daysRemaining: null,
                protocol: null,
                cipher: null
            },
            securityHeaders: {},
            httpResponse: null,
            redirect: null,
            timestamp: new Date().toISOString()
        };

        // Intentar conexión HTTPS
        try {
            const response = await axios.get(httpsUrl, {
                timeout: 10000,
                maxRedirects: 5,
                validateStatus: () => true,
                httpsAgent: new (require('https').Agent)({
                    rejectUnauthorized: false // Para poder analizar certificados inválidos
                })
            });

            results.ssl.enabled = true;
            results.httpResponse = {
                status: response.status,
                statusText: response.statusText
            };

            // Analizar headers de seguridad
            const securityHeaders = {
                'Strict-Transport-Security': response.headers['strict-transport-security'] || null,
                'Content-Security-Policy': response.headers['content-security-policy'] || null,
                'X-Frame-Options': response.headers['x-frame-options'] || null,
                'X-Content-Type-Options': response.headers['x-content-type-options'] || null,
                'X-XSS-Protection': response.headers['x-xss-protection'] || null,
                'Referrer-Policy': response.headers['referrer-policy'] || null,
                'Permissions-Policy': response.headers['permissions-policy'] || null
            };

            results.securityHeaders = securityHeaders;

            // Calcular score de seguridad
            let securityScore = 0;
            if (securityHeaders['Strict-Transport-Security']) securityScore += 20;
            if (securityHeaders['Content-Security-Policy']) securityScore += 20;
            if (securityHeaders['X-Frame-Options']) securityScore += 15;
            if (securityHeaders['X-Content-Type-Options']) securityScore += 15;
            if (securityHeaders['X-XSS-Protection']) securityScore += 10;
            if (securityHeaders['Referrer-Policy']) securityScore += 10;
            if (securityHeaders['Permissions-Policy']) securityScore += 10;

            results.securityScore = securityScore;

            // Verificar si hay redirección
            if (response.request?.res?.responseUrl !== httpsUrl) {
                results.redirect = {
                    from: httpsUrl,
                    to: response.request.res.responseUrl
                };
            }

        } catch (error) {
            if (error.code === 'ENOTFOUND') {
                return res.status(404).json({ 
                    error: 'Dominio no encontrado',
                    details: 'El dominio no existe o no es accesible'
                });
            } else if (error.code === 'ECONNREFUSED') {
                results.ssl.enabled = false;
                results.error = 'Conexión rechazada - HTTPS no disponible';
            } else {
                results.ssl.enabled = false;
                results.error = error.message;
            }
        }

        // Usar API externa para obtener información SSL más detallada
        try {
            const sslApiResponse = await axios.get(
                `https://api.ssllabs.com/api/v3/analyze?host=${cleanUrl}&publish=off&all=done`,
                { timeout: 30000 }
            );

            if (sslApiResponse.data && sslApiResponse.data.endpoints) {
                const endpoint = sslApiResponse.data.endpoints[0];
                if (endpoint) {
                    results.ssl.grade = endpoint.grade;
                    results.ssl.details = {
                        hasWarnings: endpoint.hasWarnings,
                        isExceptional: endpoint.isExceptional,
                        progress: endpoint.progress
                    };
                }
            }
        } catch (apiError) {
            // Si la API de SSL Labs falla, continuar sin esa información
            results.sslLabsNote = 'No se pudo obtener análisis detallado de SSL Labs';
        }

        // Análisis de protocolo TLS
        results.ssl.recommendations = [];
        
        if (!results.ssl.enabled) {
            results.ssl.recommendations.push('❌ HTTPS no está habilitado - CRÍTICO');
        }
        
        if (!results.securityHeaders['Strict-Transport-Security']) {
            results.ssl.recommendations.push('⚠️ Falta header HSTS');
        }
        
        if (!results.securityHeaders['Content-Security-Policy']) {
            results.ssl.recommendations.push('⚠️ Falta Content Security Policy');
        }
        
        if (!results.securityHeaders['X-Frame-Options']) {
            results.ssl.recommendations.push('⚠️ Falta protección contra clickjacking');
        }

        res.status(200).json(results);

    } catch (error) {
        console.error('Error en SSL check:', error);
        res.status(500).json({ 
            error: 'Error durante el análisis SSL',
            details: error.message 
        });
    }
}
