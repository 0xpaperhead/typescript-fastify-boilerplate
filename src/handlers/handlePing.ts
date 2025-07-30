import { FastifyRequest, FastifyReply } from 'fastify';
import { Socket } from 'net';

interface PingBody {
  ip_address: string;
}

function tcpPing(host: string, port = 443, timeout = 2000): Promise<number> {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const socket = new Socket();
        
        // Set timeout
        socket.setTimeout(timeout);

        // Handle successful connection
        socket.connect(port, host, () => {
            const endTime = Date.now();
            socket.destroy();
            resolve(endTime - startTime);
        });

        // Handle errors
        socket.on('error', (err) => {
            socket.destroy();
            reject(err);
        });

        // Handle timeout
        socket.on('timeout', () => {
            socket.destroy();
            reject(new Error(`TCP ping timeout on port ${port}`));
        });
    });
}

async function measureLatency(host: string, attempts = 3): Promise<{ avgTime: number, times: number[] }> {
    const times: number[] = [];
    const ports = [443, 80, 22]; // Try HTTPS, HTTP, and SSH ports
    
    for (let i = 0; i < attempts; i++) {
        let succeeded = false;
        
        // Try each port until one succeeds
        for (const port of ports) {
            try {
                const time = await tcpPing(host, port);
                times.push(time);
                succeeded = true;
                break; // Exit port loop if successful
            } catch (error) {
                console.error(`Attempt ${i + 1} on port ${port} failed:`, error);
            }
        }

        if (!succeeded) {
            console.error(`All ports failed for attempt ${i + 1}`);
        }

        // Small delay between attempts
        if (i < attempts - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    if (times.length === 0) {
        throw new Error('All ping attempts failed on all ports');
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    return { avgTime, times };
}

export async function handlePing(request: FastifyRequest<{ Body: PingBody }>, reply: FastifyReply) {
    try {
        const { ip_address } = request.body;

        if (!ip_address) {
            return reply.status(400).send({ error: 'Missing IP address in request body' });
        }

        // Basic IP address validation
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (!ipRegex.test(ip_address)) {
            return reply.status(400).send({ error: 'Invalid IP address format' });
        }

        const result = await measureLatency(ip_address);

        return reply.status(200).send({
            success: true,
            ip: ip_address,
            average_ping_ms: Math.round(result.avgTime),
            individual_times_ms: result.times,
            port_used: 443 // Add information about which port was used
        });

    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
            success: false,
            error: {
                source: 'internal',
                code: '00000',
                message: error instanceof Error ? error.message : 'Internal server error',
                function: 'handlePing'
            }
        });
    }
}