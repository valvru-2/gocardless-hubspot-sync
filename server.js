import express from 'express'
const app = express()
const port = 3000;

app.use( express.json() )

app.post('/webhook', (req, res) => {
    const data = req.body

    console.log('Webhook recibido: ', data)

    res.status(200).send('Webhook recibido')
})

app.get('/webhook', (req, res) => {
  res.send('Webhook GET recibido');
});

app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`)
})