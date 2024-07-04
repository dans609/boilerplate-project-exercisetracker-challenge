const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
require('dotenv').config()

// constant config
const INVALID_USERNAME = 'Invalid username'
const CONNECTED_TO_HOST = 'Connected!'
const FAIL_TO_CONNECT = 'Error: Failed to connect to the given hostname'
const FAIL_TO_SAVE_DOC = 'Failed to save document'

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

// mongoose model object
const {UserModel} = require('./models/User')
const {ExerciseModel} = require('./models/Exercise')
const {LogModel} = require('./models/Log')

// routes
app.get('/', (_req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})

app.route('/api/users')
  .post(async (req, res) => {
    const {username} = req.body
    if(username === undefined || username === "")
      return res.json({error: INVALID_USERNAME})

    let user;

    try {
      user = await new UserModel({username}).save()
    } catch(err) {
      user = undefined
      console.log(err)
    }
  
    finally {
      const resObj = (user) ?
        {username: user.username, _id: user._id} :
        {error: FAIL_TO_SAVE_DOC}
      res.json(resObj)
    }
  });



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
