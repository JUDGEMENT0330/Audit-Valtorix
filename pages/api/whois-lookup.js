import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests allowed' });
    }

    const { target } = req.body;

    if (!target) {
        return res.status(400).json({ error: 'El dominio es requerido' });
    }

    // Limpiar dominio
    const cleanDomain = target.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0];

    try {
        // Usar API pública de WHOIS
        const whoisResponse = await axios.get(
            `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=at_00000000000000000000000000000&domainName=${cleanDomain}&outputFormat=JSON`,
            { timeout: 10000 }
        );

        let results = {
            domain: cleanDomain,
            timestamp: new Date().toISOString(),
            whoisData: null,
            parsedData: {},
            rawData: null
        };

        // Intentar con API alternativa gratuita
        try {
            const response = await axios.get(
                `https://api.ip2whois.com/v2?key=free&domain=${cleanDomain}`,
                { timeout: 10000 }
            );

            if (response.data) {
                results.whoisData = response.data;
                results.parsedData = {
                    registrar: response.data.registrar?.name || 'N/A',
                    registrarUrl: response.data.registrar?.url || 'N/A',
                    createdDate: response.data.create_date || 'N/A',
                    updatedDate: response.data.update_date || 'N/A',
                    expiryDate: response.data.expire_date || 'N/A',
                    status: response.data.domain_status || [],
                    nameServers: response.data.nameservers || [],
                    registrant: {
                        organization: response.data.registrant?.organization || 'N/A',
                        country: response.data.registrant?.country || 'N/A',
                        state: response.data.registrant?.state || 'N/A',
                        city: response.data.registrant?.city || 'N/A'
                    },
                    dnssec: response.data.dnssec || 'N/A'
                };

                // Calcular días hasta expiración
                if (results.parsedData.expiryDate && results.parsedData.expiryDate !== 'N/A') {
                    const expiryDate = new Date(results.parsedData.expiryDate);
                    const today = new Date();
                    const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
                    results.parsedData.daysUntilExpiry = daysUntilExpiry;

                    if (daysUntilExpiry < 30) {
                        results.parsedData.expiryWarning = '⚠️ El dominio expira en menos de 30 días';
                    } else if (daysUntilExpiry < 90) {
                        results.parsedData.expiryWarning = '⚠️ El dominio expira en menos de 90 días';
                    }
                }
            }
        } catch (apiError) {
            console.log('Error con API de WHOIS:', apiError.message);
            
            // Simulación de datos WHOIS para demostración
            results.note = 'Datos de demostración - Para información real usa APIs de pago';
            results.parsedData = {
                registrar: 'Registrar Name, Inc.',
                registrarUrl: 'https://www.registrar.com',
                createdDate: '2020-01-15T00:00:00Z',
                updatedDate: '2024-01-15T00:00:00Z',
                expiryDate: '2025-01-15T00:00:00Z',
                status: ['clientTransferProhibited', 'clientUpdateProhibited'],
                nameServers: ['ns1.example.com', 'ns2.example.com'],
                registrant: {
                    organization: 'Privacy Protected',
                    country: 'US',
                    state: 'CA',
                    city: 'San Francisco'
                },
                dnssec: 'unsigned',
                daysUntilExpiry: 68
            };
        }

        // Información adicional del dominio
        try {
            const dnsCheck = await axios.get(
                `https://dns.google/resolve?name=${cleanDomain}&type=A`,
                { timeout: 5000 }
            );

            if (dnsCheck.data.Answer) {
                results.dnsInfo = {
                    ipAddresses: dnsCheck.data.Answer.map(a => a.data),
                    hasIPv4: true
                };
            }
        } catch (dnsError) {
            results.dnsInfo = { error: 'No se pudo resolver el dominio' };
        }

        res.status(200).json(results);

    } catch (error) {
        console.error('Error en WHOIS lookup:', error);
        res.status(500).json({ 
            error: 'Error durante la consulta WHOIS',
            details: error.message,
            note: 'Las APIs de WHOIS públicas tienen limitaciones. Para producción usa APIs de pago como WhoisXML API o DomainTools.'
        });
    }
}
