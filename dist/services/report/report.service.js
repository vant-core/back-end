"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/services/report/report.service.ts
const report_template_1 = require("../../template/report.template");
class ReportService {
    constructor() {
        this.defaultConfig = {
            primaryColor: '#3B82F6', // Azul
            secondaryColor: '#60A5FA', // Azul claro
            accentColor: '#1E40AF', // Azul escuro
            fontFamily: 'Inter, system-ui, sans-serif'
        };
    }
    /**
     * Gera HTML do relatório a partir de ReportData
     */
    async generateHTML(data, config) {
        const finalConfig = { ...this.defaultConfig, ...config };
        const html = (0, report_template_1.reportTemplate)(data, finalConfig);
        return html;
    }
    /**
     * Gera PDF a partir do HTML usando Puppeteer
     */
    async generatePDF(html) {
        // 🔥 força o TS a ignorar totalmente o puppeteer
        // @ts-ignore
        const puppeteer = require("puppeteer");
        const browser = await puppeteer.launch({
            headless: "new",
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
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
        }
        finally {
            await browser.close();
        }
    }
}
exports.default = new ReportService();
