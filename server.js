import express from 'express'
import { paymentProcess } from './services/paymentProcess.js';


const app = express()
const port = 3000;

app.use( express.json() )

app.post('/webhook', paymentProcess)

app.get('/webhook', (req, res) => {
  res.send('Webhook GET recibido');
});

app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`)
})