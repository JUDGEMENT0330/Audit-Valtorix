import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests allowed' });
    }

    const { target } = req.body;

    if (!target) {
        return res.status(400).json({ error: 'La URL es requerida' });
    }

    try {
        const response = await axios.get(target, {
            timeout: 10000,
            maxRedirects: 5,
            validateStatus: () => true,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        // Analizar todos los headers
        const allHeaders = response.headers;

        // Headers de seguridad críticos
        const securityHeaders = {
            'strict-transport-security': {
                present: !!allHeaders['strict-transport-security'],
                value: allHeaders['strict-transport-security'] || null,
                description: 'Fuerza el uso de HTTPS',
                recommendation: !allHeaders['strict-transport-security'] 
                    ? 'Agregar: Strict-Transport-Security: max-age=31536000; includeSubDomains' 
                    : '✓ Configurado correctamente',
                severity: !allHeaders['strict-transport-security'] ? 'high' : 'none'
            },
            'content-security-policy': {
                present: !!allHeaders['content-security-policy'],
                value: allHeaders['content-security-policy'] || null,
                description: 'Previene XSS y ataques de inyección',
                recommendation: !allHeaders['content-security-policy']
                    ? 'Agregar CSP para prevenir XSS'
                    : '✓ Configurado',
                severity: !allHeaders['content-security-policy'] ? 'high' : 'none'
            },
            'x-frame-options': {
                present: !!allHeaders['x-frame-options'],
                value: allHeaders['x-frame-options'] || null,
                description: 'Previene clickjacking',
                recommendation: !allHeaders['x-frame-options']
                    ? 'Agregar: X-Frame-Options: DENY o SAMEORIGIN'
                    : '✓ Configurado',
                severity: !allHeaders['x-frame-options'] ? 'medium' : 'none'
            },
            'x-content-type-options': {
                present: !!allHeaders['x-content-type-options'],
                value: allHeaders['x-content-type-options'] || null,
                description: 'Previene MIME sniffing',
                recommendation: !allHeaders['x-content-type-options']
                    ? 'Agregar: X-Content-Type-Options: nosniff'
                    : '✓ Configurado',
                severity: !allHeaders['x-content-type-options'] ? 'medium' : 'none'
            },
            'x-xss-protection': {
                present: !!allHeaders['x-xss-protection'],
                value: allHeaders['x-xss-protection'] || null,
                description: 'Habilita filtro XSS del navegador',
                recommendation: !allHeaders['x-xss-protection']
                    ? 'Agregar: X-XSS-Protection: 1; mode=block'
                    : '✓ Configurado',
                severity: !allHeaders['x-xss-protection'] ? 'low' : 'none'
            },
            'referrer-policy': {
                present: !!allHeaders['referrer-policy'],
                value: allHeaders['referrer-policy'] || null,
                description: 'Controla información del referrer',
                recommendation: !allHeaders['referrer-policy']
                    ? 'Agregar: Referrer-Policy: no-referrer o strict-origin-when-cross-origin'
                    : '✓ Configurado',
                severity: !allHeaders['referrer-policy'] ? 'low' : 'none'
            },
            'permissions-policy': {
                present: !!allHeaders['permissions-policy'],
                value: allHeaders['permissions-policy'] || null,
                description: 'Controla features del navegador',
                recommendation: !allHeaders['permissions-policy']
                    ? 'Considerar agregar Permissions-Policy'
                    : '✓ Configurado',
                severity: 'none'
            }
        };

        // Headers informativos
        const informativeHeaders = {
            'server': allHeaders['server'] || 'No revelado',
            'x-powered-by': allHeaders['x-powered-by'] || 'No revelado',
            'content-type': allHeaders['content-type'] || 'N/A',
            'content-length': allHeaders['content-length'] || 'N/A',
            'cache-control': allHeaders['cache-control'] || 'N/A',
            'connection': allHeaders['connection'] || 'N/A',
            'date': allHeaders['date'] || 'N/A',
            'etag': allHeaders['etag'] || 'N/A',
            'expires': allHeaders['expires'] || 'N/A',
            'last-modified': allHeaders['last-modified'] || 'N/A',
            'vary': allHeaders['vary'] || 'N/A'
        };

        // Headers potencialmente peligrosos (revelan información)
        const dangerousHeaders = [];
        if (allHeaders['server']) {
            dangerousHeaders.push({
                header: 'Server',
                value: allHeaders['server'],
                risk: 'Revela información del servidor',
                recommendation: 'Ocultar o generalizar'
            });
        }
        if (allHeaders['x-powered-by']) {
            dangerousHeaders.push({
                header: 'X-Powered-By',
                value: allHeaders['x-powered-by'],
                risk: 'Revela tecnología backend',
                recommendation: 'Eliminar este header'
            });
        }
        if (allHeaders['x-aspnet-version']) {
            dangerousHeaders.push({
                header: 'X-AspNet-Version',
                value: allHeaders['x-aspnet-version'],
                risk: 'Revela versión de ASP.NET',
                recommendation: 'Eliminar este header'
            });
        }

        // Calcular score de seguridad
        let securityScore = 100;
        let deductions = [];

        Object.entries(securityHeaders).forEach(([key, header]) => {
            if (header.severity === 'high' && !header.present) {
                securityScore -= 20;
                deductions.push(`-20: Falta ${key} (crítico)`);
            } else if (header.severity === 'medium' && !header.present) {
                securityScore -= 10;
                deductions.push(`-10: Falta ${key} (medio)`);
            } else if (header.severity === 'low' && !header.present) {
                securityScore -= 5;
                deductions.push(`-5: Falta ${key} (bajo)`);
            }
        });

        dangerousHeaders.forEach(dh => {
            securityScore -= 5;
            deductions.push(`-5: Header peligroso: ${dh.header}`);
        });

        securityScore = Math.max(0, securityScore);

        // Determinar grado de seguridad
        let securityGrade = 'F';
        if (securityScore >= 90) securityGrade = 'A';
        else if (securityScore >= 80) securityGrade = 'B';
        else if (securityScore >= 70) securityGrade = 'C';
        else if (securityScore >= 60) securityGrade = 'D';
        else if (securityScore >= 50) securityGrade = 'E';

        // Cookies analysis
        const cookies = allHeaders['set-cookie'] || [];
        const cookieAnalysis = {
            present: cookies.length > 0,
            count: cookies.length,
            details: cookies.map(cookie => {
                const hasSecure = cookie.includes('Secure');
                const hasHttpOnly = cookie.includes('HttpOnly');
                const hasSameSite = cookie.includes('SameSite');
                
                return {
                    value: cookie.split(';')[0],
                    secure: hasSecure,
                    httpOnly: hasHttpOnly,
                    sameSite: hasSameSite,
                    warnings: [
                        ...(!hasSecure ? ['⚠️ Falta flag Secure'] : []),
                        ...(!hasHttpOnly ? ['⚠️ Falta flag HttpOnly'] : []),
                        ...(!hasSameSite ? ['⚠️ Falta flag SameSite'] : [])
                    ]
                };
            })
        };

        const results = {
            url: target,
            status: response.status,
            statusText: response.statusText,
            timestamp: new Date().toISOString(),
            
            securityHeaders,
            informativeHeaders,
            dangerousHeaders,
            cookieAnalysis,
            
            securityScore,
            securityGrade,
            deductions,
            
            allHeaders: Object.entries(allHeaders).map(([key, value]) => ({
                name: key,
                value: value
            })),
            
            recommendations: [
                ...Object.entries(securityHeaders)
                    .filter(([, h]) => h.severity !== 'none')
                    .map(([, h]) => h.recommendation),
                ...dangerousHeaders.map(dh => dh.recommendation)
            ].filter(r => !r.startsWith('✓'))
        };

        res.status(200).json(results);

    } catch (error) {
        console.error('Error en header analysis:', error);
        
        let errorMessage = 'Error durante el análisis de headers';
        if (error.code === 'ENOTFOUND') {
            errorMessage = 'Dominio no encontrado';
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Conexión rechazada';
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Tiempo de espera agotado';
        }
        
        res.status(500).json({ 
            error: errorMessage,
            details: error.message 
        });
    }
}
