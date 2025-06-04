import dotenv from 'dotenv'
dotenv.config()
import { Client } from "@hubspot/api-client";
const hubspotClient = new Client({ accessToken: process.env.TOKEN_HUBSPOT });

export const createTicket = async(gocardlessId, motivo_del_rechazo, descripcion_del_rechazo, nombre ) => {

    const properties = {
    "gocardless_id": gocardlessId,
    "content": descripcion_del_rechazo,
    "motivo_de_rechazo": motivo_del_rechazo,
    "subject": nombre,
    "hs_pipeline_stage": "2318638320" //Estado: Nuevo pago rechazado
    };
    const config = { associations: [], properties };
    
    try {
        const apiResponse = await hubspotClient.crm.tickets.basicApi.create(config);
        console.log(JSON.stringify(apiResponse, null, 2));
    } catch (error) {
        console.error( 'No se pudo crear el ticket: ' ,error)
    }
}
