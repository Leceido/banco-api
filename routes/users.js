const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
require('../models/User')
const User = mongoose.model('users')
const { validarCPF } = require('../helpers/avaibleCpf')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const login = require('../helpers/login')

router.get('/', (req, res) => {
    res.status(400).send({message: "Why are you here?"})
})

router.get('/home', login, async (req, res) => {
    try {
        const user = await User.findOne({cpf: req.user.cpf})
        res.status(200).send({user: user})
    } catch (error) {
        res.status(500).send({message: "internal server error"})
    }
})

router.post('/signup', async (req, res) => {
    try {
        if (!validarCPF(req.body.cpf)) {
            return res.status(409).send({error: "invalid cpf"})
        }
        const password = req.body.password
        const user = await User.findOne({cpf: req.body.cpf})

        if(user) {
            return res.status(409).send({error: "this user is alredy registered"})
        } else if (isNaN(password)) {
            return res.status(409).send({error: "invalid password"});
        } else {
            Stringpassword = password.toString()

            const newUser = new User({
                name: req.body.name,
                cpf: req.body.cpf,
                balance: 0,
                password: Stringpassword
            })

            bcrypt.hash(newUser.password, 10, (errBcrypt, hash) => {
                if(errBcrypt) {
                    console.log(errBcrypt);
                    return res.status(500).send({error: errBcrypt})
                }

                newUser.password = hash

                newUser.save()

                res.status(201).send({
                    message: "user created!",
                    userCreated: {
                        name: req.body.name,
                        cpf: req.body.cpf
                    }
                })
            })
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({error: "internal server error"})
    }
})

router.post('/signin', (req, res) => {
    User.findOne({cpf: req.body.cpf}).then((user) => {
        if(!user) {
            return res.status(401).send({message: "User is not found"})
        }
        bcrypt.compare(req.body.password, user.password, (err, result) => {
            if(result) {
                try {
                    const token = jwt.sign({
                        cpf: user.cpf,
                        name: user.name
                    },
                    `${process.env.JWT_KEY}`,
                    {
                        expiresIn: "1h"
                    })
                    return res.status(200).send({
                        message: "User is authenticated",
                        token: token
                    })
                } catch (error) {
                    res.status(500).send({messagem: "Internal server error"})
                }
            } else {
                res.status(401).send({messagem: "Auth failed, ivalid user or password"})
            }
        })
    })
})

module.exports = router