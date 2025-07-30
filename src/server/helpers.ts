/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt from 'jsonwebtoken';
import { Config } from '../config/index.js';

// Helper functions for JWT creation (still useful for testing or external services)
export async function createJwt(iss?: string, expiryMinutes: number = 1): Promise<string> {
  const payloadData = {
    iss: iss || "paperheadInt",
    exp: Math.floor(Date.now() / 1000) + (expiryMinutes * 60), // expiration in seconds for JWT
  };
  return new Promise((resolve, reject) => {
    jwt.sign(payloadData, Config.server.apiKey, (err, token) => {
      if (err) {
        reject(err);
      } else {
        resolve(token as string);
      }
    });
  });
}

// Create a long-lived JWT for server-to-server communication
export async function createServiceJwt(serviceName: string, expiryDays: number = 365): Promise<string> {
  const payloadData = {
    iss: serviceName,
    type: 'service', // Mark this as a service token
    exp: Math.floor(Date.now() / 1000) + (expiryDays * 24 * 60 * 60), // expiration in seconds
    iat: Math.floor(Date.now() / 1000), // issued at
  };
  return new Promise((resolve, reject) => {
    jwt.sign(payloadData, Config.server.apiKey, (err, token) => {
      if (err) {
        reject(err);
      } else {
        resolve(token as string);
      }
    });
  });
}

// Create a non-expiring JWT (use with extreme caution!)
export async function createPermanentServiceJwt(serviceName: string): Promise<string> {
  const payloadData = {
    iss: serviceName,
    type: 'service-permanent',
    iat: Math.floor(Date.now() / 1000), // issued at
    // Note: No 'exp' field means it never expires
  };
  return new Promise((resolve, reject) => {
    jwt.sign(payloadData, Config.server.apiKey, (err, token) => {
      if (err) {
        reject(err);
      } else {
        resolve(token as string);
      }
    });
  });
}

export async function verifyJwt(token: string): Promise<{ iss: string; exp: number }> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, Config.server.apiKey, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded as { iss: string; exp: number });
      }
    });
  });
}