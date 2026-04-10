const express = require("express");
const session = require("express-session");
const passport = require("passport");
const appID = require("ibmcloud-appid");

const WebAppStrategy = appID.WebAppStrategy;

const app = express();

// ✅ Callback URL
const CALLBACK_URL = "/ibm/cloud/appid/callback";

// ✅ Use Render port
const PORT = process.env.PORT || 3000;

// ✅ Session config
app.use(session({
    secret: "123456",
    resave: true,
    saveUninitialized: true,
    proxy: true
}));

// ✅ Passport setup
app.use(passport.initialize());
app.use(passport.session());

// ✅ App ID Strategy
const webAppStrategy = new WebAppStrategy(getAppIDConfig());
passport.use(webAppStrategy);

passport.serializeUser((user, cb) => cb(null, user));
passport.deserializeUser((obj, cb) => cb(null, obj));

// ✅ Callback route
app.get(
    CALLBACK_URL,
    passport.authenticate(WebAppStrategy.STRATEGY_NAME, {
        failureRedirect: "/error",
        session: false
    })
);

// ✅ Protect routes
app.use(
    "/protected",
    passport.authenticate(WebAppStrategy.STRATEGY_NAME, {
        session: false
    })
);

// ✅ Public files
app.use(express.static("public"));

// ✅ Protected files
app.use("/protected", express.static("protected"));

// ✅ Logout
app.get("/logout", (req, res) => {
    req._sessionManager = false;
    WebAppStrategy.logout(req);
    res.clearCookie("refreshToken");
    res.redirect("/");
});

// ✅ API route
app.get("/protected/api/idPayload", (req, res) => {
    res.send(
        req.session[WebAppStrategy.AUTH_CONTEXT].identityTokenPayload
    );
});

// ✅ Error route
app.get("/error", (req, res) => {
    res.send("Authentication Error");
});

// ✅ Start server
app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});

// ✅ App ID Config (Render compatible)
function getAppIDConfig() {
    const config = JSON.parse(process.env.APPID_SERVICE_BINDING);

    config.redirectUri = process.env.REDIRECT_URI;

    return config;
}