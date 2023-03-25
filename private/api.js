module.exports = (matchViewers) => {
	// Modules
	const express = require("express");
	const fs = require("fs");
	require('dotenv').config()
	const countAllFragments = require("../helpers/countAllFragments")


	// Instances
	const server = express();

	// Pages
	server.get("/matches", async (req, res) => {
		let matches = fs.readdirSync("./bin");
		let response = [];

		for (let match of matches) {
			let stat = fs.statSync("./bin/" + match);
			if (stat.isDirectory() === false) {
				continue;
			}

			if (fs.existsSync("./bin/" + match + "/config.json") === false) {
				console.log("Match " + match + " not ready - Skipping");
				continue;
			}

			// Here filter the display retention days (14)
			if ((Date.now() - stat.mtimeMs) > (14 * 24 * 60 * 60 * 1000)) {
				console.log("Match " + match + " is too old");
				continue;
			}

			let json = JSON.parse(fs.readFileSync("./bin/" + match + "/config.json"));

			// Calcultate numbers of full frames if TIMEONLINE and if not yet set 
			if ((Date.now() - stat.mtimeMs) > (process.env.TIMEONLINE * 60 * 1000) && json.FCounts === undefined ) {
				const f = await countAllFragments(match);
				json.FCounts = f
			}
			json.lastEdit = Math.floor(stat.mtimeMs / 1000);
			// Remove auth string
			delete json.auth;

			let index = matchViewers.map(m => m.token).indexOf(match);
			if (index <= -1) {
				json.viewers = 0;
			} else {
				json.viewers = matchViewers[index].viewers.length;
			}

			response.push(json);
		}

		res.send(response);
	});

	// Main redirect
	server.all("*", (req, res) => {
		res.redirect("/");
	});

	// Export
	return server;
}
