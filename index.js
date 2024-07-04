const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
require('dotenv').config()

// constant config
const FIELD_NOT_EXIST = 'property/field does not exist in the payload'
const INPUT_REQUIRED = 'input must be filled in, min.length is (1)'
const CONNECTED_TO_HOST = 'Connected!'
const FAIL_TO_CONNECT = 'Error: Failed to connect to the given hostname'
const FAIL_TO_SAVE_DOC = 'Failed to save document'
const FAIL_TO_FETCH_ALL = 'Failed to fetch all documents'

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
  .get(async (_req, res) => {
    let users;

    try {
      users = await UserModel.find({})
    } catch(err) {
      users = undefined
      console.log(err)
    }

    finally {
      const resObj = (users) ? users : {error: FAIL_TO_FETCH_ALL}
      res.json(resObj)
    }
  })
  .post(async (req, res) => {
    const {username} = req.body
    if(username === undefined) return res.json({error: `username ${FIELD_NOT_EXIST}`})
    if(username === '' || username.length < 1) return res.json({error: `username ${INPUT_REQUIRED}`})

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

app.post('/api/users/:_userId/exercises', (req, res) => {
  console.log(req.body)
  console.log(req.params._userId)
  
  const {description, duration, date} = req.body
  if(description === undefined) return res.json({error: `description ${FIELD_NOT_EXIST}`})
  if(description === '' || description.length < 1) return res.json({error: `description ${INPUT_REQUIRED}`})

  if(duration === undefined) return res.json({error: `duration ${FIELD_NOT_EXIST}`})
  if(duration === '' || duration.length < 1) return res.json({error: `duration ${INPUT_REQUIRED}`})

  if(date === undefined) return res.json({error: `date ${FIELD_NOT_EXIST}`})
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
