import express from 'express';

const userRouter = express.Router();

userRouter.post('/login', (req, res) => {
	res.send('login')
})

userRouter.post('/signup', (req, res) => {
	res.send('signup')
})

export { userRouter }
