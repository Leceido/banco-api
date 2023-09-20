const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Statement = new Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now()
    },
    payer: {
        type: String,
        required: true
    },
    beneficiary: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    }
})

mongoose.model('statements', Statement)