"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const eventRegistration_controller_1 = __importDefault(require("../controllers/eventRegistration.controller"));
const auth_midd_1 = __importDefault(require("../middlewares/auth.midd"));
const router = (0, express_1.Router)();
router.get("/", auth_midd_1.default, eventRegistration_controller_1.default.list);
router.post("/", auth_midd_1.default, eventRegistration_controller_1.default.create);
exports.default = router;
