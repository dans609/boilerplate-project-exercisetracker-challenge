const mongoose = require('mongoose')
const {Schema} = mongoose

const exerciseSchema = new Schema({
    username: {type: String, required: true},
    description: {type: String, required: true},
    duration: {type: Number, min: 1, required: true},
    date: {type: Date, default: Date.now},
    _userId: Schema.Types.ObjectId
})

exports.ExerciseModel = mongoose.model('Exercise', exerciseSchema)
