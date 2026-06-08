"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = exports.deleteUser = exports.updateUserRole = exports.getAllUsers = void 0;
const user_service_1 = require("../services/user.service");
const getAllUsers = async (req, res) => {
    try {
        const users = await user_service_1.UserService.getAll();
        res.json({ success: true, users });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAllUsers = getAllUsers;
const updateUserRole = async (req, res) => {
    try {
        const id = req.params.id;
        const { role } = req.body;
        const user = await user_service_1.UserService.updateRole(id, role, req.user.userId);
        res.json({ success: true, user });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.updateUserRole = updateUserRole;
const deleteUser = async (req, res) => {
    try {
        const id = req.params.id;
        await user_service_1.UserService.delete(id, req.user.userId);
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.deleteUser = deleteUser;
const getDashboardStats = async (req, res) => {
    try {
        const stats = await user_service_1.UserService.getDashboardStats();
        res.json({ success: true, stats });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getDashboardStats = getDashboardStats;
