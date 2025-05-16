import express from 'express';
import { userRouter } from './users/users.js';

const port = 8000;
const app = express();

app.use('/users', userRouter)

app.get('/', (req, res) => {
	res.download('package.json');
	res.redirect(301, '/hello');
});

app.get('/hello', (req, res) => {
	// res.set('Content-Type', 'text/plain');
	// res.cookie('token', 'asdadade32e4c', {
	// 	domain: '',
	// 	path: '/',
	// 	secure: true,
	// 	expires: 6000000,
	// })
	// res.clearCookie('token') // when logout
	// res.type('application/json');
	// res.location('/hello')
	// res.links({
	// 	next: 'dadasd',
	// });
	// res.append('Warning', 'custom-http-response-header');
	throw new Error('Error!!!');
	
	res.send('Привет!');
});

app.get('/nothing', (req, res) => {
	res.status(404).end() // end is important, without end() call it'd be infinite(endless) request
})

app.get('/never', (req, res) => {
	res.end()
})

// error handler middleware should be after all app.use() calls
app.use((err, req, res, next) => {
	console.log(err.message);
	res.status(401).send(err.message)
})

app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`);
});
