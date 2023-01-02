import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const express = require('express')
const app = express()
const session = require('express-session')
const flash = require('connect-flash')
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mongoose = require('mongoose')
import { Pokemon } from './models/Pokemon.js'
import {User} from './models/User.js'
const methodOverride = require('method-override')
const ejsMate = require('ejs-mate')
const passport = require('passport')
const localStrategy = require('passport-local')
import { ExpressError } from './utils/ExpressError.js'
import { catchAsync } from './utils/catchAsync.js'
import {pokemonRoutes} from './routes/pokemon.js'
import {userRoutes} from './routes/user.js'

import Pokedex from 'pokedex-promise-v2'
const P = new Pokedex()

mongoose.connect('mongodb://localhost:27017/community-dex', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const db = mongoose.connection
db.on("error", console.error.bind(console, "connection error:"))
db.once("open", () => {
    console.log("Database connected")
})

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))

const sessionConfig = {
    secret: 'thisshouldbeabettersecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig))
app.use(flash())

app.use(passport.initialize())
app.use(passport.session())
passport.use(new localStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.use((req, res, next) => {
    res.locals.currentUser = req.user
    res.locals.success = req.flash('success')
    res.locals.error = req.flash('error')
    next()
})

app.use('/pokemon', pokemonRoutes)
app.use('/', userRoutes)

app.get('/', (req, res) => {
    res.render('home')
})

app.get('/userPokemon', catchAsync(async (req, res) => {
    let userPokemon
    const {filter} = req.query
    if(!filter || filter === 'descending'){
        userPokemon = await Pokemon.find({}).sort({pokedexNum: -1})
    }
    else if(filter === 'ascending'){
        userPokemon = await Pokemon.find({})
    }
    else if(filter === 'a-z'){
        userPokemon = await Pokemon.find({}).collation({locale:'en',strength: 2}).sort({name:1})
    }
    res.render('pokemon/userPokemon', { userPokemon, filter })
}))

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500, message = 'Something went wrong' } = err
    res.status(statusCode).render('error', { err })
})


app.listen(3000, () => {
    console.log("LISTENING ON PORT 3000")
})