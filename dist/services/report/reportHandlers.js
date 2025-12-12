"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/handlers/reportHandler.ts
const client_1 = require("@prisma/client");
const report_service_1 = __importDefault(require("../../services/report/report.service"));
const prisma = new client_1.PrismaClient();
class ReportHandler {
    /**
     * Handler principal chamado pelo OpenAI quando a função generate_report é acionada
     */
    async handleGenerateReport(args, userId) {
        try {
            console.log('🔵 Gerando relatório para:', { userId, args });
            // 1. Buscar dados do workspace
            const workspaceData = await this.fetchWorkspaceData(userId, args.folderId);
            console.log('📊 Dados do workspace coletados:', {
                totalSections: workspaceData.sections.length,
                totalItems: workspaceData.totalItems
            });
            // 2. Gerar análises contextuais com IA local para cada seção (sem cards)
            const enrichedSections = await this.enrichSectionsWithAI(workspaceData.sections);
            // 3. Criar um resumo executivo textual corrido baseado no conjunto de seções
            const executiveSummary = this.generateExecutiveSummary(enrichedSections, workspaceData.totalItems, args.title);
            const finalSections = [
                executiveSummary,
                ...enrichedSections
            ];
            // 4. Montar ReportData
            const reportData = {
                title: args.title || 'Relatório do Workspace',
                subtitle: args.subtitle || 'Análise consolidada das informações organizadas',
                generatedAt: new Date().toISOString(),
                sections: finalSections,
                metadata: {
                    userId,
                    folderId: args.folderId,
                    totalItems: workspaceData.totalItems
                }
            };
            // 5. Gerar HTML
            const html = await report_service_1.default.generateHTML(reportData, args.config);
            console.log('✅ Relatório gerado com sucesso');
            console.log('📄 Seções incluídas:', finalSections.map(s => s.title).join(', '));
            return {
                success: true,
                message: 'Relatório gerado com sucesso! Você pode visualizá-lo agora.',
                html,
                data: reportData
            };
        }
        catch (error) {
            console.error('❌ Erro ao gerar relatório:', error);
            return {
                success: false,
                message: 'Erro ao gerar relatório. Tente novamente.',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            };
        }
    }
    /**
     * Enriquece seções com análises contextuais geradas localmente
     */
    async enrichSectionsWithAI(sections) {
        const enriched = [];
        for (const section of sections) {
            // NÃO existe mais seção de cards aqui (remoção do resumo feio)
            // Para cada seção, adiciona contexto antes dos dados
            const contextSection = await this.generateContextForSection(section);
            if (contextSection) {
                enriched.push(contextSection);
            }
            enriched.push(section);
        }
        return enriched;
    }
    /**
     * Gera um resumo executivo geral, em texto corrido, com base nas seções
     */
    generateExecutiveSummary(sections, totalItems, title) {
        const totalSections = sections.length;
        const eventSections = sections.filter(s => s.title.toLowerCase().includes('evento'));
        const financialSections = sections.filter(s => s.title.toLowerCase().includes('financeiro'));
        const listSections = sections.filter(s => s.type === 'list');
        const partes = [];
        partes.push(`Este relatório apresenta uma visão consolidada do workspace${title ? ` focado em "${title}"` : ''}, destacando os principais elementos registrados até o momento.`);
        if (totalItems > 0) {
            partes.push(`Ao todo, foram considerados ${totalItems} item${totalItems > 1 ? 's' : ''} cadastrados em diferentes pastas e categorias.`);
        }
        if (eventSections.length > 0) {
            partes.push(`Foram identificadas seções diretamente relacionadas a eventos, contemplando informações como datas, locais e número de participantes, o que permite uma leitura clara do calendário e da dimensão de cada iniciativa.`);
        }
        if (financialSections.length > 0) {
            partes.push(`Há também blocos de dados financeiros, que reúnem valores por item e fornecedor, facilitando o acompanhamento de orçamento, compromissos assumidos e status de pagamentos.`);
        }
        if (listSections.length > 0) {
            partes.push(`Além disso, listas complementares reúnem anotações, tarefas e registros diversos, ajudando a manter o contexto operacional organizado em torno de cada evento ou área de trabalho.`);
        }
        partes.push(`Em conjunto, essas informações fornecem uma visão estruturada do planejamento, execução e controle dos eventos, servindo como base para tomada de decisão, alinhamento com o cliente e identificação de próximos passos.`);
        return {
            title: 'Resumo Executivo',
            type: 'text',
            content: `<div style="margin-bottom: 24px;">
        <p style="line-height:1.6; color:#374151;">
          ${partes.join(' ')}
        </p>
      </div>`
        };
    }
    /**
     * Gera contexto descritivo para uma seção usando regras locais
     */
    async generateContextForSection(section) {
        try {
            let contextText = '';
            if (section.type === 'table' && section.content.rows && section.content.rows.length > 0) {
                const rows = section.content.rows;
                const headers = section.content.headers;
                if (headers.includes('Evento') || section.title.toLowerCase().includes('evento')) {
                    contextText = this.generateEventContext(rows, section.title);
                }
                else if (headers.includes('Valor') || section.title.toLowerCase().includes('financeiro')) {
                    contextText = this.generateFinancialContext(rows, section.title);
                }
            }
            else if (section.type === 'list' && section.content.length > 0) {
                contextText = this.generateListContext(section.content, section.title);
            }
            else if (section.type === 'text') {
                // já é texto, não precisa de outra camada
                return null;
            }
            if (!contextText)
                return null;
            return {
                title: `Análise: ${section.title}`,
                type: 'text',
                content: `<div style="background:#f3f4ff; border-left:4px solid #3b82f6; padding:12px 16px; margin-bottom:16px; border-radius:4px;">
          <p style="margin:0; line-height:1.5; color:#1f2933;">${contextText}</p>
        </div>`
            };
        }
        catch (error) {
            console.error('Erro ao gerar contexto:', error);
            return null;
        }
    }
    /**
     * Contexto para eventos
     */
    generateEventContext(rows, sectionTitle) {
        const totalEvents = rows.length;
        let context = `Esta seção reúne informações de ${totalEvents} evento${totalEvents > 1 ? 's' : ''} planejado${totalEvents > 1 ? 's' : ''}, permitindo uma leitura rápida do calendário e da escala de participação. `;
        const eventDetails = [];
        for (const row of rows) {
            const [nome, data, local, participantes] = row;
            if (nome && nome !== '-') {
                let detail = `${nome}`;
                const parts = [];
                if (participantes && participantes !== '-') {
                    parts.push(`${participantes} participante${participantes !== '1' ? 's' : ''}`);
                }
                if (data && data !== '-') {
                    parts.push(`agendado para ${data}`);
                }
                if (local && local !== '-') {
                    parts.push(`no local ${local}`);
                }
                if (parts.length > 0) {
                    detail += ` — ${parts.join(', ')}`;
                }
                eventDetails.push(detail);
            }
        }
        if (eventDetails.length > 0) {
            context += `Entre os destaques, podemos citar: ${eventDetails.join('; ')}.`;
        }
        const totalParticipantes = rows.reduce((sum, row) => {
            const num = parseInt(row[3]) || 0;
            return sum + num;
        }, 0);
        if (totalParticipantes > 0) {
            context += ` No conjunto, estima-se um público total aproximado de ${totalParticipantes} participantes.`;
        }
        context += ` Esses dados ajudam a dimensionar necessidades de infraestrutura, equipe e comunicação para cada ocasião.`;
        return context;
    }
    /**
     * Contexto para dados financeiros
     */
    generateFinancialContext(rows, sectionTitle) {
        const linhasValidas = rows.filter(r => r[0] !== '');
        const totalRows = linhasValidas.length;
        let context = `Esta seção consolida ${totalRows} lançamento${totalRows > 1 ? 's' : ''} financeiro${totalRows > 1 ? 's' : ''}, agrupando valores, fornecedores e status de pagamento. `;
        const totalRow = rows.find(r => r[0] === '');
        if (totalRow && totalRow[2]) {
            context += `O somatório atual indica um comprometimento financeiro de ${totalRow[2]}. `;
        }
        const fornecedores = new Set(linhasValidas
            .filter(r => r[1] && r[1] !== '-' && r[1] !== 'TOTAL')
            .map(r => r[1]));
        if (fornecedores.size > 0) {
            context += `Foram identificados ${fornecedores.size} fornecedor${fornecedores.size > 1 ? 'es' : ''} distintos, o que mostra diversificação de parceiros envolvidos. `;
        }
        const pendentes = linhasValidas.filter(r => r[3] && r[3].toLowerCase().includes('pendent')).length;
        const pagos = linhasValidas.filter(r => r[3] &&
            (r[3].toLowerCase().includes('pag') ||
                r[3].toLowerCase().includes('conclu'))).length;
        if (pendentes > 0 || pagos > 0) {
            context += `Em relação ao status dos pagamentos, ${pagos} registro${pagos !== 1 ? 's estão' : ' está'} marcado${pagos !== 1 ? 's' : ''} como pago/concluído e ${pendentes} como pendente${pendentes !== 1 ? 's' : ''}. Esse panorama contribui para monitorar fluxo de caixa e próximos desembolsos.`;
        }
        return context;
    }
    /**
     * Contexto para listas
     */
    generateListContext(content, sectionTitle) {
        const totalItems = content.length;
        let context = `Esta seção organiza ${totalItems} registro${totalItems > 1 ? 's' : ''} em formato de lista, reunindo informações complementares relacionadas a "${sectionTitle}". `;
        const itemsWithDescription = content.filter(item => item.description && item.description !== '-').length;
        const itemsWithTags = content.filter(item => item.tags && item.tags.length > 0).length;
        if (itemsWithDescription > 0) {
            context += `${itemsWithDescription} item${itemsWithDescription > 1 ? 's contam' : ' conta'} com descrição detalhada, o que facilita a compreensão do contexto. `;
        }
        if (itemsWithTags > 0) {
            context += `${itemsWithTags} registro${itemsWithTags > 1 ? 's estão' : ' está'} etiquetado${itemsWithTags > 1 ? 's' : ''}, permitindo filtragens e buscas mais rápidas por tema ou categoria.`;
        }
        return context;
    }
    /**
     * Busca e estrutura dados do workspace
     */
    async fetchWorkspaceData(userId, folderId) {
        const sections = [];
        let totalItems = 0;
        try {
            console.log('🔍 Buscando dados do workspace:', { userId, folderId });
            // Path tipo "Eventos/Aniversario"
            if (folderId && folderId.includes('/')) {
                console.log('📂 Detectado path hierárquico:', folderId);
                const folderNames = folderId.split('/').map(name => name.trim());
                let currentFolder = await this.findFolderByPath(userId, folderNames);
                if (currentFolder) {
                    console.log('✅ Pasta encontrada:', currentFolder.name);
                    const folderWithItems = await prisma.folder.findUnique({
                        where: { id: currentFolder.id },
                        include: {
                            items: true,
                            subFolders: {
                                include: {
                                    items: true
                                }
                            }
                        }
                    });
                    if (folderWithItems) {
                        sections.push(this.formatFolderSection(folderWithItems));
                        totalItems = folderWithItems.items.length;
                        for (const subFolder of folderWithItems.subFolders) {
                            sections.push(this.formatFolderSection(subFolder, folderWithItems.name));
                            totalItems += subFolder.items.length;
                        }
                    }
                }
                else {
                    console.warn('⚠️ Pasta não encontrada pelo path:', folderId);
                }
            }
            // UUID direto
            else if (folderId) {
                console.log('🔑 Buscando pasta por ID:', folderId);
                const folder = await prisma.folder.findUnique({
                    where: { id: folderId, userId },
                    include: {
                        items: true,
                        subFolders: {
                            include: {
                                items: true
                            }
                        }
                    }
                });
                if (folder) {
                    console.log('✅ Pasta encontrada:', folder.name);
                    sections.push(this.formatFolderSection(folder));
                    totalItems = folder.items.length;
                    for (const subFolder of folder.subFolders) {
                        sections.push(this.formatFolderSection(subFolder, folder.name));
                        totalItems += subFolder.items.length;
                    }
                }
            }
            // Todas as pastas do usuário
            else {
                console.log('📊 Buscando todas as pastas do usuário');
                const rootFolders = await prisma.folder.findMany({
                    where: {
                        userId,
                        parentId: null
                    },
                    include: {
                        items: true,
                        subFolders: {
                            include: {
                                items: true,
                                subFolders: {
                                    include: {
                                        items: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                });
                console.log(`✅ Encontradas ${rootFolders.length} pastas raiz`);
                for (const folder of rootFolders) {
                    if (folder.items.length > 0) {
                        sections.push(this.formatFolderSection(folder));
                        totalItems += folder.items.length;
                    }
                    for (const subFolder of folder.subFolders) {
                        if (subFolder.items.length > 0) {
                            sections.push(this.formatFolderSection(subFolder, folder.name));
                            totalItems += subFolder.items.length;
                        }
                        if (subFolder.subFolders) {
                            for (const subSubFolder of subFolder.subFolders) {
                                if (subSubFolder.items.length > 0) {
                                    sections.push(this.formatFolderSection(subSubFolder, `${folder.name} > ${subFolder.name}`));
                                    totalItems += subSubFolder.items.length;
                                }
                            }
                        }
                    }
                }
            }
            console.log(`📊 Total de seções criadas: ${sections.length}`);
            console.log(`📝 Total de itens: ${totalItems}`);
            return { sections, totalItems };
        }
        catch (error) {
            console.error('❌ Erro ao buscar dados do workspace:', error);
            throw error;
        }
    }
    async findFolderByPath(userId, folderNames) {
        let currentFolder = null;
        let parentId = null;
        for (const name of folderNames) {
            const folder = await prisma.folder.findFirst({
                where: {
                    userId,
                    name: {
                        equals: name,
                        mode: 'insensitive'
                    },
                    parentId
                }
            });
            if (!folder) {
                console.warn(`⚠️ Pasta "${name}" não encontrada no nível atual`);
                return null;
            }
            currentFolder = folder;
            parentId = folder.id;
        }
        return currentFolder;
    }
    formatFolderSection(folder, parentName) {
        const fullName = parentName ? `${parentName} > ${folder.name}` : folder.name;
        console.log(`🎨 Formatando seção: ${fullName} (${folder.items?.length || 0} itens)`);
        if (!folder.items || folder.items.length === 0) {
            return {
                title: fullName,
                type: 'text',
                content: '<p style="color: #94a3b8; font-style: italic;">Nenhum item registrado nesta pasta até o momento.</p>'
            };
        }
        if (folder.name.toLowerCase().includes('evento') ||
            folder.name.toLowerCase().includes('aniversario')) {
            return this.formatEventsTable(fullName, folder.items);
        }
        if (folder.name.toLowerCase().includes('financeiro') ||
            folder.name.toLowerCase().includes('pagamento')) {
            return this.formatFinancialTable(fullName, folder.items);
        }
        return {
            title: fullName,
            type: 'list',
            content: folder.items.map((item) => ({
                title: item.title,
                description: this.formatItemContent(item.content),
                tags: item.tags || []
            }))
        };
    }
    formatEventsTable(title, items) {
        const rows = items.map((item) => {
            const content = item.content;
            return [
                item.title,
                content.data || content.dataRealizacao || content.dataRealização || '-',
                content.local || content.cidade || content.região || '-',
                content.participantes?.toString() ||
                    content.numeroParticipantes?.toString() ||
                    content.númeroParticipantes?.toString() ||
                    '-'
            ];
        });
        return {
            title,
            type: 'table',
            content: {
                headers: ['Evento', 'Data', 'Local', 'Participantes'],
                rows
            }
        };
    }
    formatFinancialTable(title, items) {
        const rows = items.map((item) => {
            const content = item.content;
            const valor = content.valor || content.preco || content.preço || content.total || 0;
            return [
                item.title,
                content.fornecedor ||
                    content.responsavel ||
                    content.responsável ||
                    '-',
                this.formatCurrency(valor),
                content.status ||
                    content.situacao ||
                    content.situação ||
                    'Pendente'
            ];
        });
        const total = items.reduce((sum, item) => {
            const valor = item.content.valor ||
                item.content.preco ||
                item.content.preço ||
                item.content.total ||
                0;
            const numValue = typeof valor === 'string'
                ? parseFloat(valor.toString().replace(/[^\d,.-]/g, '').replace(',', '.'))
                : valor;
            return sum + numValue;
        }, 0);
        rows.push(['', 'TOTAL', this.formatCurrency(total), '']);
        return {
            title,
            type: 'table',
            content: {
                headers: ['Item', 'Fornecedor/Responsável', 'Valor', 'Status'],
                rows
            }
        };
    }
    formatItemContent(content) {
        if (typeof content === 'string')
            return content;
        const formatted = [];
        for (const [key, value] of Object.entries(content)) {
            if (value) {
                const label = key.charAt(0).toUpperCase() +
                    key.slice(1).replace(/([A-Z])/g, ' $1');
                formatted.push(`${label}: ${value}`);
            }
        }
        return formatted.join(' • ');
    }
    formatCurrency(value) {
        const num = typeof value === 'string'
            ? parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.'))
            : value;
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(num);
    }
}
exports.default = new ReportHandler();
