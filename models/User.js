const mongoose = require('mongoose')
const Schema = mongoose.Schema

const User = new Schema({
    name: {
        type: String,
        required: true
    },
    cpf: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    balance: {
        type: Number,
        default: 0,
        required: true
    },
    statement: [
        {
            type: Schema.Types.ObjectId,
            ref: "statements"
        }
    ]
})

mongoose.model('users', User)