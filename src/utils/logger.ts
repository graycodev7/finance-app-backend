/**
 * Production-ready logger utility
 * Handles different log levels based on environment
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn', 
  INFO = 'info',
  DEBUG = 'debug'
}

class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (data && this.isDevelopment) {
      return `${baseMessage} ${JSON.stringify(data, null, 2)}`;
    }
    
    return baseMessage;
  }

  error(message: string, error?: any): void {
    if (this.isProduction) {
      // In production, log errors without sensitive data
      console.error(this.formatMessage(LogLevel.ERROR, message));
      if (error?.message) {
        console.error(`Error details: ${error.message}`);
      }
    } else {
      // In development, show full error details
      console.error(this.formatMessage(LogLevel.ERROR, message, error));
    }
  }

  warn(message: string, data?: any): void {
    if (!this.isProduction) {
      console.warn(this.formatMessage(LogLevel.WARN, message, data));
    }
  }

  info(message: string, data?: any): void {
    if (!this.isProduction) {
      console.log(this.formatMessage(LogLevel.INFO, message, data));
    }
  }

  debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, data));
    }
  }

  // Special method for startup messages
  startup(message: string): void {
    console.log(this.formatMessage(LogLevel.INFO, message));
  }
}

export const logger = new Logger();
