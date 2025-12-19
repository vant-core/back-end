"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportNarrativeRules = void 0;
class ReportNarrativeRules {
    // Função principal que gera o resumo executivo
    generateExecutiveSummary(input) {
        const { title, totalItems, sections } = input;
        const paragraphs = [];
        // Introdução
        paragraphs.push(`Este relatório apresenta uma análise consolidada das informações registradas no workspace${title ? `, com foco em "${title}"` : ''}. O objetivo é oferecer uma visão clara do estágio atual de planejamento e organização.`);
        // Volume de dados
        if (totalItems > 0) {
            paragraphs.push(`Foram analisados ${totalItems} registro${totalItems > 1 ? 's' : ''} distribuídos entre diferentes categorias, incluindo eventos, informações financeiras e listas operacionais.`);
        }
        // Tipos de seção
        const hasEvents = sections.some(s => s.title.toLowerCase().includes('evento'));
        const hasFinance = sections.some(s => s.title.toLowerCase().includes('financeiro'));
        const hasLists = sections.some(s => s.type === 'list');
        if (hasEvents) {
            paragraphs.push(`As seções relacionadas a eventos permitem compreender o calendário, os locais envolvidos e a dimensão de público esperada, apoiando decisões sobre logística, equipe e comunicação.`);
        }
        if (hasFinance) {
            paragraphs.push(`Os dados financeiros consolidam valores por fornecedor e status, oferecendo uma leitura objetiva sobre compromissos assumidos, pendências e controle orçamentário.`);
        }
        if (hasLists) {
            paragraphs.push(`Listas complementares organizam tarefas, anotações e informações auxiliares, mantendo o contexto operacional acessível e estruturado.`);
        }
        // Encerramento estratégico
        paragraphs.push(`Em conjunto, essas informações fornecem uma base sólida para acompanhamento do projeto, alinhamento com stakeholders e definição de próximos passos.`);
        return {
            title: 'Resumo Executivo',
            type: 'text',
            content: `<div>${paragraphs.join('</div><div>')}</div>` // Melhor formatação HTML para as seções
        };
    }
    // Função que gera contexto baseado no tipo da seção
    generateSectionContext(section) {
        if (section.type === 'text')
            return null;
        let context = '';
        // A lógica de geração de contexto depende do tipo de seção
        switch (section.type) {
            case 'table':
                context = this.generateTableContext(section);
                break;
            case 'list':
                context = this.generateListContext(section);
                break;
        }
        if (!context)
            return null;
        return {
            title: `Análise: ${section.title}`,
            type: 'text',
            content: `<div style="background-color: #f0f0f0; padding: 10px;">${context}</div>` // Formatação de contexto
        };
    }
    // Geração de contexto para seções de tipo "table"
    generateTableContext(section) {
        const rows = section.content?.rows || [];
        const headers = section.content?.headers || [];
        if (rows.length === 0) {
            return `Esta seção foi criada, mas ainda não possui registros cadastrados, o que indica que as informações relacionadas a "${section.title}" ainda estão em fase de definição.`;
        }
        let text = `Esta seção consolida ${rows.length} registro${rows.length > 1 ? 's' : ''}, permitindo uma análise objetiva dos dados apresentados. `;
        // Adicionando lógica para eventos
        if (headers.some(h => h.toLowerCase().includes('evento'))) {
            text += `A organização dessas informações facilita a visualização do calendário, locais e escala dos eventos planejados. `;
        }
        // Adicionando lógica para valores financeiros
        if (headers.some(h => h.toLowerCase().includes('valor'))) {
            text += `Os valores listados ajudam a monitorar o orçamento, identificar concentrações de custo e acompanhar compromissos financeiros. `;
        }
        text += `Essa visão estruturada contribui para decisões mais seguras e melhor controle operacional.`;
        return text;
    }
    // Geração de contexto para seções de tipo "list"
    generateListContext(section) {
        const items = section.content || [];
        const total = items.length;
        let text = `Esta seção organiza ${total} registro${total > 1 ? 's' : ''} em formato de lista, relacionados a "${section.title}". `;
        const withDescription = items.filter(i => i.description).length;
        if (withDescription > 0) {
            text += `${withDescription} item${withDescription > 1 ? 's possuem' : ' possui'} descrição detalhada, enriquecendo o contexto e facilitando a compreensão. `;
        }
        text += `Esse agrupamento auxilia no acompanhamento operacional e na organização de informações complementares.`;
        return text;
    }
}
exports.ReportNarrativeRules = ReportNarrativeRules;
