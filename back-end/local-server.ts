// Simple local development server using ts-node
import * as http from 'http';
import * as url from 'url';

const PORT = 3001;

// Mock auth for development
const mockUser = {
  id: 'dev-user-id',
  nome: 'Dev User',
  email: 'dev@localhost',
  idArea: 'dev-area',
  perfil: 'PLANEJADOR' as const,
  ativo: true
};

// Load handlers dynamically
async function loadHandler(filePath: string) {
  const handler = await import(filePath);
  return handler.default;
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url || '', true);
  const pathname = parsedUrl.pathname;

  console.log(`${req.method} ${pathname}`);

  // Map routes to files
  const routeMap: Record<string, string> = {
    '/api/lancamentos': './api/lancamentos/index',
    '/api/lancamentos/aprovar': './api/lancamentos/aprovar/index',
    '/api/categorias': './api/categorias/index',
  };

  // Dynamic [id] route
  let handlerPath = routeMap[pathname || ''];
  if (!handlerPath && pathname?.startsWith('/api/lancamentos/') && pathname !== '/api/lancamentos/aprovar') {
    handlerPath = './api/lancamentos/[id]/index';
  }

  if (!handlerPath) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: { message: 'Not Found' } }));
    return;
  }

  // Read body
  let body = '';
  for await (const chunk of req) {
    body += chunk;
  }

  // Build mock request/response objects
  const mockReq = {
    method: req.method || 'GET',
    query: parsedUrl.query,
    body: body ? JSON.parse(body) : {},
    params: {} as Record<string, string>,
  };

  // Extract ID for dynamic routes
  if (pathname?.startsWith('/api/lancamentos/') && pathname !== '/api/lancamentos/aprovar') {
    const parts = pathname.split('/');
    if (parts[3]) mockReq.params.id = parts[3];
  }

  const mockRes = {
    statusCode: 200,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      res.writeHead(this.statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      return this;
    },
    setHeader(name: string, value: string) {
      res.setHeader(name, value);
      return this;
    }
  };

  try {
    const handler = await loadHandler(handlerPath);
    await handler(mockReq as any, mockRes as any);
  } catch (error: any) {
    console.error('Handler error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: { message: error?.message || 'Internal Server Error' }
    }));
  }
});

server.listen(PORT, () => {
  console.log(`\n  Server running at http://localhost:${PORT}`);
  console.log(`  Press Ctrl+C to stop\n`);
});