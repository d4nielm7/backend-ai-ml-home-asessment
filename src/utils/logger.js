class Logger {
  constructor() {
    this.isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
  }

  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const requestId = this.extractRequestId(args);
    const filteredArgs = this.filterRequestId(args);
    
    const requestIdStr = requestId ? `[${requestId.substring(0, 8)}]` : '';
    const prefix = `[${timestamp}] [${level.toUpperCase()}]${requestIdStr ? ' ' + requestIdStr : ''}`;
    
    if (filteredArgs.length === 0) {
      return `${prefix} ${message}`;
    }
    
    if (this.isDevelopment || level === 'error') {
      try {
        const argsStr = filteredArgs.map(arg => 
          arg instanceof Error ? { message: arg.message, stack: arg.stack } : arg
        );
        return `${prefix} ${message} ${JSON.stringify(argsStr)}`;
      } catch {
        return `${prefix} ${message} [Unable to stringify arguments]`;
      }
    }
    
    return `${prefix} ${message}`;
  }

  extractRequestId(args) {
    for (const arg of args) {
      if (arg && typeof arg === 'object' && 'requestId' in arg) {
        return arg.requestId;
      }
    }
    return null;
  }

  filterRequestId(args) {
    return args.filter(arg => {
      if (arg && typeof arg === 'object' && 'requestId' in arg) {
        const { requestId: _, ...rest } = arg;
        return Object.keys(rest).length > 0 ? rest : null;
      }
      return arg;
    }).filter(Boolean);
  }

  debug(message, ...args) {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, ...args));
    }
  }

  info(message, ...args) {
    console.log(this.formatMessage('info', message, ...args));
  }

  warn(message, ...args) {
    console.warn(this.formatMessage('warn', message, ...args));
  }

  error(message, error, ...args) {
    const errorDetails = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : error;
    console.error(this.formatMessage('error', message, errorDetails, ...args));
  }
}

export const logger = new Logger();
