"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePaymentMethod = exports.getPublicPaymentMethods = exports.getAllPaymentMethods = void 0;
const payment_service_1 = require("../services/payment.service");
const getAllPaymentMethods = async (req, res) => {
    try {
        const methods = await payment_service_1.PaymentService.getAllAdmin();
        res.json({ success: true, methods });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAllPaymentMethods = getAllPaymentMethods;
const getPublicPaymentMethods = async (req, res) => {
    try {
        const category = req.query.category;
        const methods = await payment_service_1.PaymentService.getAllActive(category);
        res.json({ success: true, methods });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getPublicPaymentMethods = getPublicPaymentMethods;
const updatePaymentMethod = async (req, res) => {
    try {
        const id = req.params.id;
        const method = await payment_service_1.PaymentService.update(id, req.body, req.user.userId);
        res.json({ success: true, method });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.updatePaymentMethod = updatePaymentMethod;
