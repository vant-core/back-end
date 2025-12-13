"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
        const puppeteer = await Promise.resolve().then(() => __importStar(require("puppeteer")));
        const browser = await puppeteer.launch({
            headless: true,
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
