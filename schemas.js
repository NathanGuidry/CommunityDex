import { createRequire } from "module";
const require = createRequire(import.meta.url);
const Joi = require('joi')

export const pokemonSchema = Joi.object({
        pokedexNum: Joi.number().required().min(906),
        name: Joi.string().required().max(12),
        type1: Joi.string().required().valid('normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'),
        type2: Joi.string().valid('normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy', ''),
        height: Joi.number().required().min(0).max(9999),
        weight: Joi.number().required().min(0).max(9999),
        description: Joi.string().required().max(500)
})

export const updatePokemonSchema = Joi.object({
        pokedexNum: Joi.number().required().min(906),
        name: Joi.string().required().max(12),
        image: Joi.string().allow(null, ''),
        type1: Joi.string().required().valid('normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'),
        type2: Joi.string().valid('normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy', ''),
        height: Joi.number().required().min(0).max(9999),
        weight: Joi.number().required().min(0).max(9999),
        description: Joi.string().required().max(500)
})

export const userSchema = Joi.object({
        email: Joi.string().required(),
        username: Joi.string().required().max(12),
        password: Joi.string().required().min(12)
})

export const commentSchema = Joi.object({
        body: Joi.string().required().max(500)
})