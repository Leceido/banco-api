const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
require('../models/User')
const User = mongoose.model('users')
const { validarCPF } = require('../helpers/avaibleCpf')

router.get('/', (req, res) => {
    res.redirect('/users/home')
})

router.get('/home', (req, res) => {
    res.status(200).send('home page')
})

router.post('/signup', async (req, res) => {
    try {
        if (!validarCPF(req.body.cpf)) {
            return res.status(409).send({error: "invalid cpf"})
        }

        const user = await User.findOne({cpf: req.body.cpf})

        if(user) {
            return res.status(409).send({error: "this user is alredy registered"})
        } else {
            const newUser = new User({
                name: req.body.name,
                cpf: req.body.cpf,
                balance: 0,
                password: req.body.password
            })

            newUser.save()

            res.status(201).send({
                message: "user created!",
                userCreated: {
                    name: req.body.name,
                    cpf: req.body.cpf
                }
            })
        }
    } catch (error) {
        res.status(500).send({error: "internal server error"})
    }
})

module.exports = router