import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import listingsRouter from "./listings";
import messagesRouter from "./messages";
import transactionsRouter from "./transactions";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(listingsRouter);
router.use(messagesRouter);
router.use(transactionsRouter);
router.use(usersRouter);

export default router;
