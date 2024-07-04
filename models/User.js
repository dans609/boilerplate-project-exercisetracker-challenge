const mongoose = require('mongoose')
const {Schema} = mongoose

const userSchema = new Schema({
    username: {
        type: String,
        required: true
    }
})

exports.UserModel = mongoose.model('User', userSchema)
