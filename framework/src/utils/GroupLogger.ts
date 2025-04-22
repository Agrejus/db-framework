/**
 * Group Logger - A utility for creating styled console group logs similar to redux-logger
 */

// Log levels for different types of messages
export enum LogLevel {
  INFO = 'info',
  DEBUG = 'debug',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success'
}

// Style configuration for different parts of the log
interface LogStyles {
  titleStyle: string;
  prevStyle: string;
  nextStyle: string;
  actionStyle: string;
  errorStyle: string;
  warningStyle: string;
  infoStyle: string;
  successStyle: string;
}

// Default styles using CSS-in-JS format for console
const defaultStyles: LogStyles = {
  titleStyle: 'color: #614381; font-weight: bold; font-size: 12px;',
  prevStyle: 'color: #9E9E9E; font-weight: bold;',
  nextStyle: 'color: #4CAF50; font-weight: bold;',
  actionStyle: 'color: #03A9F4; font-weight: bold;',
  errorStyle: 'color: #F20404; font-weight: bold;',
  warningStyle: 'color: #FF9800; font-weight: bold;',
  infoStyle: 'color: #2196F3; font-weight: bold;',
  successStyle: 'color: #4CAF50; font-weight: bold;'
};

interface LoggerOptions {
  collapsed?: boolean;  // Whether groups should be collapsed by default
  styles?: Partial<LogStyles>; // Custom styles
  level?: LogLevel | 'none';   // Minimum log level to display
  diff?: boolean;       // Whether to show object diffs
}

/**
 * GroupLogger class for creating styled console groups
 */
export class GroupLogger {
  private styles: LogStyles;
  private options: LoggerOptions;

  constructor(options: LoggerOptions = {}) {
    this.options = {
      collapsed: false,
      diff: true,
      level: LogLevel.INFO,
      ...options
    };
    
    // Merge custom styles with defaults
    this.styles = {
      ...defaultStyles,
      ...(options.styles || {})
    };
  }

  /**
   * Start a new console group with a title
   */
  group(title: string, level: LogLevel = LogLevel.INFO): GroupLoggerInstance {
    if (this.shouldLog(level)) {
      const method = this.options.collapsed ? console.groupCollapsed : console.group;
      method.call(console, `%c${title}`, this.styles.titleStyle);
    }
    
    return new GroupLoggerInstance(this, level);
  }

  /**
   * Log an action with previous and next state
   */
  logAction(action: string, prevState: any, nextState: any, level: LogLevel = LogLevel.INFO): GroupLoggerInstance {
    const logger = this.group(action, level);
    
    if (this.shouldLog(level)) {
      logger.log('prev state', prevState, LogLevel.INFO);
      logger.log('next state', nextState, LogLevel.INFO);
    }
    
    return logger;
  }

  /**
   * Log an operation with its result
   */
  logOperation(operation: string, result: any, metadata?: any, level: LogLevel = LogLevel.INFO): GroupLoggerInstance {
    const logger = this.group(operation, level);
    
    if (this.shouldLog(level)) {
      if (metadata) {
        logger.log('metadata', metadata, LogLevel.INFO);
      }
      logger.log('result', result, LogLevel.INFO);
    }
    
    return logger;
  }

  /**
   * Determine if a particular log level should be shown
   */
  shouldLog(level: LogLevel): boolean {
    if (this.options.level === 'none') return false;
    
    const levels = Object.values(LogLevel);
    const minLevelIndex = levels.indexOf(this.options.level as LogLevel);
    const currentLevelIndex = levels.indexOf(level);
    
    return currentLevelIndex >= minLevelIndex;
  }

  /**
   * Get style for a specific log level
   */
  getStyleForLevel(level: LogLevel): string {
    switch(level) {
      case LogLevel.ERROR: return this.styles.errorStyle;
      case LogLevel.WARNING: return this.styles.warningStyle;
      case LogLevel.INFO: return this.styles.infoStyle;
      case LogLevel.SUCCESS: return this.styles.successStyle;
      case LogLevel.DEBUG: 
      default: return this.styles.infoStyle;
    }
  }
}

/**
 * Instance of a group logger that represents an active console group
 */
export class GroupLoggerInstance {
  private logger: GroupLogger;
  private level: LogLevel;
  
  constructor(logger: GroupLogger, level: LogLevel) {
    this.logger = logger;
    this.level = level;
  }

  /**
   * Log a message within the group
   */
  log(label: string, data: any, level: LogLevel = this.level): GroupLoggerInstance {
    if (this.logger.shouldLog(level)) {
      console.log(`%c${label}:`, this.logger.getStyleForLevel(level), data);
    }
    return this;
  }

  /**
   * Log an error within the group
   */
  error(message: string, error: any): GroupLoggerInstance {
    return this.log(message, error, LogLevel.ERROR);
  }

  /**
   * Log a warning within the group
   */
  warn(message: string, data: any): GroupLoggerInstance {
    return this.log(message, data, LogLevel.WARNING);
  }

  /**
   * Log a success message within the group
   */
  success(message: string, data: any): GroupLoggerInstance {
    return this.log(message, data, LogLevel.SUCCESS);
  }

  /**
   * End the console group
   */
  end(): void {
    if (this.logger.shouldLog(this.level)) {
      console.groupEnd();
    }
  }
}

// Create a default instance for easy import
export const logger = new GroupLogger();

export default logger; 