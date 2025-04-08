const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
    app.use(
        "/oidc/",
        createProxyMiddleware({
            target: "http://localhost:15000/",
        })
    );

    app.use('/code-flow-duendesoftware', (req, res, next) => {
        res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
        res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
        next();
    });
};
