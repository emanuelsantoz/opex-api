const express = require('express');
const cors = require('cors');
const { createServer } = require('http');

const app = express();
app.use(cors());
app.use(express.json());

// Next.js-style types
interface NextApiRequest {
  method: string;
  path: string;
  params: Record<string, string>;
  query: Record<string, any>;
  body: any;
}

interface NextApiResponse {
  statusCode: number;
  status(code: number): NextApiResponse;
  json(data: any): NextApiResponse;
  setHeader(name: string, value: string): NextApiResponse;
}

// Load route handlers
function loadHandler(filePath: string) {
  return require(filePath).default;
}

// Simple router for API routes
const routes: Record<string, string> = {
  '/api/lancamentos': './api/lancamentos/index',
  '/api/lancamentos/aprovar': './api/lancamentos/aprovar/index',
  '/api/categorias': './api/categorias/index',
  '/api/auth/usuarios': './api/auth/usuarios/index',
};

app.use(async (req: NextApiRequest, res: NextApiResponse, next: any) => {
  const handler = routes[req.path];
  if (!handler) return next();

  const fullHandler = loadHandler(handler);
  await fullHandler(req, res);
});

// Dynamic [id] route
app.use('/api/lancamentos/:id', async (req: NextApiRequest, res: NextApiResponse, next: any) => {
  try {
    const handler = loadHandler('./api/lancamentos/[id]/index');
    req.query.id = req.params.id;
    await handler(req, res);
  } catch (e) {
    next();
  }
});

const server = createServer(app);
server.listen(3001, () => {
  console.log('Server running at http://localhost:3001');
  console.log('Press Ctrl+C to stop');
});