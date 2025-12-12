"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const report_controller_1 = __importDefault(require("../controllers/report.controller"));
const router = (0, express_1.Router)();
// Preview do relatório (retorna HTML)
router.post('/preview', report_controller_1.default.preview);
// Gerar PDF a partir dos dados do workspace
router.post('/generate-pdf', report_controller_1.default.generatePDF);
// Gerar PDF a partir de HTML customizado
router.post('/generate-from-html', report_controller_1.default.generateFromHTML);
exports.default = router;
