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
const USER_NOT_EXIST = 'User does not exist'
const SOMETHING_WRONG = 'Something went wrong'
const unixValidation = /^\d{1,13}$/
const blockAllWhitespace= /\s*/g

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

    let user

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
  })

app.post('/api/users/:_userId/exercises', async (req, res) => {
  const userId = req.params._userId
  
  const {description, duration, date: payloadDateOrUnix} = req.body
  console.log(description)
  if(description === undefined)
    return res.json({error: `description ${FIELD_NOT_EXIST}`})
  if(!description || description.length < 1)
    return res.json({error: `description ${INPUT_REQUIRED}`})
  if(duration === undefined)
    return res.json({error: `duration ${FIELD_NOT_EXIST}`})
  if(!duration || duration.length < 1)
    return res.json({error: `duration ${INPUT_REQUIRED}`})
  if(payloadDateOrUnix === undefined)
    return res.json({error: `date ${FIELD_NOT_EXIST}`})
  
  let date = (payloadDateOrUnix) ?
    new Date(payloadDateOrUnix) :
    new Date()
  if(!isValid(date)) {
    if(unixValidation.test(payloadDateOrUnix.replace(blockAllWhitespace, ''))) {
      date = new Date(+payloadDateOrUnix)
      if(!isValid(date))
        date = null
    } else { date = null }
  }

  let username
  try {
    const _user = await UserModel.findById({_id: userId})
    username = _user.username
  } catch(err) {
    username = undefined
    console.log(err.message)
  }
  if(!username)
    return res.json({error: USER_NOT_EXIST})

  let exercise
  try {
    exercise = await new ExerciseModel({
      username,
      description,
      duration,
      date: date,
      _userId: userId
    }).save()
  } catch(e) {
    exercise = undefined
    console.log(err)
  }

  finally {
    const {_userId: _id, username, date, duration, description} = exercise
    const resObj = (exercise) ?
      {_id, username, date: date.toDateString(), duration, description} :
      {error: FAIL_TO_SAVE_DOC}
    res.json(resObj)
  }
})

app.get('/api/users/:_userId/logs', async (req, res) => {
  const userId = req.params._userId

  let username
  try {
    const _user = await UserModel.findById({_id: userId})
    username = _user.username
  } catch(err) {
    username = undefined
    console.log(err.message)
  }
  if(!username)
    return res.json({error: USER_NOT_EXIST})

  let allExercises
  try {
    allExercises = await ExerciseModel.find({_userId: userId})
  } catch(err) {
    console.log(err.message)
    return res.end(SOMETHING_WRONG)
  }

  const _log = await LogModel.findOneAndUpdate(
    {_userId: userId},
    {count: allExercises.length, log: allExercises},
    {new: true}
  )
  console.log(_log)
  console.log((_log) ?
    'userId is valid, log is exist in db, update instead' :
    'userId is valid, log does not exist in db, create new log'
  )

  if(_log) {
    return res.json({
      _id: _log._userId,
      username: _log.username,
      count: _log.count,
      log: _log.log.map((__exerciseLog) => {
        const {description, duration, date} = __exerciseLog
        return {
          description,
          duration,
          date: date.toDateString()
        }
      })
    })
  }
  
  let log
  try {
    log = await new LogModel({
      username,
      count: allExercises.length,
      _userId: userId,
      log: allExercises.map((_exercise) => {
        return {
          description: _exercise.description,
          duration: _exercise.duration,
          date: _exercise.date
        }
      })
    }).save()
  } catch(err) {
    log = undefined
    console.log(err.message)
  }
  
  finally {
    const {username: logUsername, count: countExercise, _userId: _id, log: pLog} = log
    const resObj = (log) ?
      {_id, username: logUsername, count: countExercise, log: pLog.map((exerciseLog) => {
        return {
          description: exerciseLog.description,
          duration: exerciseLog.duration,
          date: exerciseLog.date.toDateString()
        }  
      })} : {error: FAIL_TO_SAVE_DOC}
    res.json(resObj)
  }
})

function isValid(dateInstance) {
  return !isNaN(dateInstance.getTime())
}

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
