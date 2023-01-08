import { createRequire } from "module";
const require = createRequire(import.meta.url);
const express = require('express')
const router = express.Router()
const passport = require('passport')
import { User } from '../models/User.js'
import { Pokemon } from "../models/Pokemon.js";
import { catchAsync } from '../utils/catchAsync.js'
const Filter = require('bad-words')
const filter = new Filter()
import { validateUser, isLoggedIn, isMatchingUser } from '../middleware.js'
const multer = require('multer')
import { storage, cloudinary } from '../cloudinary/index.js';
const upload = multer({ storage })

const words = require('../extra-bad-words.json')
filter.addWords(...words)

const usernameChecker = (req, res, next) => {
    const { username } = req.body
    if (filter.isProfane(username)) {
        const msg = 'That username is not allowed'
        req.flash('error', msg)
        return res.redirect('back')
    }
    next()
}

router.get('/register', (req, res) => {
    res.render('user/register')
})

router.post('/register', validateUser, usernameChecker, catchAsync(async (req, res, next) => {
    try {
        const { email, username, password } = req.body
        const user = new User({ email, username })
        const registeredUser = await User.register(user, password)
        req.login(registeredUser, err => {
            if (err) return next(err)
            req.flash('success', `Welcome to CommunityDex, ${username}!`)
            res.redirect('/')
        })
    } catch (e) {
        if (e.name === 'MongoServerError') {
            req.flash('error', 'An account has already been made with that email')
            return res.redirect('/register')
        }
        req.flash('error', e.message)
        res.redirect('/register')
    }
}))

router.get('/login', (req, res) => {
    res.render('user/login')
})

router.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login', keepSessionInfo: true }), (req, res) => {
    req.flash('success', `Welcome back, ${req.user.username}!`)
    const redirectUrl = req.session.returnTo || '/'
    delete req.session.returnTo
    res.redirect(redirectUrl)
})

router.get('/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            return next(err)
        }
        req.flash('success', 'Successfully logged out')
        res.redirect('/')
    })
})

router.get('/user/:id', catchAsync(async (req, res) => {
    const { id } = req.params
    const user = await User.findOne({ _id: id })
    res.render('user/show', { user })
}))

router.get('/user/:id/pokemon', catchAsync(async (req, res) => {
    const { id } = req.params
    let pokemon
    const { filter } = req.query
    const user = await User.findOne({ _id: id })
    console.log(user)
    if (!filter || filter === 'descending') {
        pokemon = await Pokemon.find({ author: { _id: id } }).sort({ pokedexNum: -1 }).populate('author')
    }
    else if (filter === 'ascending') {
        pokemon = await Pokemon.find({ author: { _id: id } }).populate('author')
    }
    else if (filter === 'a-z') {
        pokemon = await Pokemon.find({ author: { _id: id } }).collation({ locale: 'en', strength: 2 }).sort({ name: 1 }).populate('author')
    }
    else if (filter === 'most-liked') {
        pokemon = await Pokemon.find({ author: { _id: id } }).sort({ likes: -1 }).populate('author')
    }
    res.render('user/pokemonIndex', { pokemon, filter, user })
}))

router.use((err, req, res, next) => {
    const { statusCode = 500, message = 'Something went wrong' } = err
    res.status(statusCode).render('error', { err })
})

router.get('/user/:id/edit', isLoggedIn, isMatchingUser, catchAsync(async (req, res) => {
    const { id } = req.params
    const user = await User.findOne({ _id: id })
    res.render('user/edit', { user })
}))

router.patch('/user/:id', isLoggedIn, isMatchingUser, upload.single('image', { timeout: 60000 }, function (error, result) { }), catchAsync(async (req, res) => {
    const { id } = req.params
    if (req.file) {
        const tempUser = await User.findOne({ _id: id })
        if (tempUser.image.filename) { await cloudinary.uploader.destroy(tempUser.image.filename) }
        const user = await User.findByIdAndUpdate({ _id: id }, { image: { url: req.file.path, filename: req.file.filename }, bio: req.body.bio })
    } else {
        const user = await User.findByIdAndUpdate({ _id: id }, { bio: req.body.bio })
    }
    res.redirect(`/user/${id}`)
}))

const userRoutes = router
export { userRoutes }