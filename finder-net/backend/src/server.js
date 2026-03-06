/**
 * Finder-Net Backend Server
 * Main entry point for the Express application
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Import database
const { connectDB } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const itemRoutes = require('./routes/item.routes');
const adminRoutes = require('./routes/admin.routes');
const chatRoutes = require('./routes/chat.routes');
const matchRoutes = require('./routes/match.routes');

// Import socket handler
const socketHandler = require('./socket/socketHandler');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware Configuration
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// HTTP request logger - use 'combined' in production for access logs, 'dev' in development
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Trust proxy (needed behind nginx/load balancer)
app.set('trust proxy', 1);

// Serve uploaded files statically (for development without Cloudinary)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Database Connection
connectDB();

// Socket.io Configuration
socketHandler(io);
app.set('io', io);

// Health Check Route
app.get('/health', async (req, res) => {
  try {
    const { supabase } = require('./config/database');
    const { error } = await supabase.from('users').select('id').limit(1);
    res.status(200).json({
      status: 'success',
      message: 'Finder-Net API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      database: error ? 'disconnected' : 'connected',
      uptime: process.uptime()
    });
  } catch {
    res.status(503).json({ status: 'error', message: 'Service unhealthy' });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/match', matchRoutes);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Global Error Handler
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║   🚀 Finder-Net Server Running        ║
  ║   📡 Port: ${PORT}                       ║
  ║   🌍 Environment: ${process.env.NODE_ENV || 'development'}          ║
  ║   🔗 URL: http://localhost:${PORT}     ║
  ║   🗄️  Database: Supabase (PostgreSQL)  ║
  ╚════════════════════════════════════════╝
  `);
});

// Graceful Shutdown
const gracefulShutdown = (signal) => {
  console.log(`${signal} signal received: closing HTTP server`);
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  // Force shutdown after 30s
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled rejection / exception handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

module.exports = { app, server, io };
