import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';

const app = express();
const port = process.env.PORT || 3002;

// Security & logging middleware
app.use(helmet());
app.use(express.json());
app.use(morgan('combined'));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

// Echo endpoint (for testing payloads)
app.post('/echo', (req, res) => {
  res.json({
    received: req.body,
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
});

export default app;
