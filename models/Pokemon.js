import { createRequire } from "module";
const require = createRequire(import.meta.url);
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const pokemonSchema = new Schema({
    pokedexNum: {
        type: Number,
        min: 906,
        unique: true,
        required: true
    },
    name: {
        type: String,
        max: 12,
        required: true,
        unique: true
    },
    type1: {
        type: String,
        max: 8,
        required: true,
        enum: ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy']
    },
    type2: {
        type: String,
        max: 8,
        required: false,
        enum: ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy']
    },
    height: {
        type: Number,
        max: 9999,
        required: true
    },
    weight: {
        type: Number,
        max: 9999,
        required: true
    },
    description: {
        type: String,
        max: 500,
        required: true
    }
})

const Pokemon = mongoose.model('Pokemon', pokemonSchema)
export { Pokemon }