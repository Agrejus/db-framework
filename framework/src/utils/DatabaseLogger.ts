import { GroupLogger, LogLevel } from './GroupLogger';

/**
 * Specialized logger for database operations
 */
export class DatabaseLogger extends GroupLogger {
  constructor(options: any = {}) {
    super({
      collapsed: true, // DB operations are typically verbose, so collapse by default
      level: LogLevel.INFO,
      styles: {
        titleStyle: 'color: #2c3e50; font-weight: bold; font-size: 12px;',
        actionStyle: 'color: #8e44ad; font-weight: bold;',
        ...options.styles
      },
      ...options
    });
  }

  /**
   * Log a database query operation
   */
  logQuery(
    sql: string, 
    params: any[] = [], 
    result?: any, 
    duration?: number
  ) {
    const queryGroup = this.group(`Query: ${sql.substring(0, 40)}${sql.length > 40 ? '...' : ''}`);
    
    queryGroup.log('sql', sql);
    
    if (params && params.length) {
      queryGroup.log('params', params);
    }
    
    if (duration !== undefined) {
      queryGroup.log('duration', `${duration}ms`);
    }
    
    if (result !== undefined) {
      queryGroup.log('result', result);
    }
    
    queryGroup.end();
    return this;
  }

  /**
   * Log a transaction with multiple operations
   */
  logTransaction(name: string, callback: (logger: DatabaseLogger) => void) {
    const transactionGroup = this.group(`Transaction: ${name}`);
    
    try {
      // Allow nested logging operations
      callback(this);
      transactionGroup.success('completed', { status: 'success' });
    } catch (error) {
      transactionGroup.error('failed', error);
      throw error;
    } finally {
      transactionGroup.end();
    }
    
    return this;
  }

  /**
   * Log entity changes (create/update/delete)
   */
  logEntityChange(
    operation: 'create' | 'update' | 'delete', 
    entityName: string, 
    before?: any, 
    after?: any
  ) {
    const operationTitles = {
      create: 'Created',
      update: 'Updated',
      delete: 'Deleted'
    };
    
    const level = operation === 'delete' ? LogLevel.WARNING : LogLevel.INFO;
    const changeGroup = this.group(`Entity ${operationTitles[operation]}: ${entityName}`, level);
    
    if (before) {
      changeGroup.log('before', before);
    }
    
    if (after) {
      changeGroup.log('after', after);
    }
    
    changeGroup.end();
    return this;
  }

  /**
   * Log entity retrieval operations
   */
  logEntityFetch(entityName: string, query: any, result: any, count?: number) {
    const fetchGroup = this.group(`Fetch: ${entityName}`);
    
    fetchGroup.log('query', query);
    
    if (count !== undefined) {
      fetchGroup.log('count', count);
    }
    
    fetchGroup.log('result', result);
    fetchGroup.end();
    return this;
  }

  /**
   * Log database error with context
   */
  logError(operation: string, error: any, context?: any) {
    const errorGroup = this.group(`Error: ${operation}`, LogLevel.ERROR);
    
    errorGroup.error('error', error);
    
    if (context) {
      errorGroup.log('context', context);
    }
    
    errorGroup.log('timestamp', new Date().toISOString());
    errorGroup.end();
    return this;
  }

  /**
   * Log database performance warnings
   */
  logPerformanceWarning(operation: string, duration: number, threshold: number, details?: any) {
    if (duration <= threshold) return this; // Only log if actual warning
    
    const warningGroup = this.group(`Performance Warning: ${operation}`, LogLevel.WARNING);
    
    warningGroup.warn('slow operation', {
      duration: `${duration}ms`,
      threshold: `${threshold}ms`,
      exceededBy: `${Math.round((duration / threshold - 1) * 100)}%`
    });
    
    if (details) {
      warningGroup.log('details', details);
    }
    
    warningGroup.end();
    return this;
  }
}

// Create a default database logger instance
export const dbLogger = new DatabaseLogger();

export default dbLogger; 