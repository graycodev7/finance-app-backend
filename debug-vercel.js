// Debug script for Vercel serverless function
// This helps identify what's causing the crash

console.log('🔍 VERCEL DEBUG - Starting...');

try {
  console.log('📊 Environment Variables:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('XATA_DATABASE_URL exists:', !!process.env.XATA_DATABASE_URL);
  console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
  console.log('JWT_REFRESH_SECRET exists:', !!process.env.JWT_REFRESH_SECRET);
  
  console.log('📦 Attempting to load app...');
  const app = require('./dist/index.js');
  
  console.log('✅ App loaded successfully');
  console.log('App type:', typeof app);
  console.log('App is function:', typeof app === 'function');
  
  module.exports = app;
  
} catch (error) {
  console.error('❌ ERROR loading app:', error.message);
  console.error('Stack:', error.stack);
  
  // Return a simple error handler
  module.exports = (req, res) => {
    res.status(500).json({
      error: 'Server initialization failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  };
}
