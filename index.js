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
  if(!userId)
    return res.json({error: 'required: userId'})

  const from = req.query.from
  const to = req.query.to
  const limit = Number(req.query.limit) || 0

  let username
  try {
    const _user = await UserModel.findById(userId)
    username = _user.username
  } catch(err) {
    username = undefined
    console.log(err.message)
  }
  if(!username)
    return res.json({error: USER_NOT_EXIST})

  let allExercises
  try {
    allExercises = await ExerciseModel
      .find({_userId: userId})
      .select('-_id -username -_userId -__v')
  } catch(err) {
    console.log(err.message)
    return res.end(SOMETHING_WRONG)
  }

  try {
    const logFound = await LogModel.findOne({_userId: userId})
    const size = allExercises.length
    
    if(logFound) {
      if(logFound.count !== size) {
        logFound.count = size
        logFound.log = allExercises
        logFound.save()
      }
    } else {
      await new LogModel({username, count: size, _userId: userId,
        log: allExercises.map((exercise) => ({
          description: exercise.description,
          duration: exercise.duration,
          date: exercise.date
        }))
      }).save()
    }
  } catch(err) {
    console.log(err)
  }

  const startDate = new Date(from)
  const endDate = new Date(to)
  let filteredExercises
  try {
    filteredExercises = await ExerciseModel
      .find({_userId: userId, date: {
        $gte: startDate.getTime() || new Date(0).getTime(),
        $lte: endDate.getTime() || new Date(Date.now()).getTime()
      }})
      .select('-_id -username -_userId -__v')
      .limit(limit)
  } catch(err) {
    console.log(err)
    return res.end(SOMETHING_WRONG)
  }

  return res.json({
    _id: userId,
    username,
    from: (isValid(startDate)) ? startDate.toDateString() : undefined,
    to: (isValid(endDate)) ? endDate.toDateString() : undefined,
    count: filteredExercises.length,
    log: filteredExercises.map(exercise => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString()
    }))
  })
})

function isValid(dateInstance) {
  return !isNaN(dateInstance.getTime())
}

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
