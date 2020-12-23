require('dotenv').config();
const express = require('express');
const cors = require('cors');
var bodyParser = require('body-parser')
const mongoose = require('mongoose');
const dns = require("dns");
const urlParser = require("url");

const { Schema } = mongoose;
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});


mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // useFindAndModify: false,
  // useCreateIndex: true
});

const urlSchema = new Schema({
  url : {type: String, required: true},
  sorter :  Number,
})
let Url =  mongoose.model('Url', urlSchema);

app.use("/api/shorturl/new", bodyParser.urlencoded({ extended: false }), (req, res) => {
  let resObj = {}
  console.log("resBody: ", req.body.url)
  let inputUrl = req.body.url

  Url.find({url: inputUrl}, (err, data) => {
    if(err) return console.error(err);
    if(data[0]) {
      console.log("data")
      
      res.json({
          original_url: data[0].url,
          short_url: data[0].sorter
        })
    } else {
        const dnsLookup = dns.lookup(urlParser.parse(inputUrl).hostname, 
        (err,address) => {
        if(!address) {
          res.json({ error: "Invalid URL"})
        } else {
          Url.find((err, data) => {
            let NumLength = data.length
            const url = new Url({ url: inputUrl, sorter: NumLength })
            url.save((err, data) => {
              res.json({
                original_url: data.url,
                short_url: data.sorter
              })
            })
          })
        }
        console.log("dns: ", err)
        console.log("address: ", address)
      })
    console.log("dnsLookup: ", dnsLookup)
    }
    console.log("data=", data, data.length)
    console.log("data0", data[0])
  })
})

app.get("/api/shorturl/:sorter", (req, res) => {
  const sortId = req.params.sorter;
  console.log("sortId", sortId)
  Url.find({sorter: sortId}, (err, data) => {
    console.log("sorterData:", data[0])
    if(!data[0]) {
      res.json({ error: "Invalid URL"})
    } else {
      res.redirect(data[0].url)
    }
  })
})
