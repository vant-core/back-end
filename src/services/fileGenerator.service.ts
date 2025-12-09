import PDFDocument from "pdfkit";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { Parser } from "json2csv";
import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";

class FileGeneratorService {
  private uploadsDir: string;

  constructor() {
    // Define o diretório de uploads
    this.uploadsDir = path.join(__dirname, "../../uploads");

    // Garante que a pasta uploads exista
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
      console.log("✅ Pasta uploads criada:", this.uploadsDir);
    }
  }

  /* ---------------------------------------------------------
     PDF - SALVA NO DISCO
  --------------------------------------------------------- */
  async generatePDF(data: any): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const fileName = `${this.sanitizeFileName(data.title || "documento")}_${Date.now()}.pdf`;
        const filePath = path.join(this.uploadsDir, fileName);

        const doc = new PDFDocument();
        const stream = fs.createWriteStream(filePath);

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
      } catch (error) {
        console.error("❌ Erro ao gerar PDF:", error);
        reject(error);
      }
    });
  }

  /* ---------------------------------------------------------
     DOCX - SALVA NO DISCO
  --------------------------------------------------------- */
  async generateDOCX(data: any): Promise<string> {
    const fileName = `${this.sanitizeFileName(data.title || "documento")}_${Date.now()}.docx`;
    const filePath = path.join(this.uploadsDir, fileName);

    const paragraphs: Paragraph[] = [];

    // Título
    if (data.title) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: data.title, bold: true, size: 32 })],
        })
      );
    }

    // Campos
    if (data.fields) {
      for (const key of Object.keys(data.fields)) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${key}: `, bold: true }),
              new TextRun({ text: String(data.fields[key]) }),
            ],
          })
        );
      }
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filePath, buffer);

    console.log("✅ DOCX salvo com sucesso:", filePath);
    return fileName;
  }

  /* ---------------------------------------------------------
     CSV - SALVA NO DISCO
  --------------------------------------------------------- */
  generateCSV(data: any): string {
    const fileName = `${this.sanitizeFileName(data.title || "dados")}_${Date.now()}.csv`;
    const filePath = path.join(this.uploadsDir, fileName);

    const parser = new Parser();
    const csv = parser.parse([data.fields || {}]);

    fs.writeFileSync(filePath, csv, "utf-8");

    console.log("✅ CSV salvo com sucesso:", filePath);
    return fileName;
  }

  /* ---------------------------------------------------------
     XLSX - SALVA NO DISCO
  --------------------------------------------------------- */
  generateXLSX(data: any): string {
    const fileName = `${this.sanitizeFileName(data.title || "planilha")}_${Date.now()}.xlsx`;
    const filePath = path.join(this.uploadsDir, fileName);

    const worksheet = XLSX.utils.json_to_sheet([data.fields || {}]);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    fs.writeFileSync(filePath, buffer);

    console.log("✅ XLSX salvo com sucesso:", filePath);
    return fileName;
  }

  /* ---------------------------------------------------------
     Sanitiza nome do arquivo (remove caracteres especiais)
  --------------------------------------------------------- */
  private sanitizeFileName(name: string): string {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-z0-9_-]/gi, "_")   // Remove caracteres especiais
      .substring(0, 50);                // Limita tamanho
  }
}

export default new FileGeneratorService();