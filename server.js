'use strict';
var dns = require('dns');
var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
const { default: ShortUniqueId } = require('short-unique-id');

const dotenv = require('dotenv');
dotenv.config();

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true }, function (err) {
  if (err) throw err;
});
var Url = mongoose.model('Url', { prefix: String, orig: String, hash: String });

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }))

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({ greeting: 'hello API' });
});

// Post /api/shorturl/new enpoint
app.post('/api/shorturl/new', function (req, res) {
  var url;
  var prefx;
  if (req.body.url.substring(0, 8) === 'https://') {
    url = req.body.url.replace('https://', '');
    prefx = 'https://';
  } else if (req.body.url.substring(0, 7) === 'http://') {
    url = req.body.url.replace('http://', '');
    prefx = 'http://';
  } else {
    url = req.body.url;
  }
  dns.resolve(url, function (err, data) {
    if (err) {
      res.json({ "error": "invalid URL" });
    } else {
      var uid = new ShortUniqueId();
      var newUrl = new Url({ prefix: prefx, orig: url, hash: uid() });
      newUrl.save(function (err, data) {
        if (err) return console.log(err);
        console.log(data);
        res.json({ "original_url": data.orig, "short_url": data.hash });
      });
    }
  });
});

// GET /api/shorturl/:hash endpoint... 
app.get("/api/shorturl/:hash", function (req, res) {
  var hash = req.params.hash;
  Url.findOne({ hash: hash }, function (err, url) {
    if (err) console.log(err);
    var url = url.prefix.concat(url.orig);
    res.redirect(url);
  })
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});