const Solicitud = require('../models/Solicitud')
const mongoose = require("mongoose");
const Usuario = mongoose.model('Usuario')
const Solicitud = mongoose.model('Solicitud')
const Mascota = mongoose.model('Mascota')
mongoose.set('useFindAndModify', false);

function crearSolicitud(req, res, next) { // POST v1/solicitudes?mascota_id=021abo59c96b90a02344...
  // Buscamos la mascota a solicitar
  Mascota.findById(req.query.mascota_id, async (err, mascota) => {
    if (!mascota || err) {
      return res.sendStatus(404)
    }
    if (mascota.estado==='adoptado') {
      return res.sendStatus('La mascota ya ha sido adoptada')
    }
    // si está dispobible o pendiente podemos crear la solicitud
    const solicitud = new Solicitud()
    solicitud.mascota = req.query.mascota_id
    solicitud.anunciante = mascota.anunciante
    solicitud.solicitante = req.usuario.id
    solicitud.estado = 'pendiente'
    solicitud.save().then(async s => {
      // antes de devolver respuesta actualizamos el tipo de usuario a anunciante
      await Usuario.findOneAndUpdate({_id: req.usuario.id}, {tipo: 'anunciante'})
      res.status(201).send(s)
    }).catch(next)
  }).catch(next)
}

function obtenerSolicitud(req, res, next) {
  if (!req.params.id) {
    // sin :id, solo enlistaremos las solicitudes dónde el usuario es anunciante o solicitante
    Solicitud.find({ $or: [{ solicitante: req.usuario.id }, { anunciante: req.usuario.id }] }).then(solicitudes => {
      res.send(solicitudes)
    }).catch(next)
  } else {
    // Al obtener una solicitud individual con el :id poblaremos los campos necesarios
    Solicitud.findOne({ _id: req.params.id, $or: [{ solicitante: req.usuario.id }, { anunciante: req.usuario.id }] })
      .then(async (solicitud) => {
        // añadimos información sobre la mascota
        await solicitud.populate('mascota').execPopulate()
        if (solicitud.estado === 'aceptada') {
          // Si la solicitud ha sido aceptada, se mostrará la información de contacto
          await solicitud.populate('anunciante', 'username nombre apellido bio foto telefono email').execPopulate()
          await solicitud.populate('solicitante', 'username nombre apellido bio foto telefono email').execPopulate()
          res.send(solicitud)
        } else {
          res.send(solicitud)
        }
      }).catch(next)
  }
}

function modificarSolicitud(req, res) {
  // simulando un usuario previamente existente que el usuario utili
  var solicitud1 = new Solicitud(req.params.id, 'Juan', 'Vega', 'juan@vega.com')
  var modificaciones = req.body
  solicitud1 = { ...solicitud1, ...modificaciones }
  res.send(solicitud1)
}

function eliminarSolicitud(req, res) {
  res.status(200).send(`Solicitud ${req.params.id} eliminado`);
}

module.exports = {
  crearSolicitud,
  obtenerSolicitudes,
  modificarSolicitud,
  eliminarSolicitud
}