import { config, DotenvConfigOutput } from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

export class EnvironmentManager {
  private envStore: Map<string, string>;
  private static instance: EnvironmentManager;

  private constructor() {
    this.envStore = new Map();
    this.loadEnvironment();
  }

  public static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  private loadFromFile(filePath: string): void {
    if (existsSync(filePath)) {
      const result: DotenvConfigOutput = config({ path: filePath });
      if (result.error) {
        console.error(`Error loading ${filePath}:`, result.error);
        return;
      }
      if (result.parsed) {
        Object.entries(result.parsed).forEach(([key, value]) => {
          if (typeof value === 'string') {
            this.envStore.set(key, value);
          }
        });
      }
    }
  }

  private loadFromProcessEnv(): void {
    Object.entries(process.env).forEach(([key, value]) => {
      if (typeof value === 'string') {
        this.envStore.set(key, value);
      }
    });
  }

  private loadEnvironment(): void {
    // Load files in order (later files override earlier ones)
    const envFiles = [
      '.env.local',        // lowest priority
      '.env.development',
      '.env',
      '.env.production',    // highest priority
      '.env.test'          // for testing purposes
    ];

    // Load each file in order with absolute paths
    envFiles.forEach(file => {
      const absolutePath = join(process.cwd(), file);
      this.loadFromFile(absolutePath);
    });

    // Finally, load from process.env (highest priority)
    this.loadFromProcessEnv();
  }

  set(key: string, value: string): void {
    this.envStore.set(key, value);
  }

  get(key: string): string | undefined {
    return this.envStore.get(key);
  }

  /**
   * Get a required environment variable. Throws an error if not found.
   * @param key The environment variable key
   * @throws Error if the environment variable is not found
   */
  getRequired(key: string): string {
    const value = this.get(key);
    if (value === undefined) {
      throw new Error(`Required environment variable "${key}" is not set`);
    }
    return value;
  }

  delete(key: string): boolean {
    return this.envStore.delete(key);
  }

  getAllKeys(): string[] {
    return Array.from(this.envStore.keys());
  }

  clear(): void {
    this.envStore.clear();
  }
}

// Export singleton instance
export const env = EnvironmentManager.getInstance(); 