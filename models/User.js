import { createRequire } from "module";
const require = createRequire(import.meta.url);
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const passportLocalMongoose = require('passport-local-mongoose')

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    image: {
        url: String,
        filename: String
    },
    bio: {
        type: String,
        max: [500, 'Bio is too long']
    },
    likedPokemon: [{
        type: String
    }]
})

userSchema.plugin(passportLocalMongoose)

const User = mongoose.model('User', userSchema)
export { User }