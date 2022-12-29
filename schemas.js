import { createRequire } from "module";
const require = createRequire(import.meta.url);
const Joi = require('joi')

const pokemonSchema = Joi.object({
        pokedexNum: Joi.number().required().min(906),
        name: Joi.string().required().max(12),
        type1: Joi.string().required().valid('normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'),
        type2: Joi.string().valid('normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy', ''),
        height: Joi.number().required().min(0).max(9999),
        weight: Joi.number().required().min(0).max(9999),
        description: Joi.string().required().max(500)
})

export {pokemonSchema}