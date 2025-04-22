/**
 * Logger module - exports all logging components for easy imports
 */

// Import all components
import { GroupLogger, GroupLoggerInstance, LogLevel, logger } from './GroupLogger';
import { DatabaseLogger, dbLogger } from './DatabaseLogger';

// Re-export everything from the modules
export { 
  GroupLogger, 
  GroupLoggerInstance, 
  LogLevel, 
  logger 
};

export { 
  DatabaseLogger, 
  dbLogger 
};

// Convenience function to create a logger with default options
export function createLogger(options = {}) {
  return new GroupLogger(options);
}

// Export everything as a default object for convenient importing
const loggerUtils = {
  // Base components
  GroupLogger,
  LogLevel,
  logger,
  
  // Database components
  DatabaseLogger,
  dbLogger,
  
  // Helpers
  createLogger
};

export default loggerUtils; 