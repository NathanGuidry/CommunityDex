import { createRequire } from "module";
const require = createRequire(import.meta.url);
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const pokemonSchema = new Schema({
    pokedexNum: {
        type: Number,
        min: [906, 'A pokemon with that Pokedex # already exists'],
        unique: [true, 'A pokemon with that Pokedex # already exists'],
        required: true
    },
    name: {
        type: String,
        maxlength: 12,
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
        type: [Number, 'Height must be a number'],
        min: [0, 'Height cannot be negative'],
        max: [9999, 'Height is too large'],
        required: true
    },
    weight: {
        type: [Number, 'Weight must be a number'],
        min: [0, 'Weight cannot be negative'],
        max: [9999, 'Weight is too large'],
        required: true
    },
    description: {
        type: String,
        maxlength: [500, 'Description is too long'],
        required: true
    }
})

const Pokemon = mongoose.model('Pokemon', pokemonSchema)
export { Pokemon }