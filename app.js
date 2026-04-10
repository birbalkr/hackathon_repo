
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

const port = process.env.PORT || 3000;

app.use(session({
	secret: "123456",
	resave: true,
	saveUninitialized: true,
	proxy: true
}));

// Configure express application to use passportjs
app.use(passport.initialize());
app.use(passport.session());

let webAppStrategy = new WebAppStrategy(getAppIDConfig());
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
	res.send('Authentication Error');
});

app.listen(port, () => {
	console.log("Listening on http://localhost:" + port);
});

function getAppIDConfig() {
	let config;

	try {
		// if running locally we'll have the local config file
		config = require('./localdev-config.json');
	} catch (e) {
		if (process.env.APPID_SERVICE_BINDING) { // if running on Kubernetes this env variable would be defined
			config = JSON.parse(process.env.APPID_SERVICE_BINDING);
			config.redirectUri = process.env.redirectUri;
		} else { // running on CF
			let vcapApplication = JSON.parse(process.env["VCAP_APPLICATION"]);
			return { "redirectUri": "https://" + vcapApplication["application_uris"][0] + CALLBACK_URL };
		}
	}
	return config;
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
