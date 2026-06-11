"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGame = exports.updateGame = exports.createGame = exports.getAllGames = exports.getPublicGames = void 0;
const game_service_1 = require("../services/game.service");
const getPublicGames = async (req, res) => {
    try {
        const games = await game_service_1.GameService.getAll(true);
        res.json({ success: true, games });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getPublicGames = getPublicGames;
const getAllGames = async (req, res) => {
    try {
        const games = await game_service_1.GameService.getAll();
        res.json({ success: true, games });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAllGames = getAllGames;
const createGame = async (req, res) => {
    try {
        const game = await game_service_1.GameService.create(req.body, req.user.userId);
        res.status(201).json({ success: true, game });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.createGame = createGame;
const updateGame = async (req, res) => {
    try {
        const id = req.params.id;
        const game = await game_service_1.GameService.update(id, req.body, req.user.userId);
        res.json({ success: true, game });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.updateGame = updateGame;
const deleteGame = async (req, res) => {
    try {
        const id = req.params.id;
        await game_service_1.GameService.delete(id, req.user.userId);
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.deleteGame = deleteGame;
