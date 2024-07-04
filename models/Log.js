const mongoose = require('mongoose')
const {exerciseSchema} = require('./Exercise.js')
const {Schema} = mongoose

const {username, _userId, description, duration, date} = exerciseSchema
const logSchema = new Schema({
    username,
    count: {type: Number, default: 0},
    _userId,
    log: [{
        description,
        duration,
        date,
    }],
})

exports.LogModel = mongoose.model('Log', logSchema)
