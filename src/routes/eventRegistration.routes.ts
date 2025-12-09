import { Router } from "express";
import EventRegistrationController from "../controllers/eventRegistration.controller";
import authMiddleware from "../middlewares/auth.midd";

const router = Router();

router.get("/", authMiddleware, EventRegistrationController.list);
router.post("/", authMiddleware, EventRegistrationController.create);

export default router;
