"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = __importDefault(require("../controllers/auth.controller"));
const auth_midd_1 = __importDefault(require("../middlewares/auth.midd"));
const validators_1 = require("../utils/validators");
const router = (0, express_1.Router)();
router.post('/register', validators_1.validateRegister, validators_1.handleValidationErrors, auth_controller_1.default.register);
router.post('/login', validators_1.validateLogin, validators_1.handleValidationErrors, auth_controller_1.default.login);
router.get('/me', auth_midd_1.default, auth_controller_1.default.me);
exports.default = router;
