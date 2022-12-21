import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const express = require('express')
const app = express()
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mongoose = require('mongoose')
// const Pokemon = require('./models/')
const methodOverride = require('method-override')

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

app.get('/pokemon', async (req, res) => {
    try {
        const pokemon = await P.getPokemonsList()
        const numOfSpecialPokemon = -249
        const pokemonNames = pokemon.results.slice(0, numOfSpecialPokemon)
        res.render('pokemon/index', { pokemonNames })
    }
    catch (e) {
        console.log(e)
        res.send('error')
    }
})

app.get('/pokemon/:id', async (req, res) => {
    try {
        const { id } = req.params
        const pokemon = await P.getPokemonByName(id)
        const species = await P.getPokemonSpeciesByName(id)
        const description = species.flavor_text_entries[0].flavor_text
        res.render('pokemon/show', { pokemon, id, description })
    }
    catch (e) {
        console.log(e)
        res.send('error')
    }
})

app.listen(3000, () => {
    console.log("LISTENING ON PORT 3000")
})