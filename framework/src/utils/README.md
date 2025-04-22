# Console Group Logger

A flexible, styled console grouping utility for creating structured logs similar to redux-logger. This logger makes it easy to create collapsible, organized, and visually appealing console logs for debugging.

## Features

- **Styled console groups** with customizable colors and formatting
- **Log levels** (info, debug, warning, error, success)
- **Collapsible groups** to keep console output clean
- **Chainable API** for expressive logging
- **Specialized database logger** for DB operations

## Basic Usage

### Simple Logging

```typescript
import { logger } from './utils/GroupLogger';

// Create a simple log group
const logGroup = logger.group('User Authentication');
logGroup.log('username', 'user@example.com');
logGroup.log('timestamp', new Date().toISOString());
logGroup.log('status', 'success');
logGroup.end(); // Always close groups when done
```

### Action Logging (Redux-Style)

```typescript
import { logger } from './utils/GroupLogger';

const action = { type: 'UPDATE_USER', payload: { name: 'John' } };
const prevState = { user: { name: 'Guest' } };
const nextState = { user: { name: 'John' } };

// Use the built-in action logger
logger.logAction(
  'Action: UPDATE_USER', 
  prevState, 
  nextState
).end();
```

### Error Handling

```typescript
import { logger, LogLevel } from './utils/GroupLogger';

try {
  // Some operation that might fail
  throw new Error('Connection failed');
} catch (error) {
  const errorGroup = logger.group('Operation Failed', LogLevel.ERROR);
  errorGroup.error('Error details', error);
  errorGroup.log('timestamp', new Date().toISOString());
  errorGroup.end();
}
```

## Database Logging

The specialized `DatabaseLogger` extends the base logger with database-specific methods:

```typescript
import { dbLogger } from './utils/DatabaseLogger';

// Log a database query
dbLogger.logQuery(
  'SELECT * FROM users WHERE id = ?',
  [1234],
  { id: 1234, name: 'John' },
  42 // duration in ms
);

// Log entity changes
dbLogger.logEntityChange(
  'update',
  'User',
  { id: 1, name: 'John' },
  { id: 1, name: 'John Doe' }
);

// Log transactions with nested operations
dbLogger.logTransaction('UpdateUserProfile', (logger) => {
  // Operations inside the transaction
  logger.logQuery('UPDATE users SET name = ? WHERE id = ?', ['John Doe', 1]);
  logger.logQuery('INSERT INTO audit_log VALUES (?, ?)', [1, 'profile_updated']);
});

// Log performance warnings
dbLogger.logPerformanceWarning(
  'FetchAllUsers', 
  1500, // actual duration 
  500,  // threshold
  { table: 'users', conditions: 'none' }
);
```

## Customization

### Custom Logger Instance

```typescript
import { GroupLogger, LogLevel } from './utils/GroupLogger';

// Create a custom logger with options
const myLogger = new GroupLogger({
  collapsed: true, // Groups start collapsed
  level: LogLevel.WARNING, // Only show warnings and errors
  styles: {
    titleStyle: 'color: #8e44ad; font-weight: bold; font-size: 14px;',
    errorStyle: 'color: #e74c3c; font-weight: bold;'
  }
});

// Use your custom logger
myLogger.group('Custom Style Log', LogLevel.WARNING)
  .warn('Something suspicious', { details: '...' })
  .end();
```

### Extending for Custom Use

You can extend the base `GroupLogger` for domain-specific logging:

```typescript
import { GroupLogger, LogLevel } from './utils/GroupLogger';

class APILogger extends GroupLogger {
  constructor() {
    super({
      collapsed: true,
      styles: {
        titleStyle: 'color: #3498db; font-weight: bold;'
      }
    });
  }
  
  logRequest(method: string, url: string, headers: any, body?: any) {
    const requestGroup = this.group(`API Request: ${method} ${url}`);
    requestGroup.log('headers', headers);
    if (body) requestGroup.log('body', body);
    requestGroup.end();
    return this;
  }
  
  logResponse(status: number, data: any, duration: number) {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    const responseGroup = this.group(`API Response: ${status}`, level);
    responseGroup.log('data', data);
    responseGroup.log('duration', `${duration}ms`);
    responseGroup.end();
    return this;
  }
}

// Use the specialized logger
const apiLogger = new APILogger();
apiLogger.logRequest('GET', '/api/users', { Authorization: 'Bearer ...' });
```

## How It Works

The logger uses the browser's built-in `console.group()` and `console.groupCollapsed()` methods to create collapsible sections in the console. This, combined with CSS styling via the `%c` format specifier, creates visually organized and hierarchical logs.

The chainable API allows for expressive and readable logging code while maintaining the group structure. 