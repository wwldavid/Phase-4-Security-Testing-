import express from 'express';
import validateJWT from '../middleware/validateToken.js';
import Comment from '../models/Comment.js';

const commentRouter = express.Router();

commentRouter.use(validateJWT);

commentRouter.post("/", async (req, res) => {

    const user = req.user;

    const {username, commenttxt} = req.body;

    if(user.username != username) {
        return res.status(401).json({message:"token mismatch"});
    }

    console.log(`adding comment: ${commenttxt}`);

    const newComment = new Comment({
        user: username,
        text: commenttxt,
    });
    try {
        await newComment.save();
        res.status(201).json({
            message: "comment saved",
            comment: {
                user: username,
                text: commenttxt
            }
        })
    } catch(error) {
        console.error(`Error while saving comment`);
        console.error(error);
        res.status(500).json({message: "Internal server error"});
    }
    

});

commentRouter.get("/", async (req,res) => {

    try {

        const comments = await Comment.find({});

        res.status(200).json({
            comment_list: comments,
        })

    } catch(error) {
        console.error(`error while getting comments`);
        console.error(error);

        res.status(500).json({message: "internal server error"});
    }
});

export default commentRouter;