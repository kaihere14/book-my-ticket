import { Router } from "express";
import { getAllUsers, registerUser } from "../controllers/users.controller.mjs";

const router = Router();

router.get("/users", getAllUsers);
router.post("/users", registerUser);

export default router;
