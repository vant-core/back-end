"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUtil = void 0;
const promises_1 = __importDefault(require("fs/promises"));
class FileUtil {
    static async ensureDir(dirPath) {
        try {
            await promises_1.default.mkdir(dirPath, { recursive: true });
        }
        catch (error) {
            throw new Error(`Erro ao criar diretório: ${dirPath}`);
        }
    }
    static async readFile(filePath) {
        try {
            return await promises_1.default.readFile(filePath, 'utf-8');
        }
        catch (error) {
            throw new Error(`Erro ao ler arquivo: ${filePath}`);
        }
    }
    static async writeJSON(filePath, data) {
        try {
            await promises_1.default.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
        }
        catch (error) {
            throw new Error(`Erro ao escrever JSON: ${filePath}`);
        }
    }
    static async readJSON(filePath) {
        try {
            const content = await promises_1.default.readFile(filePath, 'utf-8');
            return JSON.parse(content);
        }
        catch (error) {
            throw new Error(`Erro ao ler JSON: ${filePath}`);
        }
    }
    static async listFiles(dirPath, extension) {
        try {
            const files = await promises_1.default.readdir(dirPath);
            if (extension) {
                return files.filter(f => f.endsWith(extension));
            }
            return files;
        }
        catch (error) {
            return [];
        }
    }
}
exports.FileUtil = FileUtil;
