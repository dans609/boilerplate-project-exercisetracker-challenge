const mongoose = require('mongoose')
const {Schema} = mongoose

const logSchema = new Schema({
    username: {type: String, required: true},
    count: {type: Number, default: 0},
    _userId: Schema.Types.ObjectId,
    log: [{
        description: {type: String, required: true},
        duration: {type: Number, min: 1, required: true},
        date: {type: Date, default: Date.now},
    }],
})

exports.LogModel = mongoose.model('Log', logSchema)
