import { updateOrCreateTicket } from "./processTicket.js";




export const paymentProcess = async(req, res) => {
    if(!req.body) {
        console.error('No se recibio un body en le requerimiento')
        res.json({ error: 'No se recibio un body' })
        return;
    }

    const data = req.body
    
    console.log('Webhook recibido: ', JSON.stringify(data, null, 3))

    data.events.map( e => {
        const { resource_type, action } = e
        const { payment } = e.links
        const { cause, description } = e.details


        
        if(resource_type === "payments" && (action === "charged_back" || action === "failed") ) {
            switch (action) {
                case "failed":
                    console.log("Es un pago devuelto") 
                    try {
                        updateOrCreateTicket( payment, cause, description, 'Pago rechazado' )
                    } catch (error) {
                        console.log('Error al crear el ticket: ', error)
                    }               
                    break;

                case "charged_back":
                    console.log("Es un pago fallido")
                    try {
                        updateOrCreateTicket( payment, cause, description, 'Pago devuelto' )
                    } catch (error) {
                        console.log('Error al crear el ticket: ', error)
                    }               
                break;
                    
                default:
                    break;
                }
        } else {
            console.error('El evento no cumple las condiciones para generar el ticket')
        }
    
    } )
    
    res.status(200).send('Webhook recibido')

    // const { resource_type, action } = data.events[0]
    // const { payment } = data.events[0].links
    // const { cause, description } = data.events[0].details

}
