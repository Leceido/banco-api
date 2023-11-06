const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()

const login = require('../helpers/login')

const UsersController = require('../routes/controllers/users-controller')

router.get('/home', login, UsersController.getHome)

router.get('/user/:cpf', login, UsersController.getUser)

router.get('/contacts', login, UsersController.getContacts)

router.patch('/deposit', login, UsersController.patchDeposit)

router.patch('/withdraw', login, UsersController.patchWithdraw)

router.patch('/transfer', login, UsersController.patchTransfer)

router.patch('/pay', login, UsersController.patchPay)

router.get('/statement', login, UsersController.getStatement)

router.patch('/changepassword', UsersController.patchChangePassword)

router.post('/signup', UsersController.postSignup)

router.post('/signin', UsersController.postSignin)

module.exports = router