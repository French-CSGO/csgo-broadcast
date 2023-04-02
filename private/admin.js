// Modules
const express = require("express");
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require("path");
const fs = require("fs");

// Read secrets from the .env file
require('dotenv').config()

// Use workers to move execution of some functions 
const { Worker } = require('worker_threads');

// Instances
const server = express();

// Middleware to get data from a form
server.use(bodyParser.urlencoded({ extended: true }));
// Middleware to parse cookies
server.use(cookieParser());


// Generate a new JWT
function generateToken(user) {
  const payload = {
    sub: user.id,
    name: user.username,
    role: user.role
  };
  const options = {
    expiresIn: '1h'
  };
  return jwt.sign(payload, process.env.SECRET, options);
}

// Check if JWT is valid
const authenticateJWT = (req, res, next) => {
  const token = req.cookies.token;

  if (token) {
    jwt.verify(token, process.env.SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    // You can send 401 status
    // res.sendStatus(401);
    // or redirect to the login form
    res.redirect('/admin/auth');
  }
};

// POST the form to login
server.post('/login', function(req, res) {
    const user = {
      id: 1,
      username: 'admin',
      password: 'admin',
      role: 'Administrateur'
    };
  
    if (req.body.username === user.username && req.body.password === user.password) {
      const token = generateToken(user);
      // Return the token in json to inspect if needed
      //res.json({ token });

      // Prepare a cookie to store the JWT token on client side
      res.cookie('token', token, { httpOnly: true });
      // Send a res 
      // res.send("Cookie Set");
      res.redirect('/admin/management');

    } else {
      // res.status(401).send('Invalid credentials');
      res.redirect(req.get('referer'));
    }
});

// Get request to logout and go back to / 
server.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

server.get('/management', authenticateJWT, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "html", "management.html"));
});

server.get("/auth", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "html", "loginform.html"));
});

// Delete a folder, protected by auth
server.delete('/delete/:token', authenticateJWT, (req, res) => {
  fs.rm("./bin/" + req.params.token, { recursive: true, force: true }, (error) => {
    if (error) {
      // console.error('An error occurred while deleting the folder:', error);
      res.sendStatus(500)
    } else {
      // console.log('Folder deleted successfully.');
      res.sendStatus(200)
    }
  });
});

server.get("/getTeamsName/:token", async (req, res) => {
  // Create the worker.
  console.log("Request received !")
  await getTeamsNameWorker(req.params.token);
  res.sendStatus(200);
});

// Worker 
function getTeamsNameWorker(id) {
	return new Promise((resolve, reject) => {
    console.log("Start the worker")
	  const worker = new Worker('./helpers/getTeamsName.js', { workerData: { id } });
  
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