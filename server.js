import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const express = require('express')
const app = express()
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mongoose = require('mongoose')
import { Pokemon } from './models/Pokemon.js'
const methodOverride = require('method-override')
const ejsMate = require('ejs-mate')
import { ExpressError } from './utils/ExpressError.js'
import { catchAsync } from './utils/catchAsync.js'
const numOfSpecialPokemon = 249
const numOfBasePokemon = 905

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

const nameChecker = async function (req, res, next) {
    const basePokemon = await P.getPokemonsList()
    const baseNames = basePokemon.results.slice(0, -numOfSpecialPokemon)
    const { name } = req.body
    const err = {}
    err.message = 'A pokemon with this name already exists'
    for (let i = 0; i < numOfBasePokemon; i++) {
        if (name.toLowerCase() === baseNames[i].name) {
            res.render('error', { err })
            return
        }
    }
    next()
}

const englishDesc = async function (id) {
    const species = await P.getPokemonSpeciesByName(id)
    const numOfDescs = species.flavor_text_entries.length
    for (let i = 0; i < numOfDescs; i++) {
        if (species.flavor_text_entries[i].language.name === 'en') {
            return species.flavor_text_entries[i].flavor_text
        }
    }
}

app.get('/', (req, res) => {
    res.render('home')
})

app.get('/userPokemon', catchAsync(async (req, res) => {
    const userPokemon = await Pokemon.find({})
    res.render('pokemon/userPokemon', { userPokemon })
}))

app.get('/pokemon', catchAsync(async (req, res) => {
    const pokemon = await P.getPokemonsList()
    const pokemonNames = pokemon.results.slice(0, -numOfSpecialPokemon)
    const userPokemon = await Pokemon.find({})
    res.render('pokemon/index', { pokemonNames, userPokemon })
}))

app.post('/pokemon', nameChecker, catchAsync(async (req, res) => {
    const { pokedexNum, name, type1, type2, height, weight, description } = req.body
    if (type2) {
        const newPokemon = new Pokemon({ pokedexNum, name, type1, type2, height, weight, description })
        await newPokemon.save()
        res.redirect('/userPokemon')
    }
    else {
        const newPokemon = new Pokemon({ pokedexNum, name, type1, height, weight, description })
        await newPokemon.save()
        res.redirect('/userPokemon')
    }
}))

app.get('/pokemon/new', catchAsync(async (req, res) => {
    const maxId = await Pokemon.findOne({}).sort({ pokedexNum: -1 })
    res.render('pokemon/new', { maxId })
}))

app.get('/pokemon/:id', catchAsync(async (req, res) => {
    const { id } = req.params
    if (id <= numOfBasePokemon) {
        const pokemon = await P.getPokemonByName(id)
        const description = await englishDesc(id)
        res.render('pokemon/show', { pokemon, id, description, numOfBasePokemon })
    }
    else {
        let pokemon = await Pokemon.find({ pokedexNum: id })
        pokemon = pokemon[0]
        const description = pokemon.description
        res.render('pokemon/show', { pokemon, id, description, numOfBasePokemon })
    }
}))

app.delete('/pokemon/:id', catchAsync(async (req, res) => {
    const { id } = req.params
    const pokemon = await Pokemon.findOneAndDelete({ pokedexNum: id })
    const remainingPokemon = await Pokemon.find({ pokedexNum: { $gt: id } })
    for (let pokemon of remainingPokemon) {
        pokemon.pokedexNum = pokemon.pokedexNum - 1
        await pokemon.save()
    }
    res.redirect('/userPokemon')
}))

app.get('/pokemon/:id/edit', catchAsync(async (req, res) => {
    const { id } = req.params
    let pokemon = await Pokemon.find({ pokedexNum: id })
    pokemon = pokemon[0]
    res.render('pokemon/edit', { id, pokemon })
}))

app.patch('/pokemon/:id', nameChecker, catchAsync(async (req, res) => {
    const { id } = req.params
    let { name, type1, type2, description } = req.body
    if (type2 === '') {
        const pokemon = await Pokemon.findOneAndUpdate({ pokedexNum: id }, { name, type1, $unset: { type2: "" }, description }, { runValidators: true, new: true })
    }
    else {
        const pokemon = await Pokemon.findOneAndUpdate({ pokedexNum: id }, { name, type1, type2, description }, { runValidators: true, new: true })
    }
    res.redirect(`/pokemon/${id}`)
}))

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

const handleDuplicateKey = err => {
    return new ExpressError('A pokemon with that name already exists', 500)
}

app.use((err, req, res, next) => {
    console.dir(err)
    if (err.name === 'MongoServerError') err = handleDuplicateKey(err)
    next(err)
})

app.use((err, req, res, next) => {
    const { statusCode = 500, message = 'Something went wrong' } = err
    res.status(statusCode).render('error', { err })
})

app.listen(3000, () => {
    console.log("LISTENING ON PORT 3000")
})