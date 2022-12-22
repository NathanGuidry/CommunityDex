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

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))

app.get('/', (req, res) => {
    res.render('home')
})

app.get('/userPokemon', async (req, res) => {
    try {
        const userPokemon = await Pokemon.find({})
        res.render('pokemon/userPokemon', { userPokemon })
    }
    catch (e) {
        console.log(e)
        res.send('error')
    }
})

app.get('/pokemon', async (req, res) => {
    try {
        const pokemon = await P.getPokemonsList()
        const pokemonNames = pokemon.results.slice(0, -numOfSpecialPokemon)
        const userPokemon = await Pokemon.find({})
        res.render('pokemon/index', { pokemonNames, userPokemon })
    }
    catch (e) {
        console.log(e)
        res.send('error')
    }
})

app.post('/pokemon', async (req, res) => {
    try {
        const { pokedexNum, name, type1, type2, description } = req.body
        if (type2) {
            const newPokemon = new Pokemon({ pokedexNum, name, type1, type2, description })
            await newPokemon.save()
            res.redirect('/userPokemon')
        }
        else {
            const newPokemon = new Pokemon({ pokedexNum: id, name, type1, description })
            await newPokemon.save()
            res.redirect('/userPokemon')
        }
    }
    catch (e) {
        console.log(e)
        res.send('error')
    }
})

app.get('/pokemon/new', async (req, res) => {
    try {
        const maxId = await Pokemon.findOne({}).sort({ pokedexNum: -1 })
        res.render('pokemon/new', { maxId })
    }
    catch (e) {
        console.log(e)
        res.send('error')
    }
})

app.get('/pokemon/:id', async (req, res) => {
    try {
        const { id } = req.params
        if (id <= numOfBasePokemon) {
            const pokemon = await P.getPokemonByName(id)
            const species = await P.getPokemonSpeciesByName(id)
            const description = species.flavor_text_entries[0].flavor_text
            res.render('pokemon/show', { pokemon, id, description, numOfBasePokemon })
        }
        else {
            let pokemon = await Pokemon.find({ pokedexNum: id })
            pokemon = pokemon[0]
            const description = pokemon.description
            res.render('pokemon/show', { pokemon, id, description, numOfBasePokemon })
        }
    }
    catch (e) {
        console.log(e)
        res.send('error')
    }
})

app.delete('/pokemon/:id', async (req, res) => {
    try {
        const { id } = req.params
        const pokemon = await Pokemon.findOneAndDelete({ pokedexNum: id })
        const remainingPokemon = await Pokemon.find({ pokedexNum: { $gt: id } })
        for (let pokemon of remainingPokemon) {
            pokemon.pokedexNum = pokemon.pokedexNum - 1
            await pokemon.save()
        }
        res.redirect('/userPokemon')
    }
    catch (e) {
        console.log(e)
        res.send('error')
    }
})

app.get('/pokemon/:id/edit', async (req, res) => {
    try {
        const { id } = req.params
        let pokemon = await Pokemon.find({ pokedexNum: id })
        pokemon = pokemon[0]
        res.render('pokemon/edit', { id, pokemon })
    }
    catch (e) {
        console.log(e)
        res.send('error')
    }
})

app.patch('/pokemon/:id', async (req, res) => {
    try {
        const { id } = req.params
        let { name, type1, type2, description } = req.body
        if (type2 === '') {
            const pokemon = await Pokemon.findOneAndUpdate({ pokedexNum: id }, { name, type1, $unset: { type2: "" }, description }, { runValidators: true, new: true })
        }
        else {
            const pokemon = await Pokemon.findOneAndUpdate({ pokedexNum: id }, { name, type1, type2, description }, { runValidators: true, new: true })
        }
        res.redirect(`/pokemon/${id}`)
    }
    catch (e) {
        console.log(e)
        res.send('error')
    }


})

app.listen(3000, () => {
    console.log("LISTENING ON PORT 3000")
})