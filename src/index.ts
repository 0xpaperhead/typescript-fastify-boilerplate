/* eslint-disable no-console */
import 'dotenv/config'
import { startServer } from './server/index.js';

// Initialize and start the server
async function main() {
    try {
        console.log("🚀 Starting server...");
        console.log(`📅 Startup Time: ${new Date().toLocaleString()}`);
        console.log(`💾 Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
        
        // Environment checks
        const requiredEnvVars = [
            'INTERNAL_API_KEY'
        ];
        
        console.log("\n🔐 ENVIRONMENT VALIDATION:");
        requiredEnvVars.forEach(envVar => {
            const isSet = !!process.env[envVar];
            console.log(`   ${isSet ? '✅' : '❌'} ${envVar}: ${isSet ? 'Configured' : 'Missing'}`);
        });
        
        const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
        if (missingVars.length > 0) {
            console.log(`\n🚨 Missing required environment variables: ${missingVars.join(', ')}`);
            console.log('Please check your .env file and ensure all required variables are set.');
            process.exit(1);
        }

        // Start the server
        startServer();
        
        console.log("\n✅ SYSTEM READY");
        console.log("─".repeat(50));
        
    } catch (error) {
        console.error("\n🚨 STARTUP FAILED:");
        console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
        
        if (error instanceof Error && error.stack) {
            console.error("\n📋 Stack Trace:");
            console.error(error.stack);
        }
        
        process.exit(1);
    }
}

main().catch(console.error);