import { createRequire } from "module";
const require = createRequire(import.meta.url);
const mongoose = require('mongoose')
import { Pokemon } from '../models/Pokemon.js'

mongoose.connect('mongodb://localhost:27017/community-dex', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const db = mongoose.connection
db.on("error", console.error.bind(console, "connection error:"))
db.once("open", () => {
    console.log("Database connected")
})

const seedDB = async () => {
    await Pokemon.deleteMany({})
    const mon = new Pokemon({ pokedexNum: 906, name: 'Nathan', type1: 'fire', description: 'I hope this works' })
    const mon2 = new Pokemon({ pokedexNum: 907, name: 'Ndfg', type1: 'poison', type2: 'ground', description: 'I sdais works' })
    const mon3 = new Pokemon({ pokedexNum: 908, name: 'Ndfgweq', type1: 'poison', type2: 'ground', description: 'I sdairwets works' })
    const mon4 = new Pokemon({ pokedexNum: 909, name: 'Ndfgqwer', type1: 'poison', type2: 'ground', description: 'I sdawteris works' })
    const mon5 = new Pokemon({ pokedexNum: 910, name: 'Ndfgrwet', type1: 'poison', type2: 'ground', description: 'I sdaierwts works' })
    await mon.save()
    await mon2.save()
    await mon3.save()
    await mon4.save()
    await mon5.save()
}

seedDB()