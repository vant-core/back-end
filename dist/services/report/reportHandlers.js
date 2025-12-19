"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const report_service_1 = __importDefault(require("../report.service"));
const reportContentGenerator_1 = __importDefault(require("./reportContentGenerator"));
const prisma = new client_1.PrismaClient();
class ReportHandler {
    async handleGenerateReport(args, userId) {
        try {
            console.log('🎯 Iniciando geração de relatório:', { userId, folderId: args.folderId });
            // 1️⃣ Buscar dados do workspace
            const workspaceData = await this.fetchWorkspaceData(userId, args.folderId);
            console.log(`📊 Dados coletados: ${workspaceData.totalItems} itens, ${workspaceData.sections.length} seções`);
            // 2️⃣ Gerar relatório completo com novo gerador (Cards + Panorama + Insights)
            const enrichedSections = await reportContentGenerator_1.default.generateCompleteReport({
                title: args.title || 'Relatório do Workspace',
                totalItems: workspaceData.totalItems,
                sections: workspaceData.sections
            });
            console.log(`✨ Seções enriquecidas: ${enrichedSections.length} seções`);
            // 3️⃣ Montar estrutura final do relatório
            const reportData = {
                title: args.title || 'Relatório do Workspace',
                subtitle: args.subtitle || 'Análise consolidada das informações organizadas',
                generatedAt: new Date().toISOString(),
                sections: enrichedSections,
                metadata: {
                    userId,
                    folderId: args.folderId,
                    totalItems: workspaceData.totalItems
                }
            };
            // 4️⃣ Renderizar HTML
            const html = await report_service_1.default.generateHTML(reportData, args.config);
            console.log('✅ Relatório gerado com sucesso!');
            return {
                success: true,
                message: 'Relatório gerado com sucesso!',
                html,
                data: reportData
            };
        }
        catch (error) {
            console.error('❌ Erro ao gerar relatório:', error);
            return {
                success: false,
                message: 'Erro ao gerar relatório.',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            };
        }
    }
    /**
     * 📊 Busca e estrutura dados do workspace
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
            console.log(`📁 Total de itens: ${totalItems}`);
            return { sections, totalItems };
        }
        catch (error) {
            console.error('❌ Erro ao buscar dados do workspace:', error);
            throw error;
        }
    }
    /**
     * 🔍 Encontra pasta por caminho hierárquico
     */
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
    /**
     * 🎨 Formata seção da pasta baseado no tipo de conteúdo
     */
    formatFolderSection(folder, parentName) {
        const fullName = parentName ? `${parentName} > ${folder.name}` : folder.name;
        console.log(`🎨 Formatando seção: ${fullName} (${folder.items?.length || 0} itens)`);
        // Seção vazia
        if (!folder.items || folder.items.length === 0) {
            return {
                title: fullName,
                type: 'text',
                content: '<p style="color: #94a3b8; font-style: italic;">Nenhum item registrado nesta pasta até o momento.</p>'
            };
        }
        // Formatação específica por tipo de pasta
        if (folder.name.toLowerCase().includes('evento') ||
            folder.name.toLowerCase().includes('aniversario') ||
            folder.name.toLowerCase().includes('aniversário')) {
            return this.formatEventsTable(fullName, folder.items);
        }
        if (folder.name.toLowerCase().includes('financeiro') ||
            folder.name.toLowerCase().includes('pagamento')) {
            return this.formatFinancialTable(fullName, folder.items);
        }
        // Formato padrão: lista
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
    /**
     * 📅 Formata tabela de eventos
     */
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
    /**
     * 💰 Formata tabela financeira
     */
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
        // Calcula total
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
    /**
     * 📝 Formata conteúdo do item para exibição
     */
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
    /**
     * 💵 Formata valores monetários
     */
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
