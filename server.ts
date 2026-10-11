import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
    const app = express();
    const server = http.createServer(app);
    const PORT = 3000;

    app.use(express.json());

    // Health check
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok' });
    });

    // Vite middleware for development vs static build in production
    if (process.env.NODE_ENV !== 'production') {
        const vite = await createViteServer({
            server: { middlewareMode: true, hmr: false },
            appType: 'spa',
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    server.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is running at http://0.0.0.0:${PORT}`);
    });
}

startServer();
