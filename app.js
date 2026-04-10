
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const appID = require("ibmcloud-appid");
const https = require("https");

const WebAppStrategy = appID.WebAppStrategy;

const app = express();

const CALLBACK_URL = "/ibm/cloud/appid/callback";
const EXPECTED_AUDIENCE = "59621db6-6a59-43ec-8ce3-0a56d459f0db";
const FIREBASE_DB_URL = "https://lithe-transport-492814-r5-default-rtdb.europe-west1.firebasedatabase.app";
const LOCALHOST_URI_PATTERN = /localhost|127\.0\.0\.1/i;

const port = process.env.PORT || 10000;

app.use(session({
	secret: "123456",
	resave: true,
	saveUninitialized: true,
	proxy: true
}));

// Configure express application to use passportjs
app.use(passport.initialize());
app.use(passport.session());

const appIdConfig = getAppIDConfig();
validateAppIdRedirectUri(appIdConfig);
let webAppStrategy = new WebAppStrategy(appIdConfig);
passport.use(webAppStrategy);

passport.serializeUser((user, cb) => cb(null, user));
passport.deserializeUser((obj, cb) => cb(null, obj));


app.get(CALLBACK_URL, passport.authenticate(WebAppStrategy.STRATEGY_NAME, { failureRedirect: '/error', session: false }));

// Protect everything under /protected
app.use("/protected", passport.authenticate(WebAppStrategy.STRATEGY_NAME, { session: false }));
app.use("/protected", ensureExpectedAudience);

// This will statically serve pages:
app.use(express.static("public"));

// // This will statically serve the protected page (after authentication, since /protected is a protected area):
app.use('/protected', express.static("protected"));

app.get("/logout", (req, res) => {
	//Note: if you enabled SSO for Cloud Directory be sure to use webAppStrategy.logoutSSO instead.
	req._sessionManager = false;
	WebAppStrategy.logout(req);
	res.clearCookie("refreshToken");
	res.redirect("/");
});

//Serves the identity token payload
app.get("/protected/api/idPayload", (req, res) => {
	const payload = getIdentityPayload(req);
	if (!payload) {
		return res.status(401).json({ error: "Missing identity payload" });
	}

	res.json(payload);
});

app.post("/protected/api/bootstrap-user", async (req, res) => {
	const payload = getIdentityPayload(req);
	if (!payload) {
		return res.status(401).json({ error: "Missing identity payload" });
	}

	const audience = getAudience(payload);
	if (audience !== EXPECTED_AUDIENCE) {
		return res.status(403).json({ error: "Unexpected audience" });
	}

	const subject = payload.sub;
	if (!subject) {
		return res.status(400).json({ error: "Missing user subject" });
	}

	const now = new Date().toISOString();
	const userName = payload.given_name || payload.name || payload.preferred_username || payload.email || "Unknown";
	const preferred = payload.preferred_username || payload.email || userName;

	try {
		const userPath = `/${encodeURIComponent(audience)}/users/${encodeURIComponent(subject)}.json`;
		const existingUser = await firebaseRequest("GET", userPath);
		const userRecord = {
			name: userName,
			username: preferred,
			sub: subject,
			audience,
			createdAt: existingUser && existingUser.createdAt ? existingUser.createdAt : now,
			updatedAt: now,
		};

		await firebaseRequest("PUT", userPath, userRecord);

		const objectsPath = `/${encodeURIComponent(audience)}/objects/${encodeURIComponent(subject)}.json`;
		const existingObjects = await firebaseRequest("GET", objectsPath);

		return res.json({
			ok: true,
			audience,
			sub: subject,
			name: userName,
			hasObjects: !!(existingObjects && typeof existingObjects === "object" && Object.keys(existingObjects).length),
		});
	} catch (error) {
		return res.status(500).json({ error: "Firebase bootstrap failed" });
	}
});

app.get('/error', (req, res) => {
	const activeRedirectUri = (appIdConfig && appIdConfig.redirectUri) || "(not configured)";
	res.status(401).send(
		`Authentication Error\n\nActive redirect URI: ${activeRedirectUri}\n\nRegister this exact URI in IBM App ID -> Manage Authentication -> Authentication Settings -> Web redirect URLs.`,
	);
});

app.get('/appid-runtime', (req, res) => {
	const safe = getSafeAppIdRuntime();
	res.json(safe);
});

app.listen(port, () => {
	console.log("Listening on http://localhost:" + port);
});

function getAppIDConfig() {
	let config = null;
	const explicitRedirectUri = process.env.APPID_REDIRECT_URI;
	const productionRedirectUri = resolveProductionRedirectUri();

	if (process.env.APPID_SERVICE_BINDING) {
		try {
			config = JSON.parse(process.env.APPID_SERVICE_BINDING);
		} catch (error) {
			console.warn("APPID_SERVICE_BINDING is not valid JSON. Falling back to local configuration.");
			config = null;
		}
	} else if (process.env["VCAP_APPLICATION"]) {
		let vcapApplication = JSON.parse(process.env["VCAP_APPLICATION"]);
		config = { "redirectUri": "https://" + vcapApplication["application_uris"][0] + CALLBACK_URL };
	}

	if (!config) {
		try {
			// local fallback when service binding env is not present
			config = require('./localdev-config.json');
		} catch (e) {
			config = {};
		}
	}

	if (explicitRedirectUri) {
		config.redirectUri = explicitRedirectUri;
	} else if (productionRedirectUri) {
		config.redirectUri = productionRedirectUri;
	} else if (process.env.NODE_ENV !== "production" && !config.redirectUri) {
		config.redirectUri = `http://localhost:${port}${CALLBACK_URL}`;
	}

	const resolved = withResolvedRedirectUri(config);
	if (resolved && resolved.redirectUri) {
		console.log("App ID redirect URI:", resolved.redirectUri);
	}

	return resolved;
}

function validateAppIdRedirectUri(config) {
	if (!config || !config.redirectUri) {
		console.warn("App ID redirect URI is missing. Set APPID_REDIRECT_URI or APP_BASE_URL.");
		return;
	}

	if (process.env.NODE_ENV === "production" && LOCALHOST_URI_PATTERN.test(config.redirectUri)) {
		throw new Error(
			`Invalid App ID redirect URI for production: ${config.redirectUri}. Set APPID_REDIRECT_URI to your Render callback URL.`,
		);
	}
}

function getSafeAppIdRuntime() {
	const oauthServerUrl = (appIdConfig && appIdConfig.oauthServerUrl) || null;
	const tenantFromUrl = extractTenantFromOauthUrl(oauthServerUrl);

	return {
		nodeEnv: process.env.NODE_ENV || "(unset)",
		activeRedirectUri: (appIdConfig && appIdConfig.redirectUri) || null,
		clientId: (appIdConfig && appIdConfig.clientId) || null,
		tenantId: (appIdConfig && appIdConfig.tenantId) || tenantFromUrl,
		oauthServerUrl,
		appBaseUrlEnv: process.env.APP_BASE_URL || null,
		publicUrlEnv: process.env.PUBLIC_URL || null,
		renderExternalUrlEnv: process.env.RENDER_EXTERNAL_URL || null,
		renderServiceNameEnv: process.env.RENDER_SERVICE_NAME || null,
		hasAppIdServiceBinding: Boolean(process.env.APPID_SERVICE_BINDING),
	};
}

function extractTenantFromOauthUrl(url) {
	if (!url) return null;
	const parts = String(url).split('/oauth/v4/');
	if (parts.length < 2) return null;
	return parts[1] || null;
}

function withResolvedRedirectUri(config) {
	if (!config || typeof config !== "object") {
		return config;
	}

	const resolved = { ...config };
	const baseUrl =
		process.env.APP_BASE_URL ||
		process.env.PUBLIC_URL ||
		process.env.RENDER_EXTERNAL_URL ||
		(process.env.RENDER_SERVICE_NAME ? `https://${process.env.RENDER_SERVICE_NAME}.onrender.com` : "") ||
		"";

	if (baseUrl) {
		resolved.redirectUri = `${baseUrl.replace(/\/$/, "")}${CALLBACK_URL}`;
	}

	return resolved;
}

function resolveProductionRedirectUri() {
	const baseUrl =
		process.env.APP_BASE_URL ||
		process.env.PUBLIC_URL ||
		process.env.RENDER_EXTERNAL_URL ||
		(process.env.RENDER_SERVICE_NAME ? `https://${process.env.RENDER_SERVICE_NAME}.onrender.com` : "") ||
		"";

	if (!baseUrl) {
		return null;
	}

	return `${baseUrl.replace(/\/$/, "")}${CALLBACK_URL}`;
}

function getIdentityPayload(req) {
	if (!req.session || !req.session[WebAppStrategy.AUTH_CONTEXT]) {
		return null;
	}

	return req.session[WebAppStrategy.AUTH_CONTEXT].identityTokenPayload || null;
}

function getAudience(payload) {
	if (!payload || !payload.aud) {
		return null;
	}

	return Array.isArray(payload.aud) ? payload.aud[0] : payload.aud;
}

function ensureExpectedAudience(req, res, next) {
	const payload = getIdentityPayload(req);
	const audience = getAudience(payload);
	if (audience !== EXPECTED_AUDIENCE) {
		return res.status(403).send("Invalid audience for protected access");
	}

	next();
}

function firebaseRequest(method, path, payload) {
	const target = new URL(path, FIREBASE_DB_URL);

	return new Promise((resolve, reject) => {
		const req = https.request(
			{
				method,
				hostname: target.hostname,
				path: `${target.pathname}${target.search}`,
				headers: {
					"Content-Type": "application/json",
				},
			},
			(resp) => {
				let raw = "";
				resp.on("data", (chunk) => {
					raw += chunk;
				});
				resp.on("end", () => {
					if (resp.statusCode < 200 || resp.statusCode >= 300) {
						reject(new Error(`Firebase request failed with status ${resp.statusCode}`));
						return;
					}

					if (!raw) {
						resolve(null);
						return;
					}

					try {
						resolve(JSON.parse(raw));
					} catch (e) {
						resolve(null);
					}
				});
			},
		);

		req.on("error", reject);
		if (payload !== undefined) {
			req.write(JSON.stringify(payload));
		}
		req.end();
	});
}
