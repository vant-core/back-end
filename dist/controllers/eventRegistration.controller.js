"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const eventRegistration_service_1 = __importDefault(require("../services/eventRegistration.service"));
class EventRegistrationController {
    async list(req, res) {
        const userId = req.user.id;
        const regs = await eventRegistration_service_1.default.getByUser(userId);
        res.json({
            success: true,
            data: regs
        });
    }
    async create(req, res) {
        const userId = req.user.id;
        const { data, conversationId } = req.body;
        const reg = await eventRegistration_service_1.default.create(data, userId, conversationId);
        res.json({
            success: true,
            data: reg
        });
    }
}
exports.default = new EventRegistrationController();
