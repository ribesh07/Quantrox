"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const logger_1 = require("../utils/logger");
const logger = (req, res, next) => {
    return (0, logger_1.expressLogger)(req, res, next);
};
exports.logger = logger;
