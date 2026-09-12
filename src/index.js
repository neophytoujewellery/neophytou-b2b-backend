import { assertEnv } from './config/env.js';

console.log('Neophytou B2B backend — scaffold ready.');
console.log('Run the connection tests with:  npm run test:all');

try {
  assertEnv();
  console.log('✅ All required environment variables are present.');
} catch (err) {
  console.warn('⚠️  ' + err.message);
  console.warn('   Copy .env.example to .env and fill in your values.');
}
