import dotenv from 'dotenv'
dotenv.config()
import { Client } from "@hubspot/api-client";
const hubspotClient = new Client({ accessToken: process.env.TOKEN_HUBSPOT });


//verifica que no existan tickets con el mismo GocardlessID
const verifyGoCradlessId = async(gocardlessId) => {
    const url = 'https://api.hubapi.com/crm/v3/objects/tickets/search';
    const body = {
        limit: 1, // solo queremos uno
        filterGroups: [
        {
            filters: [
            {
                propertyName: "gocardless_id",
                operator: "EQ",
                value: gocardlessId
            }
            ]
        }
    ],
    sorts: [
        {
            propertyName: "createdAt",
            direction: "DESCENDING" // más reciente primero
        }
    ]
};
const options = {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${process.env.TOKEN_HUBSPOT}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
};

try {
    const response = await fetch(url, options);
    const data = await response.json();
    console.log(data)
    return data.results;
    } catch (error) {
        console.error(error);
    }
}

//crea ticket
const createTicket = async( gocardlessId, motivo_del_rechazo, descripcion_del_rechazo, nombre ) => {
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

//actualiza ticket si es que encuentra uno que ya existe con el mismo gocardlessID
const updateTicket = async(ticketId) => {
    const url = `https://api.hubapi.com/crm/v3/objects/tickets/${ticketId}`;
    const properties = {
        fecha_de_ultima_pago_rechazado: new Date().getTime()
    }
    const options = {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${process.env.TOKEN_HUBSPOT}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({properties})
    }
    
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error(error);
    }
}

//deja una nota despues de actualizar el ticket existente
const createNote = async(ticketId, tipoDeRechazo) => {
    const url = 'https://api.hubapi.com/crm/v3/objects/notes';
    const body = {
        properties: {
            hs_timestamp: new Date().getTime(),
            hs_note_body: "Se recibió un nuevo " + tipoDeRechazo + " por un nuevo intento de domiciliación."
        },
        associations: [
            {
                to: {
                    id: ticketId // ⚠️ debe ser string
                },
                types: [
                    {
                        associationCategory: "HUBSPOT_DEFINED",
                        associationTypeId: 228 // el ID de la asociación
                    }
                ]
            }
        ]
    };
    const options = {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${process.env.TOKEN_HUBSPOT}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
    }

    try {
        const response = await fetch(url, options);
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error(error);
    }
}

const createTask = async(ticketId, tipoDeRechazo) => {
    let fecha = new Date();
    fecha.setDate( fecha.getDate() + 1 );

    const url = 'https://api.hubapi.com/crm/v3/objects/tasks';
    const body = {
        properties: {
            hs_timestamp: fecha.getTime(),
            hs_task_body: "Se recibió un nuevo " + tipoDeRechazo + " por un nuevo intento de domiciliación. Este pago ya había sido previamente " + tipoDeRechazo + ".",
            hs_task_subject: "Nuevo " + tipoDeRechazo + " en intento repetido de pago",
            hubspot_owner_id: '1287979215' //siempre jessica
        },
        associations: [
            {
                to: {
                    id: ticketId // ⚠️ debe ser string
                },
                types: [
                    {
                        associationCategory: "HUBSPOT_DEFINED",
                        associationTypeId: 230 // el ID de la asociación
                    }
                ]
            }
        ]
    };
    const options = {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${process.env.TOKEN_HUBSPOT}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
    }

    try {
    const response = await fetch(url, options);
    const data = await response.json();
    console.log(data);
    } catch (error) {
    console.error(error);
    }
}

export const updateOrCreateTicket = async(gocardlessId, motivo_del_rechazo, descripcion_del_rechazo, nombre ) => {

    try {
        const payExists = await verifyGoCradlessId(gocardlessId)
        if(payExists.length < 1) {
            console.log('No existen tickets con el mismo gocardlessId, se prosigue a la creacion')
            createTicket(gocardlessId, motivo_del_rechazo, descripcion_del_rechazo, nombre)
        }
    
        const {id} = payExists[0]; //Id del ticket encontrado
    
        await updateTicket(id);
        await createNote(id, nombre)
        createTask(id, nombre)
        
    } catch (error) {
        console.log(error.message)
    }
}