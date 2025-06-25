// utils/ExpressError.js
class ExpressError extends Error {
    constructor(statusCode, message) {
        super();
        this.name = 'ExpressError';
        this.statusCode = statusCode;
        this.message = message;
        this.stack = (new Error()).stack;
    }
}

module.exports = ExpressError;
