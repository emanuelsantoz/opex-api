// Simple local development server
// This wraps the API handlers for local execution without Vercel

const http = require('http');
const url = require('url');
const { execSync } = require('child_process');

// Use ts-node to load handlers
function loadHandler(filePath) {
  const tsNodePath = require.resolve('ts-node');
  const fullPath = require.resolve(filePath);
  const result = execSync(`node -r ts-node/register ${fullPath}`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
  return require(filePath).default;
}

const PORT = 3001;

// Mock auth for development
const mockUser = {
  id: 'dev-user-id',
  nome: 'Dev User',
  email: 'dev@localhost',
  idArea: 'dev-area',
  perfil: 'PLANEJADOR',
  ativo: true
};

function getAuthUser(req) {
  return mockUser;
}

// Lazy load handlers via ts-node
const handlers = {};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  console.log(`${req.method} ${pathname}`);

  // Find handler
  let handler = handlers[pathname];

  // Dynamic route matching for /api/lancamentos/:id
  if (!handler && pathname.startsWith('/api/lancamentos/')) {
    handler = handlers['/api/lancamentos/[id]'];
  }

  if (!handler) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: { message: 'Not Found' } }));
    return;
  }

  // Build mock req/res objects
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    const mockReq = {
      method: req.method,
      query: parsedUrl.query,
      body: body ? JSON.parse(body) : {},
      params: {},
    };

    // Extract ID from pathname if dynamic route
    if (pathname.startsWith('/api/lancamentos/') && pathname !== '/api/lancamentos/aprovar') {
      const id = pathname.split('/')[3];
      if (id) mockReq.params.id = id;
    }

    const mockRes = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        res.writeHead(this.statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
        return this;
      },
      setHeader(name, value) {
        res.setHeader(name, value);
        return this;
      }
    };

    try {
      // Make getAuthUser available
      req.getAuthUser = () => mockUser;
      await handler(mockReq, mockRes);
    } catch (error) {
      console.error('Handler error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: { message: error.message || 'Internal Server Error' }
      }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`   Press Ctrl+C to stop\n`);
});