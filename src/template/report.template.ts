import { ReportData, ReportConfig, ReportSection } from '../types/user';

export const reportTemplate = (data: ReportData, config: ReportConfig): string => {
  const { primaryColor, secondaryColor, accentColor, fontFamily, logo } = config;

  // Renderiza seções baseado no tipo
  const renderSection = (section: ReportSection): string => {
    switch (section.type) {
      case 'cards':
        return renderCards(section);
      case 'table':
        return renderTable(section);
      case 'list':
        return renderList(section);
      case 'text':
        return renderText(section);
      default:
        return '';
    }
  };

  const renderCards = (section: ReportSection): string => {
    return `
      <div class="section">
        <h2 class="section-title">${section.title}</h2>
        <div class="cards-grid">
          ${section.content.map((card: any) => `
            <div class="card">
              <div class="card-icon">${card.icon || '📊'}</div>
              <div class="card-label">${card.label}</div>
              <div class="card-value">${card.value}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  const renderTable = (section: ReportSection): string => {
    const { headers, rows } = section.content;
    return `
      <div class="section">
        <h2 class="section-title">${section.title}</h2>
        <table class="data-table">
          <thead>
            <tr>
              ${headers.map((h: string) => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map((row: string[]) => `
              <tr ${row[0] === '' ? 'class="total-row"' : ''}>
                ${row.map((cell, idx) => `<td ${row[0] === '' && idx === 1 ? 'colspan="1" style="text-align: right; font-weight: bold;"' : ''}>${cell}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  const renderList = (section: ReportSection): string => {
    return `
      <div class="section">
        <h2 class="section-title">${section.title}</h2>
        <div class="list-container">
          ${section.content.map((item: any) => `
            <div class="list-item">
              <h3 class="list-item-title">${item.title}</h3>
              ${item.description ? `<p class="list-item-desc">${item.description}</p>` : ''}
              ${item.tags && item.tags.length > 0 ? `
                <div class="tags">
                  ${item.tags.map((tag: string) => `<span class="tag">${tag}</span>`).join('')}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  const renderText = (section: ReportSection): string => {
    return `
      <div class="section">
        <h2 class="section-title">${section.title}</h2>
        <div class="text-content">
          ${section.content}
        </div>
      </div>
    `;
  };

  // Template HTML completo
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: ${fontFamily};
          background: #ffffff;
          color: #1f2937;
          line-height: 1.6;
        }

        .report-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        /* Header */
        .report-header {
          background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
          color: white;
          padding: 50px 40px;
          border-radius: 16px;
          margin-bottom: 40px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }

        .report-header h1 {
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .report-header .subtitle {
          font-size: 1.3rem;
          opacity: 0.95;
          margin-bottom: 20px;
        }

        .report-header .meta {
          font-size: 1rem;
          opacity: 0.85;
        }

        .logo {
          width: 140px;
          height: auto;
          margin-bottom: 24px;
        }

        /* Sections */
        .section {
          margin-bottom: 50px;
          page-break-inside: avoid;
        }

        .section-title {
          font-size: 1.8rem;
          font-weight: 600;
          color: ${accentColor};
          margin-bottom: 24px;
          padding-bottom: 12px;
          border-bottom: 3px solid ${secondaryColor};
        }

        /* Cards Grid */
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
          margin-bottom: 20px;
        }

        .card {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 28px;
          text-align: center;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
        }

        .card-icon {
          font-size: 3rem;
          margin-bottom: 16px;
        }

        .card-label {
          font-size: 1rem;
          color: #64748b;
          margin-bottom: 12px;
          font-weight: 500;
        }

        .card-value {
          font-size: 2.2rem;
          font-weight: 700;
          color: ${primaryColor};
        }

        /* Table */
        .data-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        .data-table thead {
          background: ${primaryColor};
          color: white;
        }

        .data-table th {
          padding: 18px;
          text-align: left;
          font-weight: 600;
          font-size: 1rem;
        }

        .data-table td {
          padding: 16px 18px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 0.95rem;
        }

        .data-table tbody tr:hover {
          background: #f8fafc;
        }

        .data-table tbody tr:last-child td {
          border-bottom: none;
        }

        .data-table .total-row {
          background: #f1f5f9;
          font-weight: 700;
          font-size: 1.05rem;
        }

        .data-table .total-row td {
          border-top: 2px solid ${primaryColor};
          padding: 20px 18px;
        }

        /* List */
        .list-container {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .list-item {
          background: #f8fafc;
          border-left: 4px solid ${primaryColor};
          padding: 24px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .list-item:hover {
          background: #f1f5f9;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .list-item-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: ${accentColor};
          margin-bottom: 10px;
        }

        .list-item-desc {
          color: #64748b;
          font-size: 1rem;
          line-height: 1.7;
          white-space: pre-wrap;
          margin-bottom: 14px;
        }

        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tag {
          background: ${secondaryColor};
          color: white;
          padding: 6px 14px;
          border-radius: 14px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        /* Text Content */
        .text-content {
          color: #374151;
          font-size: 1.05rem;
          line-height: 1.9;
        }

        .text-content strong {
          color: ${accentColor};
          font-weight: 600;
        }

        .text-content em {
          color: #64748b;
          font-style: italic;
        }

        /* Footer */
        .report-footer {
          margin-top: 80px;
          padding-top: 24px;
          border-top: 2px solid #e2e8f0;
          text-align: center;
          color: #64748b;
          font-size: 0.95rem;
        }

        @media print {
          .report-container {
            padding: 20px;
          }
          
          .card:hover {
            transform: none;
          }
          
          .section {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="report-container">
        <div class="report-header">
          ${logo ? `<img src="${logo}" alt="Logo" class="logo" />` : ''}
          <h1>${data.title}</h1>
          ${data.subtitle ? `<div class="subtitle">${data.subtitle}</div>` : ''}
          <div class="meta">
            Gerado em: ${new Date(data.generatedAt).toLocaleString('pt-BR')}
          </div>
        </div>

        ${data.sections.map(section => renderSection(section)).join('')}

        <div class="report-footer">
          Relatório gerado automaticamente • ${new Date().getFullYear()}
        </div>
      </div>
    </body>
    </html>
  `;
};