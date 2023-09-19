const express = require('express')
const app = express()
const bodyParser = require('body-parser')
require('dotenv').config()
const cors = require('cors')

const userRoute = require('./routes/users')

const mongoose = require('mongoose')

mongoose.set('strictQuery', false)
mongoose.Promise = global.Promise
mongoose.connect(`mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@cluster0.tx76yln.mongodb.net/banco-app?retryWrites=true&w=majority`).then(() => {
    console.log("Connected to mongoDB");
}).catch((err) => {
    console.log("failed to connect to mongoDB " + err);
})

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(cors())

app.use('/users', userRoute)

app.use((req, res, next) => {
    const erro = new Error('404 ERROR - Not found')
    erro.status = 404
    next(erro)
})

app.use((error, req, res, next) => {
    res.status(error.status || 500)
    return res.send({
        erro: {
            mensagem: error.message
        }
    })
})

module.exports = app