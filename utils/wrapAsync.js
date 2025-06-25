// utils/wrapAsync.js
module.exports = function wrapAsync(fn) {
    return function (req, res, next) {
        fn(req, res, next).catch(err => {
            console.error('Async Error:', err);
            next(err);
        });
    };
};
