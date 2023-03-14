// Modules
const express = require("express");
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require("path");

// Read secrets from the .env file
require('dotenv').config()

const secret = process.env.SECRET;

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
  return jwt.sign(payload, secret, options);
}

// Check if JWT is valid
const authenticateJWT = (req, res, next) => {
  const token = req.cookies.token;

  if (token) {
    jwt.verify(token, secret, (err, user) => {
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

// Export
module.exports = server;