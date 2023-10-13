const mongoose = require('mongoose')
require('../../models/User')
const User = mongoose.model('users')
require('../../models/Statement')
const Statement = mongoose.model('statements')
const { validarCPF } = require('../../helpers/avaibleCpf')
const { validarCNPJ } = require('../../helpers/avaibleCnpj')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

exports.getHome = async (req, res) => {
    try {
        const user = await User.findOne({cpf: req.user.cpf})
        res.status(200).send({
            user: {
                cpf: user.cpf,
                name: user.name,
                balance: user.balance.toLocaleString('pt-br', {style: 'currency', currency: 'BRL'})
            }
        })
    } catch (error) {
        res.status(500).send({message: "internal server error"})
    }
}

exports.getUser = async (req, res) => {
    try {
        const user = await User.findOne({cpf: req.params.cpf})
        res.status(200).send({
            user: {
                name: user.name,
                cpf: user.cpf
            }
        })
    } catch (error) {
        res.status(404).send({message: 'user is not found'})
    }
}

exports.getContacts = async (req, res) => {
    try {
        const users = await User.find({cpf: {$nin: [req.user.cpf, "29238096000102"]}})
        res.status(200).send({users: users.map(user => {
            return {
                name: user.name,
                cpf: user.cpf
            }
        })})
    } catch (err) {
        res.status(500).send({message: "internal server error"})
    }
}

exports.patchDeposit = async (req, res) => {
    try {
        const user = await User.findOne({cpf: req.user.cpf})

        if (req.body.value <= 0) {
            return res.status(401).send({message: "invalid value"})
        }

        const newTransaction = new Statement({
            payer: "deposit",
            beneficiary: user.cpf,
            amount: req.body.value
        })

        newTransaction.save()

        user.statement.push(newTransaction)
        user.balance += req.body.value
        

        await user.save()
        res.status(200).send({
            message: "deposit completed",
            user: {
                cpf: user.cpf,
                name: user.name,
                balance: user.balance
            }
        })
    } catch (error) {
        res.status(500).send({message: "internal server error"})
    }
}

exports.patchWithdraw = async (req, res) => {
    try {
        const user = await User.findOne({cpf: req.user.cpf})

        if(user.balance < req.body.value) {
            return res.status(401).send({message: "insufficient funds!"})
        }

        const newTransaction = new Statement({
            payer: user.cpf,
            beneficiary: "withdraw",
            amount: req.body.value
        })

        newTransaction.save()

        user.statement.push(newTransaction)
        user.balance -= req.body.value

        await user.save()
        res.status(200).send({
            message: "withdraw completed",
            user: {
                cpf: user.cpf,
                name: user.name,
                balance: user.balance
            }
        })
    } catch (error) {
        res.status(500).send({message: "internal server error"})
    }
}

exports.patchTransfer = async (req, res) => {
    try {
        const user = await User.findOne({cpf: req.user.cpf})
        const beneficiary = await User.findOne({cpf: req.body.beneficiary_cpf})

        if(!beneficiary) {
            return res.status(404).send({message: "invalid beneficiary, not found"})
        }

        if (user.cpf === beneficiary.cpf) {
            return res.status(401).send({message: "invalid beneficiary, same person"})
        }

        if(user.balance < req.body.value) {
            return res.status(401).send({message: "insufficient funds"})
        }

        const newTransaction = new Statement({
            payer: user.cpf,
            beneficiary: beneficiary.cpf,
            amount: req.body.value
        })

        newTransaction.save()

        user.statement.push(newTransaction)
        beneficiary.statement.push(newTransaction)
        user.balance -= req.body.value
        beneficiary.balance += req.body.value

        await user.save()
        await beneficiary.save()
        res.status(200).send({
            message: "transfer completed",
            user: {
                cpf: user.cpf,
                name: user.name,
                balance: user.balance
            }
        })
    } catch (error) {
        res.status(500).send({message: "internal server error", error:error})
    }
}

exports.patchPay = async (req, res) => {
    try {
        const user = await User.findOne({cpf: req.user.cpf})
        const beneficiary = await User.findOne({cpf: "29238096000102"})

        if (user.cpf === beneficiary.cpf) {
            return res.status(401).send({message: "invalid beneficiary"})
        }

        if(user.balance < req.body.value) {
            return res.status(401).send({message: "insufficient funds"})
        }

        const newTransaction = new Statement({
            payer: user.cpf,
            beneficiary: "BANK",
            amount: req.body.value
        })

        newTransaction.save()

        user.statement.push(newTransaction)

        user.balance -= req.body.value
        beneficiary.balance += req.body.value

        await user.save()
        await beneficiary.save()
        res.status(200).send({
            message: "payment completed",
            user: {
                cpf: user.cpf,
                name: user.name,
                balance: user.balance
            }
        })
    } catch (error) {
        res.status(500).send({message: "internal server error"})
    }
}

exports.getStatement = async (req, res) => {
    try {
        const user = await User.findOne({ cpf: req.user.cpf }).populate('statement');

        const statements = user.statement.map(statement => ({
            transaction: {
                payer: statement.payer,
                beneficiary: statement.beneficiary,
                amount: statement.amount.toLocaleString('pt-br', {style: 'currency', currency: 'BRL'}),
                date: statement.date.toLocaleString('pt-br',{timezone: 'UTC'})
            }
        }));

        return res.status(200).send({ statements });
    } catch (error) {
        res.status(500).send({ message: "internal server error" });
    }
}

exports.postSignup = async (req, res) => {
    try {
        if (!validarCPF(req.body.cpf) && !validarCNPJ(req.body.cpf)) {
            return res.status(401).send({error: "invalid CPF or CNPJ"})
        }
        const password = req.body.password
        const user = await User.findOne({cpf: req.body.cpf})

        if(user) {
            return res.status(401).send({error: "this user is alredy registered"})
        } else if (isNaN(password)) {
            return res.status(401).send({error: "invalid password"});
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
}

exports.postSignin = (req, res) => {
    User.findOne({cpf: req.body.cpf}).then((user) => {
        if(!user) {
            return res.status(400).send({message: "User is not found"})
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
                        token: token,
                        user: {
                            cpf: user.cpf,
                            name: user.name,
                            balance: user.balance
                        }   
                    })
                } catch (error) {
                    res.status(500).send({messagem: "Internal server error"})
                }
            } else {
                res.status(401).send({messagem: "Auth failed, ivalid user or password"})
            }
        })
    })
}