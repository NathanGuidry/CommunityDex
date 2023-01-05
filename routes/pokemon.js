import { createRequire } from "module";
const require = createRequire(import.meta.url);
const express = require('express')
const router = express.Router()
import { ExpressError } from '../utils/ExpressError.js'
import { Pokemon } from '../models/Pokemon.js'
import { catchAsync } from '../utils/catchAsync.js'
import Fuse from 'fuse.js'
const Filter = require('bad-words')
const filter = new Filter()
const multer = require('multer')
import { storage, cloudinary } from '../cloudinary/index.js';
const upload = multer({ storage })

const numOfSpecialPokemon = 249
const numOfBasePokemon = 905

const words = require('../extra-bad-words.json')
filter.addWords(...words)

import Pokedex from 'pokedex-promise-v2'
import { isAuthorized, isLoggedIn, validatePokemon, nameChecker, englishDesc } from "../middleware.js";
const P = new Pokedex()

router.get('/', catchAsync(async (req, res) => {
    const { filter, search } = req.query
    const options = {
        keys: ['name', 'pokedexNum']
    }
    let pokemon = await P.getPokemonsList()
    const pokemonNames = pokemon.results.slice(0, -numOfSpecialPokemon)
    const userPokemon = await Pokemon.find({})
    pokemon = pokemonNames.concat(userPokemon)
    pokemon.forEach((value, index) => {
        value.pokedexNum = index + 1
    })
    if (search) {
        const fuse = new Fuse(pokemon, options)
        pokemon = fuse.search(search)
    }
    if (filter === 'descending') {
        pokemon = pokemon.reverse((a, b) => {
            return a.pokedexNum - b.pokedexNum
        })
    }
    else if (filter === 'a-z') {
        pokemon = pokemon.sort((a, b) => {
            let fa
            let fb
            if (search) {
                fa = a.item.name.toLowerCase()
                fb = b.item.name.toLowerCase()
            }
            else {
                fa = a.name.toLowerCase()
                fb = b.name.toLowerCase()
            }

            if (fa < fb) {
                return -1
            }
            if (fa > fb) {
                return 1
            }
            return 0

        })
    }
    res.render('pokemon/index', { pokemon, filter, search, numOfBasePokemon })
}))

router.post('/', isLoggedIn, upload.single('image'), validatePokemon, nameChecker, catchAsync(async (req, res) => {
    const { pokedexNum, name, type1, type2, height, weight, description } = req.body
    if (!req.file) {
        req.flash('error', 'You must provide a picture of the pokemon')
        res.redirect('/pokemon/new')
    }
    const { path, filename } = req.file
    if (type2) {
        const newPokemon = new Pokemon({ pokedexNum, name, type1, type2, height, weight, description })
        newPokemon.author = req.user._id
        newPokemon.image = { url: path, filename }
        await newPokemon.save()
        req.flash('success', 'Successfully created Pokemon')
        res.redirect(`/pokemon/${pokedexNum}`)
    }
    else {
        const newPokemon = new Pokemon({ pokedexNum, name, type1, height, weight, description })
        newPokemon.author = req.user._id
        newPokemon.image = { url: path, filename }
        await newPokemon.save()
        req.flash('success', 'Successfully created Pokemon')
        res.redirect(`/pokemon/${pokedexNum}`)
    }
}))

router.get('/new', isLoggedIn, catchAsync(async (req, res) => {
    const maxId = await Pokemon.findOne({}).sort({ pokedexNum: -1 })
    res.render('pokemon/new', { maxId })
}))

router.get('/:id', catchAsync(async (req, res) => {
    const { id } = req.params
    const maxPokemon = await Pokemon.findOne({}).sort({ pokedexNum: -1 })
    const maxId = maxPokemon.pokedexNum
    if (id <= numOfBasePokemon) {
        const pokemon = await P.getPokemonByName(id)
        const description = await englishDesc(id)
        res.render('pokemon/show', { pokemon, id, description, numOfBasePokemon, maxId })
    }
    else {
        let pokemon = await Pokemon.find({ pokedexNum: id }).populate({
            path: 'comments',
            populate: {
                path: 'author'
            }
        }).populate('author')
        if (!pokemon.length) {
            req.flash('error', 'That Pokemon does not exist')
            res.redirect('/pokemon')
        }
        pokemon = pokemon[0]
        const description = pokemon.description
        res.render('pokemon/show', { pokemon, id, description, numOfBasePokemon, maxId })
    }
}))

router.delete('/:id', isLoggedIn, isAuthorized, catchAsync(async (req, res) => {
    const { id } = req.params
    const pokemon = await Pokemon.findOneAndDelete({ pokedexNum: id })
    const remainingPokemon = await Pokemon.find({ pokedexNum: { $gt: id } })
    for (let pokemon of remainingPokemon) {
        pokemon.pokedexNum = pokemon.pokedexNum - 1
        await pokemon.save()
    }
    req.flash('success', 'Successfully deleted Pokemon')
    res.redirect('/userPokemon')
}))

router.get('/:id/edit', isLoggedIn, isAuthorized, catchAsync(async (req, res) => {
    const { id } = req.params
    let pokemon = await Pokemon.find({ pokedexNum: id })
    pokemon = pokemon[0]
    res.render('pokemon/edit', { id, pokemon })
}))

router.patch('/:id', isLoggedIn, isAuthorized, upload.single('image'), validatePokemon, nameChecker, catchAsync(async (req, res) => {
    const { id } = req.params
    console.log(req.file)
    let { name, type1, type2, description } = req.body
    if (req.file) {
        const tempPokemon = await Pokemon.findOne({ pokedexNum: id })
        await cloudinary.uploader.destroy(tempPokemon.image.filename)
    }
    if (type2 === '' && req.file) {
        const pokemon = await Pokemon.findOneAndUpdate({ pokedexNum: id }, { name, type1, $unset: { type2: "" }, description, image: { url: req.file.path, filename: req.file.filename } }, { runValidators: true, new: true })
        req.flash('success', 'Successfully updated Pokemon')
    } else if (type2 === '') {
        const pokemon = await Pokemon.findOneAndUpdate({ pokedexNum: id }, { name, type1, $unset: { type2: "" }, description }, { runValidators: true, new: true })
        req.flash('success', 'Successfully updated Pokemon')
    }
    else if (req.file) {
        const pokemon = await Pokemon.findOneAndUpdate({ pokedexNum: id }, { name, type1, type2, description, image: { url: req.file.path, filename: req.file.filename } }, { runValidators: true, new: true })
        req.flash('success', 'Successfully updated Pokemon')
    }
    else {
        const pokemon = await Pokemon.findOneAndUpdate({ pokedexNum: id }, { name, type1, type2, description }, { runValidators: true, new: true })
        req.flash('success', 'Successfully updated Pokemon')
    }
    res.redirect(`/pokemon/${id}`)
}))

const handleDuplicateKey = err => {
    return new ExpressError('A pokemon with that name already exists', 500)
}

router.use((err, req, res, next) => {
    if (err.name === 'MongoServerError') err = handleDuplicateKey(err)
    next(err)
})

router.use((err, req, res, next) => {
    const { statusCode = 500, message = 'Something went wrong' } = err
    res.status(statusCode).render('error', { err })
})

const pokemonRoutes = router
export { pokemonRoutes }