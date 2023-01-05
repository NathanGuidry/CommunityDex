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



const newSeed = async function () {
    await Pokemon.deleteMany({})
    const mon = new Pokemon({
        pokedexNum: 906, name: 'hi', type1: 'grass', height: '6', weight: '130', description: 'hi', author: '63b226e17f864def3b536e06', image: {
            url: 'https://res.cloudinary.com/dsavothdm/image/upload/v1672887202/CommunityDex/eykwyxvrjefkezu9wh5c.png',
            filename: 'CommunityDex/eykwyxvrjefkezu9wh5c'
        }
    })
    await mon.save()
}

newSeed()