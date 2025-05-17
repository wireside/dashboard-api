import express from 'express';

const userRouter = express.Router();

userRouter.use((req, res, next) => {
	console.log('Handled by middleware:', new Date(Date.now()));
	next();
});

userRouter.post('/login', (req, res) => {
	res.send('login');
});

userRouter.post('/signup', (req, res) => {
	res.send('signup');
});

export { userRouter };
