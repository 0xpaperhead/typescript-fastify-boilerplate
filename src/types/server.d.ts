// Fastify-specific types are now handled in the server/index.ts file
// This file can be used for other custom types if needed

export interface Payload {
    iss: string;
    exp: number;
}