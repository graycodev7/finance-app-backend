// Vercel Serverless Function - Root Entry Point
// This ensures Vercel detects the serverless function correctly

const app = require('./dist/index.js');

module.exports = app;
