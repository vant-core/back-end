import fs from 'fs/promises';
import path from 'path';

export class FileUtil {
  static async ensureDir(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      throw new Error(`Erro ao criar diretório: ${dirPath}`);
    }
  }

  static async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Erro ao ler arquivo: ${filePath}`);
    }
  }

  static async writeJSON(filePath: string, data: any): Promise<void> {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`Erro ao escrever JSON: ${filePath}`);
    }
  }

  static async readJSON<T>(filePath: string): Promise<T> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Erro ao ler JSON: ${filePath}`);
    }
  }

  static async listFiles(dirPath: string, extension?: string): Promise<string[]> {
    try {
      const files = await fs.readdir(dirPath);
      if (extension) {
        return files.filter(f => f.endsWith(extension));
      }
      return files;
    } catch (error) {
      return [];
    }
  }
}