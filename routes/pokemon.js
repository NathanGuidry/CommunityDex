import { createRequire } from "module";
const require = createRequire(import.meta.url);
const express = require('express')
const router = express.Router()
import { ExpressError } from '../utils/ExpressError.js'
import { Pokemon } from '../models/Pokemon.js'
import { catchAsync } from '../utils/catchAsync.js'
import {pokemonSchema} from '../schemas.js'
import Fuse from 'fuse.js'
const Filter = require('bad-words')
const filter = new Filter()
const numOfSpecialPokemon = 249
const numOfBasePokemon = 905

import Pokedex from 'pokedex-promise-v2'
const P = new Pokedex()

const validatePokemon = (req, res, next) => {
    const { error } = pokemonSchema.validate(req.body)
    const {type1, type2, name, description} = req.body
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    }
    if(type1 === type2){
        const msg = 'Type 1 and Type 2 cannot be the same'
        throw new ExpressError(msg, 400)
    }
    if(filter.isProfane(name)){
        const msg = 'That pokemon name is not allowed'
        throw new ExpressError(msg, 400)
    }
    if(filter.isProfane(description)){
        const msg = 'That description is not allowed'
        throw new ExpressError(msg, 400)
    }
    next()
}

const nameChecker = async function (req, res, next) {
    const basePokemon = await P.getPokemonsList()
    const baseNames = basePokemon.results.slice(0, -numOfSpecialPokemon)
    const userPokemon = await Pokemon.find({})
    const { name } = req.body
    const err = {}
    err.message = 'A pokemon with this name already exists'
    for (let i = 0; i < numOfBasePokemon; i++) {
        if (name.toLowerCase() === baseNames[i].name) {
            res.render('error', { err })
            return
        }
    }
    for(let i = 0; i < userPokemon.length; i++){
        if(name.toLowerCase() === userPokemon[i].name.toLowerCase()){
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

router.get('/', catchAsync(async (req, res) => {
    const {filter, search} = req.query
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
    if(search){
        const fuse = new Fuse(pokemon, options)
        pokemon = fuse.search(search)
    }
    if(filter === 'descending'){
        pokemon = pokemon.reverse((a, b) => {
            return a.pokedexNum - b.pokedexNum
        })
    }
    else if(filter === 'a-z'){
        pokemon = pokemon.sort((a, b) => {
            let fa
            let fb
            if(search){
                fa = a.item.name.toLowerCase()
                fb = b.item.name.toLowerCase()
            }
            else{
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
    res.render('pokemon/index', { pokemon, filter, search})
}))

router.post('/', validatePokemon, nameChecker, catchAsync(async (req, res) => {
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

router.get('/new', catchAsync(async (req, res) => {
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
        let pokemon = await Pokemon.find({ pokedexNum: id })
        pokemon = pokemon[0]
        const description = pokemon.description
        res.render('pokemon/show', { pokemon, id, description, numOfBasePokemon, maxId })
    }
}))

router.delete('/:id', catchAsync(async (req, res) => {
    const { id } = req.params
    const pokemon = await Pokemon.findOneAndDelete({ pokedexNum: id })
    const remainingPokemon = await Pokemon.find({ pokedexNum: { $gt: id } })
    for (let pokemon of remainingPokemon) {
        pokemon.pokedexNum = pokemon.pokedexNum - 1
        await pokemon.save()
    }
    res.redirect('/userPokemon')
}))

router.get('/:id/edit', catchAsync(async (req, res) => {
    const { id } = req.params
    let pokemon = await Pokemon.find({ pokedexNum: id })
    pokemon = pokemon[0]
    res.render('pokemon/edit', { id, pokemon })
}))

router.patch('/:id', validatePokemon, nameChecker, catchAsync(async (req, res) => {
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

const handleDuplicateKey = err => {
    return new ExpressError('A pokemon with that name already exists', 500)
}

router.use((err, req, res, next) => {
    console.dir(err)
    if (err.name === 'MongoServerError') err = handleDuplicateKey(err)
    next(err)
})

router.use((err, req, res, next) => {
    const { statusCode = 500, message = 'Something went wrong' } = err
    res.status(statusCode).render('error', { err })
})

const pokemonRoutes = router

export {pokemonRoutes}