// src/services/report/report.service.ts
import * as puppeteer from "puppeteer";
import { reportTemplate } from '../../template/report.template';
import { ReportData, ReportConfig } from '../../types/user';

class ReportService {
  private defaultConfig: ReportConfig = {
    primaryColor: '#3B82F6',      // Azul
    secondaryColor: '#60A5FA',    // Azul claro
    accentColor: '#1E40AF',       // Azul escuro
    fontFamily: 'Inter, system-ui, sans-serif'
  };

  /**
   * Gera HTML do relatório a partir de ReportData
   */
  async generateHTML(data: ReportData, config?: ReportConfig): Promise<string> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const html = reportTemplate(data, finalConfig);
    return html;
  }

  /**
   * Gera PDF a partir do HTML usando Puppeteer
   */
  async generatePDF(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();

      await page.setContent(html, {
        waitUntil: 'networkidle0'
      });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}

export default new ReportService();
