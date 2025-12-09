import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import logger from '../config/security/logger.config';

class FileController {
  /**
   * Download de arquivo gerado pela IA
   */
  async downloadFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fileName } = req.params;

      // Segurança: previne path traversal
      const sanitizedFileName = path.basename(fileName);
      const filePath = path.join(__dirname, '../../uploads', sanitizedFileName);

      // Verifica se o arquivo existe
      if (!fs.existsSync(filePath)) {
        res.status(404).json({
          success: false,
          message: 'Arquivo não encontrado'
        });
        return;
      }

      // Define o tipo MIME baseado na extensão
      const ext = path.extname(fileName).toLowerCase();
      const mimeTypes: { [key: string]: string } = {
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
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      logger.info(`Arquivo baixado: ${sanitizedFileName}`);

    } catch (error) {
      logger.error('Erro ao fazer download do arquivo:', error);
      next(error);
    }
  }

  /**
   * Lista arquivos gerados (opcional - para debug)
   */
  async listFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const uploadsDir = path.join(__dirname, '../../uploads');
      const files = fs.readdirSync(uploadsDir);

      const fileList = files.map(file => ({
        name: file,
        size: fs.statSync(path.join(uploadsDir, file)).size,
        created: fs.statSync(path.join(uploadsDir, file)).birthtime
      }));

      res.json({
        success: true,
        data: fileList
      });
    } catch (error) {
      logger.error('Erro ao listar arquivos:', error);
      next(error);
    }
  }
}

export default new FileController();