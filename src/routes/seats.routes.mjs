import { Router } from "express";
import { getAllSeats, bookSeat } from "../controllers/seats.controller.mjs";

const router = Router();

router.get("/seats", getAllSeats);
router.put("/:id/:name", bookSeat);

export default router;
