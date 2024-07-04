const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const { Schema } = mongoose
require('dotenv').config()

// constant config
const INVALID_USERNAME = 'Invalid username'
const CONNECTED_TO_HOST = 'Connected!'
const FAIL_TO_CONNECT = 'Error: Failed to connect to the given hostname'

// middleware config
app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

// mongoose config
const URI = process.env.MONGO_URI
mongoose.connect(URI, {dbName: process.env.DB_NAME})
  .then(() => console.log(CONNECTED_TO_HOST))
  .catch((err) => {
    console.log(FAIL_TO_CONNECT)
    console.log(`reason: ${err.syscall} ${err.code}`)
  })

// mongoose model instances
const {UserModel} = require('./models/User')
const {ExerciseModel} = require('./models/Exercise')
const {LogModel} = require('./models/Log')

// routes
app.get('/', (_req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})

app.route('/api/users')
  .post((req, res) => {
    const {username} = req.body
    if(username === undefined || username === "")
      return res.json({error: INVALID_USERNAME})

    console.log(username)
  });



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
