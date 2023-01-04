import { createRequire } from "module";
const require = createRequire(import.meta.url);
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const commentSchema = new Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    body: {
        type: String,
        required: true,
        maxlength: 500
    }
})

const Comment = mongoose.model('Comment', commentSchema)

export { Comment }