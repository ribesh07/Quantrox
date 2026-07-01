import { AuthRequest } from "../middleware/auth.middleware";
import { Response } from "express";
import { GameIdRequestService } from "../services/game-id-request.service";
import { AuditLogService } from "../services/audit-log.service";
import { paramString, queryInt, queryString } from "../utils/request";

export const createGameIdRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { gameId, requestType, gameUsername, email, password } = req.body;

    if (!gameId) {
      return res.status(400).json({ success: false, message: "Game ID is required" });
    }

    if (!requestType) {
      return res.status(400).json({ success: false, message: "Request type is required" });
    }

    if (requestType === "GAME_ID" && !gameUsername?.trim()) {
      return res.status(400).json({ success: false, message: "Game username/ID is required" });
    }

    if (requestType === "EMAIL_PASSWORD") {
      if (!email?.trim()) {
        return res.status(400).json({ success: false, message: "Email is required" });
      }
      if (!password?.trim()) {
        return res.status(400).json({ success: false, message: "Password is required" });
      }
    }

    const request = await GameIdRequestService.create({
      userId: req.user!.userId,
      gameId,
      requestType,
      gameUsername: gameUsername?.trim(),
      email: email?.trim(),
      password: password?.trim(),
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

    res.json({ success: true, request });
  } catch (error) {
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
    const { response } = req.body;

    if (!response?.trim()) {
      return res.status(400).json({ success: false, message: "Response is required" });
    }

    const request = await GameIdRequestService.approve(id, req.user!.userId, response.trim());

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
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to approve game ID request" });
  }
};

export const rejectGameIdRequest = async (req: AuthRequest, res: Response) => {
  try {
    const id = paramString(req.params.id);
    const { response } = req.body;

    if (!response?.trim()) {
      return res.status(400).json({ success: false, message: "Response is required" });
    }

    const request = await GameIdRequestService.reject(id, req.user!.userId, response.trim());

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
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to reject game ID request" });
  }
};