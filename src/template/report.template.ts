import { ReportData, ReportConfig, ReportSection } from '../types';

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
        <h2 class="section-title">
          <span class="section-icon">📊</span>
          ${section.title}
        </h2>
        <div class="hero-cards">
          ${section.content.map((card: any) => `
            <div class="hero-card">
              <div class="hero-card-value">${card.value}</div>
              <div class="hero-card-label">${card.label}</div>
              ${card.description ? `<div class="hero-card-description">${card.description}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  const renderTable = (section: ReportSection): string => {
    const { headers, rows } = section.content;
    const isFinancial = section.title.toLowerCase().includes('financeiro');
    
    return `
      <div class="section">
        <h2 class="section-title">
          <span class="section-icon">${isFinancial ? '💰' : '📋'}</span>
          ${section.title}
        </h2>
        <div class="content-box">
          <table class="modern-table">
            <thead>
              <tr>
                ${headers.map((h: string) => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows.map((row: string[]) => {
                const isTotal = row[0] === '';
                return `
                  <tr class="${isTotal ? 'total-row' : ''}">
                    ${row.map((cell, cellIdx) => {
                      if (isTotal && cellIdx === 1) {
                        return `<td colspan="1" style="text-align: right; font-weight: bold;">${cell}</td>`;
                      }
                      return `<td>${cell}</td>`;
                    }).join('')}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  };

  const renderList = (section: ReportSection): string => {
    return `
      <div class="section">
        <h2 class="section-title">
          <span class="section-icon">📝</span>
          ${section.title}
        </h2>
        <div class="content-box">
          <div class="list-items">
            ${section.content.map((item: any) => `
              <div class="list-item-modern">
                <div class="list-item-header">
                  <span class="bullet-point">•</span>
                  <h3 class="list-item-title">${item.title}</h3>
                </div>
                ${item.description ? `
                  <div class="list-item-content">${item.description}</div>
                ` : ''}
                ${item.tags && item.tags.length > 0 ? `
                  <div class="item-tags">
                    ${item.tags.map((tag: string) => `
                      <span class="item-tag">${tag}</span>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  };

  const renderText = (section: ReportSection): string => {
    const isAnalysis = section.title.toLowerCase().includes('análise');
    
    return `
      <div class="section">
        <h2 class="section-title">
          <span class="section-icon">${isAnalysis ? '🔍' : '📄'}</span>
          ${section.title}
        </h2>
        <div class="content-box">
          <div class="text-block ${isAnalysis ? 'analysis-block' : ''}">
            ${section.content}
          </div>
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
          background: linear-gradient(180deg, ${primaryColor}15 0%, ${secondaryColor}10 100%);
          color: #1e293b;
          line-height: 1.6;
        }

        .report-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        /* Header Estilo Imagem */
        .report-header {
          background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
          color: white;
          padding: 50px 40px;
          border-radius: 20px;
          margin-bottom: 40px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
          position: relative;
          overflow: hidden;
        }

        .report-header::before {
          content: '⚡';
          position: absolute;
          top: 20px;
          left: 20px;
          font-size: 3rem;
          opacity: 0.2;
        }

        .header-content {
          position: relative;
          z-index: 1;
        }

        .report-subtitle {
          font-size: 0.95rem;
          opacity: 0.9;
          font-weight: 500;
          margin-bottom: 20px;
          letter-spacing: 0.5px;
        }

        .report-header h1 {
          font-size: 2.8rem;
          font-weight: 800;
          margin-bottom: 15px;
          line-height: 1.2;
        }

        .report-meta {
          font-size: 0.9rem;
          opacity: 0.85;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }

        .logo {
          width: 140px;
          height: auto;
          margin-bottom: 25px;
          filter: brightness(0) invert(1);
        }

        /* Sections */
        .section {
          margin-bottom: 50px;
        }

        .section-title {
          font-size: 1.8rem;
          font-weight: 700;
          color: ${accentColor};
          margin-bottom: 25px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .section-icon {
          font-size: 2rem;
        }

        /* Hero Cards - Estilo da Imagem */
        .hero-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 25px;
          margin-bottom: 30px;
        }

        .hero-card {
          background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
          color: white;
          padding: 40px 30px;
          border-radius: 20px;
          text-align: center;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .hero-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
        }

        .hero-card-value {
          font-size: 3.5rem;
          font-weight: 900;
          margin-bottom: 15px;
          line-height: 1;
        }

        .hero-card-label {
          font-size: 1.1rem;
          font-weight: 600;
          line-height: 1.4;
          opacity: 0.95;
        }

        .hero-card-description {
          font-size: 0.9rem;
          margin-top: 10px;
          opacity: 0.85;
        }

        /* Content Box */
        .content-box {
          background: white;
          border-radius: 16px;
          padding: 30px;
          box-shadow: 0 2px 15px rgba(0, 0, 0, 0.08);
        }

        /* Modern Table */
        .modern-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }

        .modern-table thead {
          background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
          color: white;
        }

        .modern-table th {
          padding: 18px 20px;
          text-align: left;
          font-weight: 700;
          font-size: 1rem;
          border: none;
        }

        .modern-table th:first-child {
          border-radius: 12px 0 0 0;
        }

        .modern-table th:last-child {
          border-radius: 0 12px 0 0;
        }

        .modern-table td {
          padding: 16px 20px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 0.95rem;
        }

        .modern-table tbody tr:hover {
          background: #f8fafc;
        }

        .modern-table tbody tr:last-child td {
          border-bottom: none;
        }

        .modern-table .total-row {
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          font-weight: 700;
          font-size: 1.1rem;
        }

        .modern-table .total-row td {
          border-top: 3px solid ${primaryColor};
          padding: 22px 20px;
        }

        /* List Items */
        .list-items {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .list-item-modern {
          padding: 20px 0;
          border-bottom: 1px solid #e2e8f0;
        }

        .list-item-modern:last-child {
          border-bottom: none;
        }

        .list-item-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 10px;
        }

        .bullet-point {
          color: ${primaryColor};
          font-size: 1.5rem;
          font-weight: 900;
          line-height: 1;
          margin-top: -2px;
        }

        .list-item-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: ${accentColor};
          flex: 1;
          line-height: 1.4;
        }

        .list-item-content {
          color: #475569;
          font-size: 1rem;
          line-height: 1.7;
          margin-left: 24px;
          margin-bottom: 12px;
        }

        .item-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-left: 24px;
        }

        .item-tag {
          background: ${primaryColor}15;
          color: ${primaryColor};
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          border: 1px solid ${primaryColor}30;
        }

        /* Text Block */
        .text-block {
          color: #334155;
          font-size: 1.05rem;
          line-height: 1.9;
        }

        .analysis-block {
          padding: 20px;
          background: linear-gradient(to right, ${primaryColor}08, transparent);
          border-left: 4px solid ${primaryColor};
          border-radius: 8px;
        }

        .text-block strong {
          color: ${accentColor};
          font-weight: 700;
        }

        .text-block em {
          color: #64748b;
          font-style: italic;
        }

        .text-block p {
          margin-bottom: 15px;
        }

        /* Footer */
        .report-footer {
          margin-top: 60px;
          padding: 30px;
          background: white;
          border-radius: 16px;
          text-align: center;
          color: #64748b;
          font-size: 0.95rem;
          box-shadow: 0 2px 15px rgba(0, 0, 0, 0.08);
        }

        .footer-icon {
          font-size: 2rem;
          margin-bottom: 12px;
        }

        @media print {
          body {
            background: white;
          }
          
          .report-container {
            padding: 20px;
          }
          
          .hero-card:hover, .modern-table tbody tr:hover {
            transform: none;
          }
          
          .section {
            page-break-inside: avoid;
          }
        }

        @media (max-width: 768px) {
          .report-header h1 {
            font-size: 2rem;
          }

          .hero-cards {
            grid-template-columns: 1fr;
          }

          .hero-card-value {
            font-size: 2.5rem;
          }

          .modern-table {
            font-size: 0.85rem;
          }

          .content-box {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="report-container">
        <div class="report-header">
          <div class="header-content">
            ${logo ? `<img src="${logo}" alt="Logo" class="logo" />` : ''}
            <div class="report-subtitle">${data.subtitle || 'Relatório Consolidado'}</div>
            <h1>${data.title}</h1>
            <div class="report-meta">
              ✨ Gerado em: ${new Date(data.generatedAt).toLocaleString('pt-BR', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>

        ${data.sections.map(section => renderSection(section)).join('')}

        <div class="report-footer">
          <div class="footer-icon">📊</div>
          <strong>Relatório gerado automaticamente</strong><br>
          ${new Date().getFullYear()} • Powered by IA
        </div>
      </div>
    </body>
    </html>
  `;
};