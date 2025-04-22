import { GroupLogger, LogLevel, logger } from './GroupLogger';

/**
 * Demo: Basic usage examples for GroupLogger
 */

// Example 1: Simple state update (redux-logger style)
function demoReduxStyle() {
  console.log('--- REDUX-LOGGER STYLE DEMO ---');
  
  const action = { type: 'UPDATE_USER', payload: { name: 'John Doe', role: 'admin' } };
  const prevState = { 
    user: { name: 'Guest', role: 'user' }, 
    settings: { theme: 'light', notifications: true } 
  };
  const nextState = { 
    ...prevState, 
    user: { ...action.payload } 
  };

  // Use the global instance for simple cases
  const logGroup = logger.group('Action: UPDATE_USER');
  logGroup.log('action', action);
  logGroup.log('prev state', prevState);
  logGroup.log('next state', nextState);
  logGroup.end();

  // Or use the built-in logAction method for even simpler usage
  logger.logAction(
    'Action: UPDATE_USER (simplified)', 
    prevState, 
    nextState
  ).end();
}

// Example 2: Database operations with custom styling
function demoDbOperations() {
  console.log('--- DATABASE OPERATIONS DEMO ---');
  
  // Create a custom logger with collapsed groups
  const dbLogger = new GroupLogger({
    collapsed: true,
    styles: {
      titleStyle: 'color: #8e44ad; font-weight: bold; font-size: 12px;',
      infoStyle: 'color: #3498db; font-weight: bold;'
    }
  });

  // Log a database query
  const queryLogGroup = dbLogger.group('DB Query: findUserById');
  queryLogGroup.log('query', 'SELECT * FROM users WHERE id = ?');
  queryLogGroup.log('params', [1234]);
  queryLogGroup.log('duration', '42ms');
  queryLogGroup.log('result', { id: 1234, name: 'John Doe', email: 'john@example.com' });
  queryLogGroup.end();

  // Log a transaction with multiple operations
  const transactionGroup = dbLogger.group('DB Transaction: updateUserProfile');
  
  // Log sub-operations within the transaction
  const op1 = dbLogger.group('- Update user info');
  op1.log('query', 'UPDATE users SET name = ?, email = ? WHERE id = ?');
  op1.log('params', ['Jane Doe', 'jane@example.com', 1234]);
  op1.log('affected rows', 1);
  op1.end();
  
  const op2 = dbLogger.group('- Update user preferences');
  op2.log('query', 'UPDATE preferences SET theme = ? WHERE user_id = ?');
  op2.log('params', ['dark', 1234]);
  op2.log('affected rows', 1);
  op2.end();
  
  transactionGroup.success('Transaction completed', { 
    duration: '87ms', 
    operations: 2 
  });
  transactionGroup.end();
}

// Example 3: Error handling and different log levels
function demoErrorHandling() {
  console.log('--- ERROR HANDLING DEMO ---');
  
  // Create a logger that will show warnings and errors
  const errorLogger = new GroupLogger({
    level: LogLevel.WARNING
  });

  try {
    // Simulate an operation that fails
    throw new Error('Database connection failed: timeout after 30 seconds');
  } catch (error) {
    const errorGroup = errorLogger.group('Failed Operation', LogLevel.ERROR);
    errorGroup.error('Error details', error);
    errorGroup.log('timestamp', new Date().toISOString());
    errorGroup.log('request id', 'req_123456');
    errorGroup.end();
  }

  // Log a warning
  errorLogger.group('Performance Warning', LogLevel.WARNING)
    .warn('Slow query detected', {
      query: 'SELECT * FROM large_table WHERE complex_condition',
      duration: '5243ms',
      threshold: '1000ms'
    })
    .log('indexes', ['should add index on complex_condition'])
    .end();
}

// Example 4: Entity lifecycle logging
function demoEntityLifecycle() {
  console.log('--- ENTITY LIFECYCLE DEMO ---');
  
  // Logger configured for entity operations
  const entityLogger = new GroupLogger({
    collapsed: true
  });

  // Initial entity creation
  const entity = { 
    id: null, 
    name: 'New Product', 
    price: 29.99, 
    category: 'electronics',
    createdAt: null,
    updatedAt: null
  };

  // Log entity creation
  entityLogger.group('Entity: Product Lifecycle')
    .log('initial', entity)
    .end();

  // Entity after save (with generated values)
  const savedEntity = { 
    ...entity, 
    id: 12345,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Log entity after save
  entityLogger.logAction(
    'Entity: Product Created', 
    entity, 
    savedEntity, 
    LogLevel.SUCCESS
  ).end();

  // Entity after update
  const updatedEntity = { 
    ...savedEntity, 
    price: 24.99, 
    onSale: true,
    updatedAt: new Date().toISOString()
  };

  // Log entity update
  entityLogger.logAction(
    'Entity: Product Updated', 
    savedEntity, 
    updatedEntity
  ).end();
}

// Run all demos
export function runAllDemos() {
  demoReduxStyle();
  console.log('\n');
  demoDbOperations();
  console.log('\n');
  demoErrorHandling();
  console.log('\n');
  demoEntityLifecycle();
}

export { 
  demoReduxStyle, 
  demoDbOperations, 
  demoErrorHandling, 
  demoEntityLifecycle 
}; 