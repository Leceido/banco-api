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
        const user = await User.findOne({ cpf: req.user.cpf })
        res.status(200).send({
            user: {
                cpf: user.cpf,
                name: user.name,
                balance: user.balance.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })
            }
        })
    } catch (error) {
        res.status(500).send({ message: "internal server error" })
    }
}

exports.getUser = async (req, res) => {
    try {
        const user = await User.findOne({ cpf: req.params.cpf })
        res.status(200).send({
            user: {
                name: user.name,
                cpf: user.cpf
            }
        })
    } catch (error) {
        res.status(404).send({ message: 'Usuario não encotrado' })
    }
}

exports.getContacts = async (req, res) => {
    try {
        const users = await User.find({ cpf: { $nin: [req.user.cpf, "29238096000102"] } })
        res.status(200).send({
            users: users.map(user => {
                return {
                    name: user.name,
                    cpf: user.cpf
                }
            })
        })
    } catch (err) {
        res.status(500).send({ message: "internal server error" })
    }
}

exports.patchDeposit = async (req, res) => {
    try {
        const user = await User.findOne({ cpf: req.user.cpf })

        if (req.body.value <= 0) {
            return res.status(401).send({ message: "valor invalido" })
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
            message: "Deposito realizado",
            user: {
                cpf: user.cpf,
                name: user.name,
                balance: user.balance
            }
        })
    } catch (error) {
        res.status(500).send({ message: "internal server error" })
    }
}

exports.patchWithdraw = async (req, res) => {
    try {
        const user = await User.findOne({ cpf: req.user.cpf })

        if (user.balance < req.body.value) {
            return res.status(401).send({ message: "Saldo insuficiente" })
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
            message: "Saque realizado",
            user: {
                cpf: user.cpf,
                name: user.name,
                balance: user.balance
            }
        })
    } catch (error) {
        res.status(500).send({ message: "internal server error" })
    }
}

exports.patchTransfer = async (req, res) => {
    try {
        const user = await User.findOne({ cpf: req.user.cpf })
        const beneficiary = await User.findOne({ cpf: req.body.beneficiary_cpf })

        if (!beneficiary) {
            return res.status(404).send({ message: "Beneficiario invalido" })
        }

        if (user.cpf === beneficiary.cpf) {
            return res.status(401).send({ message: "Beneficiario invalido, mesma pessoa" })
        }

        if (user.balance < req.body.value) {
            return res.status(401).send({ message: "Saldo insuficiente" })
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
            message: "Transferencia realizada",
            user: {
                cpf: user.cpf,
                name: user.name,
                balance: user.balance
            }
        })
    } catch (error) {
        res.status(500).send({ message: "internal server error", error: error })
    }
}

exports.patchPay = async (req, res) => {
    try {
        const user = await User.findOne({ cpf: req.user.cpf })
        const beneficiary = await User.findOne({ cpf: "29238096000102" })

        if (user.cpf === beneficiary.cpf) {
            return res.status(401).send({ message: "Beneficiario invalido" })
        }

        if (user.balance < req.body.value) {
            return res.status(401).send({ message: "Saldo insuficiente" })
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
            message: "Pagamento Realizado",
            user: {
                cpf: user.cpf,
                name: user.name,
                balance: user.balance
            }
        })
    } catch (error) {
        res.status(500).send({ message: "internal server error" })
    }
}

exports.getStatement = async (req, res) => {
    try {
        const user = await User.findOne({ cpf: req.user.cpf }).populate({
            path: 'statement',
            options: { sort: { date: -1 }, limit: 20 }
        })

        res.status(200).send({
            statements: user.statement.map(statement => {
                return {
                    id: statement._id,
                    payer: statement.payer,
                    beneficiary: statement.beneficiary,
                    amount: statement.amount.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' }),
                    date: statement.date.toLocaleString('pt-br', { timezone: 'UTC' })
                }
            })
        })
    } catch (error) {
        res.status(500).send({ message: "internal server error" });
    }
}

exports.patchChangePassword = async (req, res) => {
    try {
        const user = await User.findOne({ cpf: req.body.cpf })
        const password = req.body.password
        if (!user) {
            return res.status(400).send({ message: "Usuario não encontrado" })
        }
        if (isNaN(password)) {
            return res.status(401).send({ error: "Senha invalida, necessario senha numerica" });
        }
        const stringPassword = password.toString()

        bcrypt.hash(stringPassword, 10, (errBcrypt, hash) => {
            if (errBcrypt) {
                console.log(errBcrypt);
                return res.status(500).send({ error: errBcrypt })
            }

            user.password = hash
            user.save()

            res.status(201).send({message: "Senha alterada"})
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: "internal server error" })
    }
}

exports.postSignup = async (req, res) => {
    try {
        if (!validarCPF(req.body.cpf) && !validarCNPJ(req.body.cpf)) {
            return res.status(401).send({ error: "CPF ou CNPJ invalido" })
        }
        const password = req.body.password
        const user = await User.findOne({ cpf: req.body.cpf })

        if (user) {
            return res.status(401).send({ error: "Esse usuario já está cadastrado" })
        } else if (isNaN(password)) {
            return res.status(401).send({ error: "Senha invalida, necessario senha numerica" });
        } else {
            Stringpassword = password.toString()

            const newUser = new User({
                name: req.body.name,
                cpf: req.body.cpf,
                balance: 0,
                password: Stringpassword
            })

            bcrypt.hash(newUser.password, 10, (errBcrypt, hash) => {
                if (errBcrypt) {
                    console.log(errBcrypt);
                    return res.status(500).send({ error: errBcrypt })
                }

                newUser.password = hash

                newUser.save()

                res.status(201).send({
                    message: "Usuario Criado",
                    userCreated: {
                        name: req.body.name,
                        cpf: req.body.cpf
                    }
                })
            })
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: "internal server error" })
    }
}

exports.postSignin = (req, res) => {
    User.findOne({ cpf: req.body.cpf }).then((user) => {
        if (!user) {
            return res.status(400).send({ message: "Usuario não encontrado" })
        }
        bcrypt.compare(req.body.password, user.password, (err, result) => {
            if (result) {
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
                        message: "Usuario autenticado",
                        token: token,
                        user: {
                            cpf: user.cpf,
                            name: user.name,
                            balance: user.balance
                        }
                    })
                } catch (error) {
                    res.status(500).send({ messagem: "Internal server error" })
                }
            } else {
                res.status(401).send({ messagem: "Autenticação falhou, usuario ou senha incorretos" })
            }
        })
    })
}