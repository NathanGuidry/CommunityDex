import { createRequire } from "module";
const require = createRequire(import.meta.url);
const baseJoi = require('joi')
const sanitizeHtml = require('sanitize-html')

const extension = (joi) => ({
        type: 'string',
        base: joi.string(),
        messages: {
                'string.escapeHTML': '{{#label}} must not include HTML!'
        },
        rules: {
                escapeHTML: {
                        validate(value, helpers) {
                                const clean = sanitizeHtml(value, {
                                        allowedTags: [],
                                        allowedAttributes: {}
                                })
                                if (clean !== value) return helpers.error('string.escapeHTML', { value })
                                return clean
                        }
                }
        }
})

const Joi = baseJoi.extend(extension)

export const pokemonSchema = Joi.object({
        pokedexNum: Joi.number().required().min(906),
        name: Joi.string().required().max(12).escapeHTML(),
        type1: Joi.string().required().valid('normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'),
        type2: Joi.string().valid('normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy', ''),
        height: Joi.number().required().min(0).max(9999),
        weight: Joi.number().required().min(0).max(9999),
        description: Joi.string().required().max(500).escapeHTML()
})

export const updatePokemonSchema = Joi.object({
        pokedexNum: Joi.number().required().min(906),
        name: Joi.string().required().max(12).escapeHTML(),
        image: Joi.string().allow(null, '').escapeHTML(),
        type1: Joi.string().required().valid('normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'),
        type2: Joi.string().valid('normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy', ''),
        height: Joi.number().required().min(0).max(9999),
        weight: Joi.number().required().min(0).max(9999),
        description: Joi.string().required().max(500).escapeHTML()
})

export const userSchema = Joi.object({
        email: Joi.string().required().escapeHTML(),
        username: Joi.string().required().max(15).escapeHTML(),
        password: Joi.string().required().min(8).escapeHTML()
})

export const commentSchema = Joi.object({
        body: Joi.string().required().max(500).escapeHTML()
})