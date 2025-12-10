"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logger_config_1 = __importDefault(require("../config/security/logger.config"));
class FileController {
    /**
     * Download de arquivo gerado pela IA
     */
    async downloadFile(req, res, next) {
        try {
            const { fileName } = req.params;
            // Segurança: previne path traversal
            const sanitizedFileName = path_1.default.basename(fileName);
            const filePath = path_1.default.join(__dirname, '../../uploads', sanitizedFileName);
            // Verifica se o arquivo existe
            if (!fs_1.default.existsSync(filePath)) {
                res.status(404).json({
                    success: false,
                    message: 'Arquivo não encontrado'
                });
                return;
            }
            // Define o tipo MIME baseado na extensão
            const ext = path_1.default.extname(fileName).toLowerCase();
            const mimeTypes = {
                '.pdf': 'application/pdf',
                '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                '.csv': 'text/csv',
                '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            };
            const contentType = mimeTypes[ext] || 'application/octet-stream';
            // Configura headers para download
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFileName}"`);
            // Envia o arquivo
            const fileStream = fs_1.default.createReadStream(filePath);
            fileStream.pipe(res);
            logger_config_1.default.info(`Arquivo baixado: ${sanitizedFileName}`);
        }
        catch (error) {
            logger_config_1.default.error('Erro ao fazer download do arquivo:', error);
            next(error);
        }
    }
    /**
     * Lista arquivos gerados (opcional - para debug)
     */
    async listFiles(_req, res, next) {
        try {
            const uploadsDir = path_1.default.join(__dirname, '../../uploads');
            const files = fs_1.default.readdirSync(uploadsDir);
            const fileList = files.map(file => ({
                name: file,
                size: fs_1.default.statSync(path_1.default.join(uploadsDir, file)).size,
                created: fs_1.default.statSync(path_1.default.join(uploadsDir, file)).birthtime
            }));
            res.json({
                success: true,
                data: fileList
            });
        }
        catch (error) {
            logger_config_1.default.error('Erro ao listar arquivos:', error);
            next(error);
        }
    }
}
exports.default = new FileController();
