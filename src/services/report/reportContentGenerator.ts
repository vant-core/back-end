
import OpenAI from "openai";
import { ReportSection, ExecutiveSummaryInput } from "../../types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export class ReportContentGeneratorService {

  /**
   * 📊 PANORAMA GERAL - Resumo Visual e Direto
   */
  async generateOverview(
    input: ExecutiveSummaryInput
  ): Promise<ReportSection> {

    const prompt = `
Você é um analista de eventos especializado em relatórios visuais.

Gere um PANORAMA DO WORKSPACE em texto corrido (2 a 3 parágrafos curtos),
destacando de forma **clara, direta e entusiasmada** as principais informações.

Use linguagem profissional mas acessível, como se estivesse apresentando 
os dados para um gestor ou cliente.

Dados disponíveis:
- Total de itens organizados: ${input.totalItems}
- Categorias principais:
${input.sections.map(s => `  • ${s.title} (${s.type})`).join("\n")}

Estrutura:
1º parágrafo: Visão geral dos dados organizados (breve e impactante)
2º parágrafo: Destaque de volume e principais categorias
3º parágrafo (opcional): Próximos passos ou insights rápidos

Seja conciso. Use emojis sutis se apropriado. Mantenha tom profissional mas engajador.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5
    });

    return {
      title: "📊 Panorama Geral",
      type: "text",
      content: response.choices[0].message.content || ""
    };
  }

  /**
   * 📈 CARDS DE RESUMO - Métricas Principais
   */
  async generateSummaryCards(
    input: ExecutiveSummaryInput
  ): Promise<ReportSection> {
    
    // Extrai métricas básicas
    const totalItems = input.totalItems || 0;
    const totalSections = input.sections.length;
    
    // Conta eventos se houver
    const eventSections = input.sections.filter(s => 
      s.title.toLowerCase().includes('evento') || 
      s.title.toLowerCase().includes('aniversário')
    );
    
    const totalEvents = eventSections.reduce((sum, section) => {
      if (section.type === 'table' && section.content?.rows) {
        return sum + section.content.rows.length;
      }
      return sum;
    }, 0);

    // Conta valores financeiros se houver
    const financialSections = input.sections.filter(s =>
      s.title.toLowerCase().includes('financeiro') ||
      s.title.toLowerCase().includes('pagamento')
    );

    let totalFinancial = 0;
    financialSections.forEach(section => {
      if (section.type === 'table' && section.content?.rows) {
        section.content.rows.forEach((row: any[]) => {
          const valorStr = row[2]; // Coluna de valor
          if (valorStr && typeof valorStr === 'string') {
            const valor = parseFloat(
              valorStr.replace(/[^\d,.-]/g, '').replace(',', '.')
            );
            if (!isNaN(valor)) totalFinancial += valor;
          }
        });
      }
    });

    const cards = [
      {
        value: `${totalItems}+`,
        label: 'Itens organizados no workspace',
        icon: '📁'
      },
      {
        value: `${totalSections}`,
        label: 'Categorias ativas',
        icon: '🗂️'
      }
    ];

    if (totalEvents > 0) {
      cards.push({
        value: `${totalEvents}`,
        label: 'Eventos registrados',
        icon: '🎉'
      });
    }

    if (totalFinancial > 0) {
      cards.push({
        value: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 0
        }).format(totalFinancial),
        label: 'Investimento total',
        icon: '💰'
      });
    }

    return {
      title: "Visão Geral",
      type: "cards",
      content: cards
    };
  }

  /**
   * 🔥 ENRIQUECE SEÇÕES COM ANÁLISES RÁPIDAS
   */
  async enrichSections(
    sections: ReportSection[]
  ): Promise<ReportSection[]> {

    const enriched: ReportSection[] = [];

    for (const section of sections) {
      // Só analisa tabelas e listas com conteúdo relevante
      if ((section.type === 'table' || section.type === 'list') && 
          this.shouldAnalyze(section)) {
        
        const analysis = await this.generateQuickInsight(section);
        
        if (analysis) {
          enriched.push(analysis);
        }
      }

      enriched.push(section);
    }

    return enriched;
  }

  /**
   * 💡 GERA INSIGHT RÁPIDO (não "análise" pesada)
   */
  private async generateQuickInsight(
    section: ReportSection
  ): Promise<ReportSection | null> {

    const prompt = `
Você é um analista de eventos e operações.

Gere um INSIGHT RÁPIDO e DIRETO (máximo 2-3 frases curtas) sobre os dados abaixo.

Foque em:
- Padrões evidentes
- Números que chamam atenção
- Pontos de ação imediatos

Seja objetivo, claro e profissional. Sem listas. Sem jargão desnecessário.

Seção: ${section.title}
Tipo: ${section.type}
Dados:
${JSON.stringify(section.content, null, 2).slice(0, 1500)}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 200
    });

    const insight = response.choices[0].message.content?.trim();

    if (!insight || insight.length < 20) return null;

    return {
      title: `💡 Insight: ${section.title}`,
      type: "text",
      content: `<p style="color: #475569; font-size: 1rem; line-height: 1.7;">${insight}</p>`
    };
  }

  /**
   * Verifica se seção deve ser analisada
   */
  private shouldAnalyze(section: ReportSection): boolean {
    // Não analisa seções vazias
    if (!section.content) return false;

    // Não analisa tabelas/listas muito pequenas
    if (section.type === 'table') {
      const rows = section.content?.rows || [];
      return rows.length >= 2; // Mínimo 2 linhas de dados
    }

    if (section.type === 'list') {
      return section.content.length >= 2;
    }

    return false;
  }

  /**
   * 🎯 GERA RELATÓRIO COMPLETO COM OVERVIEW + CARDS + INSIGHTS
   */
  async generateCompleteReport(
    input: ExecutiveSummaryInput
  ): Promise<ReportSection[]> {
    
    const finalSections: ReportSection[] = [];

    // 1️⃣ Cards de resumo primeiro (visual e impactante)
    const summaryCards = await this.generateSummaryCards(input);
    finalSections.push(summaryCards);

    // 2️⃣ Panorama geral (contexto)
    const overview = await this.generateOverview(input);
    finalSections.push(overview);

    // 3️⃣ Seções originais + insights quando relevante
    const enrichedSections = await this.enrichSections(input.sections);
    finalSections.push(...enrichedSections);

    return finalSections;
  }
}

export default new ReportContentGeneratorService();