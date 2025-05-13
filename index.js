import express from 'express';

const port = 8000;
const app = express();

app.get('/', (req, res) => {
	res.setHeader('Content-Type', 'text/plain')
	res.send('Home route /')
})

app.get('/hello', (req, res) => {
	res.send('Привет!');
});

app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`);
});
