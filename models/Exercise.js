const mongoose = require('mongoose')
const {userSchema} = require('./User.js')
const {Schema} = mongoose

const exerciseSchema = new Schema({
    username: userSchema.username,
    description: {type: String, required: true},
    duration: {type: Number, min: 1, required: true},
    date: {type: Date, default: Date.now},
    _userId: Schema.Types.ObjectId
})
const Exercise = mongoose.model('Exercise', exerciseSchema)

exports.exerciseSchema = exerciseSchema
exports.ExerciseModel = Exercise
