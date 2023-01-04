import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { Pokemon } from './models/Pokemon.js'
import Pokedex from 'pokedex-promise-v2'
const P = new Pokedex()
import { commentSchema, pokemonSchema, userSchema } from './schemas.js'
const Filter = require('bad-words')
const filter = new Filter()
const words = require('./extra-bad-words.json')
filter.addWords(...words)
import { ExpressError } from './utils/ExpressError.js'

const numOfSpecialPokemon = 249
const numOfBasePokemon = 905

export const isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl
        req.flash('error', 'You must be signed in first!')
        return res.redirect('/login')
    }
    next()
}

export const isAuthorized = async (req, res, next) => {
    const { id } = req.params
    const pokemon = await Pokemon.findOne({ pokedexNum: id })
    if (!pokemon.author._id.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that')
        return res.redirect(`/pokemon/${id}`)
    }
    next()
}

export const validatePokemon = (req, res, next) => {
    const { error } = pokemonSchema.validate(req.body)
    const { type1, type2, name, description } = req.body
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    }
    if (type1 === type2) {
        const msg = 'Type 1 and Type 2 cannot be the same'
        req.flash('error', msg)
        return res.redirect('back')
    }
    if (filter.isProfane(name)) {
        const msg = 'That pokemon name is not allowed'
        req.flash('error', msg)
        return res.redirect('back')
    }
    if (filter.isProfane(description)) {
        const msg = 'That description is not allowed'
        req.flash('error', msg)
        return res.redirect('back')
    }
    next()
}

export const validateUser = (req, res, next) => {
    const { error } = userSchema.validate(req.body)
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    }
    next()
}

export const validateComment = (req, res, next) => {
    const { error } = commentSchema.validate(req.body)
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    }
    next()
}

export const nameChecker = async function (req, res, next) {
    const basePokemon = await P.getPokemonsList()
    const baseNames = basePokemon.results.slice(0, -numOfSpecialPokemon)
    const userPokemon = await Pokemon.find({})
    const { name, pokedexNum } = req.body
    const err = {}
    const currentPokemon = await Pokemon.findOne({ pokedexNum })
    err.message = 'A pokemon with this name already exists'
    if (req.method === 'PATCH' && name !== currentPokemon.name) {
        for (let i = 0; i < numOfBasePokemon; i++) {
            if (name.toLowerCase() === baseNames[i].name) {
                res.render('error', { err })
                return
            }
        }
        for (let i = 0; i < userPokemon.length; i++) {
            if (name.toLowerCase() === userPokemon[i].name.toLowerCase()) {
                res.render('error', { err })
                return
            }
        }
    }
    next()
}

export const englishDesc = async function (id) {
    const species = await P.getPokemonSpeciesByName(id)
    const numOfDescs = species.flavor_text_entries.length
    for (let i = 0; i < numOfDescs; i++) {
        if (species.flavor_text_entries[i].language.name === 'en') {
            return species.flavor_text_entries[i].flavor_text
        }
    }
}