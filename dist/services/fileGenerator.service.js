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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pdfkit_1 = __importDefault(require("pdfkit"));
const docx_1 = require("docx");
const json2csv_1 = require("json2csv");
const XLSX = __importStar(require("xlsx"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class FileGeneratorService {
    constructor() {
        // Define o diretório de uploads
        this.uploadsDir = path_1.default.join(__dirname, "../../uploads");
        // Garante que a pasta uploads exista
        if (!fs_1.default.existsSync(this.uploadsDir)) {
            fs_1.default.mkdirSync(this.uploadsDir, { recursive: true });
            console.log("✅ Pasta uploads criada:", this.uploadsDir);
        }
    }
    /* ---------------------------------------------------------
       PDF - SALVA NO DISCO
    --------------------------------------------------------- */
    async generatePDF(data) {
        return new Promise((resolve, reject) => {
            try {
                const fileName = `${this.sanitizeFileName(data.title || "documento")}_${Date.now()}.pdf`;
                const filePath = path_1.default.join(this.uploadsDir, fileName);
                const doc = new pdfkit_1.default();
                const stream = fs_1.default.createWriteStream(filePath);
                doc.pipe(stream);
                // Título
                if (data.title) {
                    doc.fontSize(22).text(data.title, { underline: true, align: "center" });
                    doc.moveDown(2);
                }
                // Campos
                if (data.fields) {
                    for (const key in data.fields) {
                        doc.fontSize(12).text(`${key}: ${data.fields[key]}`);
                        doc.moveDown(0.5);
                    }
                }
                doc.end();
                stream.on("finish", () => {
                    console.log("✅ PDF salvo com sucesso:", filePath);
                    resolve(fileName); // Retorna apenas o nome do arquivo
                });
                stream.on("error", reject);
            }
            catch (error) {
                console.error("❌ Erro ao gerar PDF:", error);
                reject(error);
            }
        });
    }
    /* ---------------------------------------------------------
       DOCX - SALVA NO DISCO
    --------------------------------------------------------- */
    async generateDOCX(data) {
        const fileName = `${this.sanitizeFileName(data.title || "documento")}_${Date.now()}.docx`;
        const filePath = path_1.default.join(this.uploadsDir, fileName);
        const paragraphs = [];
        // Título
        if (data.title) {
            paragraphs.push(new docx_1.Paragraph({
                children: [new docx_1.TextRun({ text: data.title, bold: true, size: 32 })],
            }));
        }
        // Campos
        if (data.fields) {
            for (const key of Object.keys(data.fields)) {
                paragraphs.push(new docx_1.Paragraph({
                    children: [
                        new docx_1.TextRun({ text: `${key}: `, bold: true }),
                        new docx_1.TextRun({ text: String(data.fields[key]) }),
                    ],
                }));
            }
        }
        const doc = new docx_1.Document({
            sections: [
                {
                    properties: {},
                    children: paragraphs,
                },
            ],
        });
        const buffer = await docx_1.Packer.toBuffer(doc);
        fs_1.default.writeFileSync(filePath, buffer);
        console.log("✅ DOCX salvo com sucesso:", filePath);
        return fileName;
    }
    /* ---------------------------------------------------------
       CSV - SALVA NO DISCO
    --------------------------------------------------------- */
    generateCSV(data) {
        const fileName = `${this.sanitizeFileName(data.title || "dados")}_${Date.now()}.csv`;
        const filePath = path_1.default.join(this.uploadsDir, fileName);
        const parser = new json2csv_1.Parser();
        const csv = parser.parse([data.fields || {}]);
        fs_1.default.writeFileSync(filePath, csv, "utf-8");
        console.log("✅ CSV salvo com sucesso:", filePath);
        return fileName;
    }
    /* ---------------------------------------------------------
       XLSX - SALVA NO DISCO
    --------------------------------------------------------- */
    generateXLSX(data) {
        const fileName = `${this.sanitizeFileName(data.title || "planilha")}_${Date.now()}.xlsx`;
        const filePath = path_1.default.join(this.uploadsDir, fileName);
        const worksheet = XLSX.utils.json_to_sheet([data.fields || {}]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");
        const buffer = XLSX.write(workbook, {
            type: "buffer",
            bookType: "xlsx",
        });
        fs_1.default.writeFileSync(filePath, buffer);
        console.log("✅ XLSX salvo com sucesso:", filePath);
        return fileName;
    }
    /* ---------------------------------------------------------
       Sanitiza nome do arquivo (remove caracteres especiais)
    --------------------------------------------------------- */
    sanitizeFileName(name) {
        return name
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remove acentos
            .replace(/[^a-z0-9_-]/gi, "_") // Remove caracteres especiais
            .substring(0, 50); // Limita tamanho
    }
}
exports.default = new FileGeneratorService();
