"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const report_service_1 = __importDefault(require("../services/report/report.service"));
const reportHandlers_1 = __importDefault(require("../services/report/reportHandlers"));
class ReportController {
    /**
     * POST /api/reports/preview
     * Retorna HTML do relatório para preview no frontend
     */
    async preview(req, res) {
        try {
            const { folderId, title, subtitle, config } = req.body;
            // pega userId do JWT (authMiddleware já popula req.user)
            const authReq = req;
            const userId = authReq.user?.id || req.body.userId;
            if (!userId) {
                return res
                    .status(401)
                    .json({ success: false, error: 'Usuário não autenticado' });
            }
            const result = await reportHandlers_1.default.handleGenerateReport({
                folderId,
                title,
                subtitle,
                config,
            }, userId);
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
        }
        catch (error) {
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
    async generatePDF(req, res) {
        try {
            const { folderId, title, subtitle, config } = req.body;
            const authReq = req;
            const userId = authReq.user?.id || req.body.userId;
            if (!userId) {
                return res
                    .status(401)
                    .json({ success: false, error: 'Usuário não autenticado' });
            }
            // reaproveita a lógica do handler para montar o relatório
            const result = await reportHandlers_1.default.handleGenerateReport({
                folderId,
                title,
                subtitle,
                config,
            }, userId);
            if (!result.success || !result.html) {
                return res.status(500).json({
                    success: false,
                    error: result.error || 'Erro ao gerar relatório',
                    message: result.message,
                });
            }
            const pdfBuffer = await report_service_1.default.generatePDF(result.html);
            const filename = `relatorio_${Date.now()}.pdf`;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', pdfBuffer.length);
            return res.send(pdfBuffer);
        }
        catch (error) {
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
    async generateFromHTML(req, res) {
        try {
            const { html, title } = req.body;
            if (!html) {
                return res
                    .status(400)
                    .json({ success: false, error: 'HTML é obrigatório' });
            }
            const pdfBuffer = await report_service_1.default.generatePDF(html);
            const filename = `${(title || 'relatorio_custom')
                .replace(/\s+/g, '_')
                .toLowerCase()}_${Date.now()}.pdf`;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', pdfBuffer.length);
            return res.send(pdfBuffer);
        }
        catch (error) {
            console.error('Erro ao gerar PDF customizado:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao gerar PDF',
                details: error instanceof Error ? error.message : 'Erro desconhecido',
            });
        }
    }
}
exports.default = new ReportController();
