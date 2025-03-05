export function validateEnv() {
  const required = [
    'QSTASH_TOKEN',
    'QSTASH_CURRENT_SIGNING_KEY',
    'QSTASH_NEXT_SIGNING_KEY',
    'API_URL'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate API_URL format
  try {
    new URL(process.env.API_URL!);
  } catch {
    throw new Error('API_URL must be a valid URL');
  }
} 