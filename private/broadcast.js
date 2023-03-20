// Modules
const express = require("express");
const fs = require("fs");

// Use workers to move execution of some functions 
const { Worker } = require('worker_threads');

// Instances
const server = express();

// Pages
server.get("/", (req, res) => {
	res.sendStatus(400);
});

server.post("/reset/:token", (req, res) => {
	if (fs.existsSync("./bin/" + req.params.token) === false) {
		res.sendStatus(200);
		return;
	}

	let files = fs.readdirSync("./bin/" + req.params.token);
	for (let file of files) {
		fs.unlinkSync("./bin/" + req.params.token + "/" + file);
	}

	fs.unlinkSync("./bin/" + req.params.token);
	res.sendStatus(200);
});

server.post("/:token/:fragmentNumber/:frameType", async (req, res) => {
	const pattern = /^s1t/;
	if(!pattern.test(req.params.token))
	{
		if (req.params.frameType === "start") {
			console.log("Starting broadcast with token " + req.params.token + " and fragment number " + req.params.fragmentNumber);
			fs.mkdirSync("./bin/" + req.params.token);
			fs.writeFileSync("./bin/" + req.params.token + "/config.json", JSON.stringify({
				tick: req.query.tick,
				tps: req.query.tps,
				map: req.query.map,
				protocol: req.query.protocol,
				team1: "TBD",
				team2: "TBD",

				token: req.params.token,
				timestamp: Date.now(),
				auth: req.headers["x-origin-auth"],
				startFragment: req.params.fragment_number
			}));

			// Create the worker.
			await getTeamsName(req.params.token);
		}

		if (fs.existsSync("./bin/" + req.params.token) === false) {
			res.sendStatus(205);
			return;
		}

		const p = fs.createWriteStream("./bin/" + req.params.token + "/" + req.params.fragmentNumber + "_" + req.params.frameType);
		req.pipe(p);

		if (req.params.frameType === "full") {
			console.log("Got fragment " + req.params.fragmentNumber + " for match " + req.params.token + " at tick " + req.query.tick);

			const json = fs.existsSync("./bin/" + req.params.token + "/fragments.json") ? JSON.parse(fs.readFileSync("./bin/" + req.params.token + "/fragments.json")) : [];
			json.push({
				fragmentNumber: req.params.fragmentNumber,
				tick: req.query.tick
			});

			// See ./match.js, line 67 : increase to 10.
			if (json.length > 10) {
				json.shift();
			}

			fs.writeFileSync("./bin/" + req.params.token + "/fragments.json", JSON.stringify(json));
		}
	} 
	res.sendStatus(200);
});

// Main redirect
server.all("*", (req, res) => {
	res.redirect("/");
});

// Worker 
function getTeamsName(id) {
	return new Promise((resolve, reject) => {
	  const worker = new Worker('../helpers/getTeamsName.js', { workerData: { id } });
  
	  worker.on('message', (result) => {
		resolve(result);
	  });
  
	  worker.on('error', (error) => {
		reject(error);
	  });
  
	  worker.on('exit', (code) => {
		if (code !== 0) {
		  reject(new Error(`Worker stopped with exit code ${code}`));
		}
	  });
	});
  }

// Export
module.exports = server;
