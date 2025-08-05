const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import Supabase langsung (PERBAIKAN)
const supabase = require('./supabase');

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
// const chatRoutes = require('./routes/chat'); // Comment dulu jika belum ada

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
// app.use('/api/chat', chatRoutes); // Comment dulu

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: '🚀 MultiApps Backend Server is running!',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    features: [
      '✅ Authentication with Supabase',
      '✅ Role-based Authorization',
      '✅ Password Reset',
      '✅ Admin Panel',
      '✅ User Management',
      '✅ Supabase Database'
    ]
  });
});

// Health check route
app.get('/health', async (req, res) => {
  try {
    // Test Supabase connection instead of Sequelize
    const supabase = require('./supabase');
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    res.json({
      status: 'OK',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: error ? 'Disconnected' : 'Connected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'Disconnected',
      error: error.message
    });
  }
});

// Test database connection
app.get('/test-db', async (req, res) => {
  try {
    const supabase = require('./supabase');
    
    // Test connection dengan query sederhana
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
      
    const { data: chats, error: chatError } = await supabase
      .from('chats')
      .select('count')
      .limit(1);
    
    if (profileError && chatError) {
      throw new Error('Database connection failed');
    }
    
    res.json({ 
      message: '✅ Supabase connection successful!',
      database: 'Supabase Connected',
      stats: {
        profiles_table: profileError ? 'Error' : 'OK',
        chats_table: chatError ? 'Error' : 'OK'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: '❌ Database connection failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start server
const startServer = async () => {
  try {
    // Test Supabase connection
    const supabase = require('./supabase');
    const { error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.log('⚠️ Supabase connection warning:', error.message);
    } else {
      console.log('✅ Supabase connected successfully');
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔍 Test DB: http://localhost:${PORT}/test-db`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;