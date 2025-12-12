// src/controllers/report.controller.ts
import { Request, Response } from 'express';
import reportService from '../services/report/report.service';
import reportHandler from '../services/report/reportHandlers';

interface GenerateReportRequest {
  userId?: string; // agora vamos preferir pegar do JWT
  folderId?: string;
  title?: string;
  subtitle?: string;
  config?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    logo?: string;
  };
}

class ReportController {
  /**
   * POST /api/reports/preview
   * Retorna HTML do relatório para preview no frontend
   */
  async preview(req: Request, res: Response) {
    try {
      const { folderId, title, subtitle, config } =
        req.body as GenerateReportRequest;

      // pega userId do JWT (authMiddleware já popula req.user)
      const authReq = req as any;
      const userId: string | undefined = authReq.user?.id || req.body.userId;

      if (!userId) {
        return res
          .status(401)
          .json({ success: false, error: 'Usuário não autenticado' });
      }

      const result = await reportHandler.handleGenerateReport(
        {
          folderId,
          title,
          subtitle,
          config,
        },
        userId
      );

      if (!result.success || !result.html || !result.data) {
        return res.status(500).json({
          success: false,
          error: result.error || 'Erro ao gerar relatório',
          message: result.message,
        });
      }

      return res.json({
        success: true,
        message: result.message,
        html: result.html,
        data: result.data,
      });
    } catch (error) {
      console.error('Erro ao gerar preview:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao gerar preview do relatório',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  /**
   * POST /api/reports/generate-pdf
   * Gera e retorna PDF para download
   */
  async generatePDF(req: Request, res: Response) {
    try {
      const { folderId, title, subtitle, config } =
        req.body as GenerateReportRequest;

      const authReq = req as any;
      const userId: string | undefined = authReq.user?.id || req.body.userId;

      if (!userId) {
        return res
          .status(401)
          .json({ success: false, error: 'Usuário não autenticado' });
      }

      // reaproveita a lógica do handler para montar o relatório
      const result = await reportHandler.handleGenerateReport(
        {
          folderId,
          title,
          subtitle,
          config,
        },
        userId
      );

      if (!result.success || !result.html) {
        return res.status(500).json({
          success: false,
          error: result.error || 'Erro ao gerar relatório',
          message: result.message,
        });
      }

      const pdfBuffer = await reportService.generatePDF(result.html);
      const filename = `relatorio_${Date.now()}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`
      );
      res.setHeader('Content-Length', pdfBuffer.length);

      return res.send(pdfBuffer);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao gerar PDF',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  /**
   * POST /api/reports/generate-from-html
   * Gera PDF a partir de HTML customizado
   */
  async generateFromHTML(req: Request, res: Response) {
    try {
      const { html, title } = req.body as { html?: string; title?: string };

      if (!html) {
        return res
          .status(400)
          .json({ success: false, error: 'HTML é obrigatório' });
      }

      const pdfBuffer = await reportService.generatePDF(html);
      const filename = `${(title || 'relatorio_custom')
        .replace(/\s+/g, '_')
        .toLowerCase()}_${Date.now()}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`
      );
      res.setHeader('Content-Length', pdfBuffer.length);

      return res.send(pdfBuffer);
    } catch (error) {
      console.error('Erro ao gerar PDF customizado:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao gerar PDF',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }
}

export default new ReportController();
