const express = require('express');
const db = require('../models/db');

router = express.Router();

// 1 Traer todos
router.get('/', (req, res) => {

    dbTickets = db.getInstance();
    dbTickets.collection("ticketera")
        .find()
        .toArray(function (err, items) {
            res.send(items);
        });
})

// 2 Motivo de los cambio de planes
router.get('/motivoCambioPlan', (req, res) => {
    dbTickets = db.getInstance();
    dbTickets.collection("ticketera")
        .aggregate([
            { $match: { motivo: "Cambio de plan" } },
            { $unwind: "$cliente" },
            { $project: { _id: 1, motivo: 1,descripcion: 1,fecha: 1} },
            { $group: { _id: "$motivo", cantidad: { $sum: 1 }} }
        ]).toArray((err, result) => {
            if (err) return console.log(err)
            console.log(result)
            res.send(result)
        })
})

// 3 Lugares de donde vienen los tickets de los cambio de plan
router.get('/lugarTicketCambioPlan', (req, res) => {
    dbTickets = db.getInstance();
    dbTickets.collection("ticketera")
        .aggregate([
            { $match: { motivo: "Cambio de plan" } },
            {
                $group: {
                    _id: "$descripcion",
                    ubicaciones: { $push: "$cliente.zona.localidad.nombre" }
                }
            }
        ]).toArray((err, result) => {
            if (err) return console.log(err)
            console.log(result)
            res.send(result)
        })
})

// 4 Beneficios de plan de los primeros 10 clientes
router.get('/beneficiosClientes', (req, res) => {
    dbTickets = db.getInstance();
    dbTickets.collection("ticketera")
        .aggregate([
            { $unwind: "$cliente.plan.beneficios" },
            {
                $project: {
                    idCliente: "$cliente.numeroCliente",
                    cantidadBeneficios: { $sum: 1 },
                    "cliente.plan.beneficios":1
                }
            },
            { $limit: 10 }
        ]).toArray((err, result) => {
            if (err) return console.log(err)
            console.log(result)
            res.send(result)
        })
})


// 5 Operaciones fallidas de todos los tickets
router.get('/operacionesFallidas', (req, res) => {
    dbTickets = db.getInstance();
    dbTickets.collection("ticketera")
        .aggregate([
            { $unwind: "$derivacion.operacion" },
            { $match: { "derivacion.operacion.funciono": { $nin: [true] } } },
            {
                $project: {
                    id:1,
                    "derivacion.empleado.numeroEmpleado":1,
                    fecha: 1,
                    descripcion: 1,
                    "derivacion.operacion.descripcion": 1,
                    "derivacion.operacion.funciono":1
                }
            }
        ]).toArray((err, result) => {
            if (err) return console.log(err)
            console.log(result)
            res.send(result)
        })
})

// 6 Traer todos los tickets que vengan de clientes de EEUU
router.get('/clientesEnEEUU', (req, res) => {
    dbTickets = db.getInstance();
    dbTickets.collection("ticketera")
        .find({
            "cliente.zona.ubicacion":{
                    $geoWithin:{
                        $geometry:{
                            "type": "Polygon",
                            "coordinates": [[[-130.166015625,24.766784522874453],[-69.9609375,24.766784522874453],[-69.9609375,49.83798245308484],[-130.166015625,49.83798245308484],[-130.166015625,24.766784522874453]]]
                        }   
                    }
                }
            }
        )
        .toArray((err, result) => {
            if (err) return console.log(err)
            console.log(result)
            res.send(result)
        })
})

// 7 Cuantos tickets hay derivados de oficinas a menos de 100km de la Capital de Florida

router.get('/capitalFlorida', (req, res) => {
    dbTickets = db.getInstance();
    dbTickets.collection("ticketera")
        .find(
            {
                "derivacion.empleado.oficina.zona.ubicacion":{ 
                    $near:{ 
                        $geometry:{   
                            "type": "Point",
                            "coordinates": [
                                -84.28304314613342,
                                30.435788758699974
                            ]
                        },
                        $maxDistance: 100000
                    }
                }
            }
        )
        .toArray((err, result) => {
            if (err) return console.log(err)
            console.log(result)
            res.send(result)
        })
})

// 8 Tickets de clientes con planes mayores a 50gb y de FibraOptica

router.get('/ticketsFibraOptica', (req, res) => {
    dbTickets = db.getInstance();
    dbTickets.collection("ticketera")
        .find({
            $or:[
                {motivo:"Mejora de paquete"},
                {motivo:"Cambio de plan"}
            ],
            $and:[
                {
                    "cliente.plan.cantidadGigas":{$gt: 50}
                },
                {
                    "cliente.plan.tipo":"FibraOptica"
                }
            ]
        }).toArray((err, result) => {
            if (err) return console.log(err)
            console.log(result)
            res.send(result)
        })
})
module.exports = router;