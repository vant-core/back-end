"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const file_controller_1 = __importDefault(require("../controllers/file.controller"));
const auth_midd_1 = __importDefault(require("../middlewares/auth.midd"));
const router = (0, express_1.Router)();
/**
 * @route   GET /api/files/download/:fileName
 * @desc    Baixa um arquivo gerado pela IA
 * @access  Private
 */
router.get('/download/:fileName', auth_midd_1.default, file_controller_1.default.downloadFile);
/**
 * @route   GET /api/files/list
 * @desc    Lista todos os arquivos (opcional - útil para debug)
 * @access  Private
 */
router.get('/list', auth_midd_1.default, file_controller_1.default.listFiles);
exports.default = router;
