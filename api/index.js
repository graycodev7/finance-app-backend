// Vercel Serverless Function Entry Point
// This file exports the compiled Express app for Vercel

const app = require('../dist/index.js');

module.exports = app;
