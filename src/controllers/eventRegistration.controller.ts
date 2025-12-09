import { Response } from "express";
import EventRegistrationService from "../services/eventRegistration.service";
import { AuthRequest } from "../types/user";

class EventRegistrationController {

  async list(req: AuthRequest, res: Response) {
    const userId = req.user!.id;

    const regs = await EventRegistrationService.getByUser(userId);

    res.json({
      success: true,
      data: regs
    });
  }

  async create(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    const { data, conversationId } = req.body;

    const reg = await EventRegistrationService.create(data, userId, conversationId);

    res.json({
      success: true,
      data: reg
    });
  }
  
}

export default new EventRegistrationController();
