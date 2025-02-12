// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
} as const;

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerConfig {
  showTimestamp?: boolean;
  showLogType?: boolean;
  useColors?: boolean;
  logLevel?: LogLevel;
  preText?: string;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = 'info';
  private showTimestamp: boolean = true;
  private showLogType: boolean = true;
  private useColors: boolean = true;
  private preText: string = '';

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public configure(config: LoggerConfig): void {
    if (config.logLevel !== undefined) this.logLevel = config.logLevel;
    if (config.showTimestamp !== undefined) this.showTimestamp = config.showTimestamp;
    if (config.showLogType !== undefined) this.showLogType = config.showLogType;
    if (config.useColors !== undefined) this.useColors = config.useColors;
    if (config.preText !== undefined) this.preText = config.preText;
  }

  public prefix(prefix: string): PrefixedLogger {
    return new PrefixedLogger(this, prefix);
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  protected formatPrefix(level: LogLevel, color: string, additionalPrefix?: string): string {
    const parts: string[] = [];
    
    if (this.preText) {
      parts.push(this.preText);
    }

    if (additionalPrefix) {
      parts.push(`[${additionalPrefix}]`);
    }

    if (this.showTimestamp) {
      parts.push(`[${this.getTimestamp()}]`);
    }
    
    if (this.showLogType) {
      parts.push(`${level.toUpperCase()}:`);
    }

    if (parts.length === 0) {
      return '';
    }

    const prefix = parts.join(' ');
    return this.useColors ? `${color}${prefix}${colors.reset}` : prefix;
  }

  public debug(message: string, ...args: any[]): void {
    if (!this.shouldLog('debug')) return;
    console.log(
      this.formatPrefix('debug', colors.gray),
      message,
      ...args
    );
  }

  public info(message: string, ...args: any[]): void {
    if (!this.shouldLog('info')) return;
    console.log(
      this.formatPrefix('info', colors.green),
      message,
      ...args
    );
  }

  public warn(message: string, ...args: any[]): void {
    if (!this.shouldLog('warn')) return;
    console.log(
      this.formatPrefix('warn', colors.yellow),
      message,
      ...args
    );
  }

  public error(message: string | Error, ...args: any[]): void {
    if (!this.shouldLog('error')) return;
    const errorMessage = message instanceof Error ? message.stack || message.message : message;
    console.error(
      this.formatPrefix('error', colors.red),
      errorMessage,
      ...args
    );
  }
}

export class PrefixedLogger {
  constructor(
    private baseLogger: Logger,
    private prefix: string
  ) {}

  public debug(message: string, ...args: any[]): void {
    if (this.baseLogger instanceof Logger) {
      this.baseLogger['formatPrefix']('debug', colors.gray, this.prefix);
      console.log(
        this.baseLogger['formatPrefix']('debug', colors.gray, this.prefix),
        message,
        ...args
      );
    }
  }

  public info(message: string, ...args: any[]): void {
    if (this.baseLogger instanceof Logger) {
      console.log(
        this.baseLogger['formatPrefix']('info', colors.green, this.prefix),
        message,
        ...args
      );
    }
  }

  public warn(message: string, ...args: any[]): void {
    if (this.baseLogger instanceof Logger) {
      console.log(
        this.baseLogger['formatPrefix']('warn', colors.yellow, this.prefix),
        message,
        ...args
      );
    }
  }

  public error(message: string | Error, ...args: any[]): void {
    if (this.baseLogger instanceof Logger) {
      const errorMessage = message instanceof Error ? message.stack || message.message : message;
      console.error(
        this.baseLogger['formatPrefix']('error', colors.red, this.prefix),
        errorMessage,
        ...args
      );
    }
  }
}

// Export a default logger instance
export const logger = Logger.getInstance(); 