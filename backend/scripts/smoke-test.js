const url = process.env.API_URL || process.env.BACKEND_URL || 'http://localhost:3001';

async function checkHealth() {
  const res = await fetch(`${url}/health`, { cache: 'no-store' });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Health endpoint returned ${res.status}: ${text}`);
  }
  const data = JSON.parse(text);
  if (data.status !== 'ok') {
    throw new Error(`Health endpoint returned unexpected json: ${text}`);
  }
  console.log('Health check passed');
}

async function run() {
  try {
    await checkHealth();
    console.log('Smoke test completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Smoke test failed:', err);
    process.exit(1);
  }
}

run();
