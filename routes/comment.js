import { createRequire } from "module";
const require = createRequire(import.meta.url);
const express = require('express')
const router = express.Router({ mergeParams: true })
import { Pokemon } from '../models/Pokemon.js'
import { Comment } from '../models/Comment.js'
import { catchAsync } from '../utils/catchAsync.js'
import { isLoggedIn, validateComment } from "../middleware.js";

router.post('/', isLoggedIn, validateComment, catchAsync(async (req, res) => {
    const { id } = req.params
    const pokemon = await Pokemon.findOne({ pokedexNum: id }).populate('comments')
    const comment = new Comment(req.body)
    comment.author = req.user._id
    console.log(pokemon)
    pokemon.comments.push(comment)
    await comment.save()
    await pokemon.save()
    req.flash('success', 'Successfully made a new comment')
    res.redirect(`/pokemon/${pokemon.pokedexNum}`)
}))

router.delete('/:commentId', catchAsync(async (req, res) => {
    const { id, commentId } = req.params
    const deletedComment = await Comment.findOneAndDelete({ _id: commentId })
    req.flash('success', 'Successfully deleted comment')
    res.redirect(`/pokemon/${id}`)
}))



const commentRoutes = router
export { commentRoutes }