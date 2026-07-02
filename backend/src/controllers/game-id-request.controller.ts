import { AuthRequest } from "../middleware/auth.middleware";
import { Response } from "express";
import { GameIdRequestService } from "../services/game-id-request.service";
import { AuditLogService } from "../services/audit-log.service";
import { GameService } from "../services/game.service";
import { createGameIdRequestSchema, gameIdRequestResponseSchema } from "../shared/schemas";
import { paramString, queryInt, queryString } from "../utils/request";
import { ZodError } from "zod";

const formatValidationError = (error: ZodError) =>
  error.issues.map((issue) => issue.message).join(", ");

export const createGameIdRequest = async (req: AuthRequest, res: Response) => {
  try {
    const validated = createGameIdRequestSchema.parse(req.body);

    const game = await GameService.getById(validated.gameId);
    if (!game || !game.active) {
      return res.status(400).json({ success: false, message: "Invalid or inactive game" });
    }

    const request = await GameIdRequestService.create({
      userId: req.user!.userId,
      gameId: validated.gameId,
      requestType: validated.requestType,
      gameUsername: validated.requestType === "GAME_ID" ? validated.gameUsername : undefined,
      email: validated.requestType === "EMAIL_PASSWORD" ? validated.email : undefined,
      password: validated.requestType === "EMAIL_PASSWORD" ? validated.password : undefined,
    });

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: "CREATE_GAME_ID_REQUEST",
      resource: "GAME_ID_REQUEST",
      resourceId: request.id,
      result: "SUCCESS",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json({ success: true, request });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, message: formatValidationError(error) });
    }
    console.error("Create game ID request error:", error);
    res.status(500).json({ success: false, message: "Failed to create game ID request" });
  }
};

export const getMyGameIdRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { status, limit, offset } = req.query;
    const result = await GameIdRequestService.getByUserId(req.user!.userId, {
      status: status as any,
      limit: queryInt(limit),
      offset: queryInt(offset),
    });
    res.json({ success: true, requests: result.requests, count: result.count });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get game ID requests" });
  }
};

export const getAllGameIdRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { status, userId, limit, offset } = req.query;
    const result = await GameIdRequestService.getAll({
      status: status as any,
      userId: queryString(userId),
      limit: queryInt(limit),
      offset: queryInt(offset),
    });
    res.json({ success: true, requests: result.requests, count: result.count });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get game ID requests" });
  }
};

export const approveGameIdRequest = async (req: AuthRequest, res: Response) => {
  try {
    const id = paramString(req.params.id);
    const { response } = gameIdRequestResponseSchema.parse(req.body);

    const request = await GameIdRequestService.approve(id, req.user!.userId, response);

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: "APPROVE_GAME_ID_REQUEST",
      resource: "GAME_ID_REQUEST",
      resourceId: id,
      result: "SUCCESS",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({ success: true, request });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, message: formatValidationError(error) });
    }
    const message = error.message || "Failed to approve game ID request";
    const status = message.includes("not found") || message.includes("already been") ? 400 : 500;
    res.status(status).json({ success: false, message });
  }
};

export const rejectGameIdRequest = async (req: AuthRequest, res: Response) => {
  try {
    const id = paramString(req.params.id);
    const { response } = gameIdRequestResponseSchema.parse(req.body);

    const request = await GameIdRequestService.reject(id, req.user!.userId, response);

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: "REJECT_GAME_ID_REQUEST",
      resource: "GAME_ID_REQUEST",
      resourceId: id,
      result: "SUCCESS",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({ success: true, request });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, message: formatValidationError(error) });
    }
    const message = error.message || "Failed to reject game ID request";
    const status = message.includes("not found") || message.includes("already been") ? 400 : 500;
    res.status(status).json({ success: false, message });
  }
};
