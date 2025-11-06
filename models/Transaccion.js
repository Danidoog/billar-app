// models/Transaccion.js
import mongoose from 'mongoose';

const TransaccionSchema = new mongoose.Schema({
  numeroMesa: {
    type: Number,
    required: true,
  },
  mesaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mesa',
    required: true,
  },
  // Información de tiempo
  horaInicio: {
    type: Date,
    required: true,
  },
  horaFin: {
    type: Date,
    required: true,
  },
  minutosJugados: {
    type: Number,
    required: true,
  },
  // Información de costos
  tarifaPorHora: {
    type: Number,
    required: true,
  },
  costoTiempo: {
    type: Number,
    required: true,
  },
  // Consumos
  consumos: [{
    productoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Producto',
    },
    nombreProducto: String,
    cantidad: Number,
    precioUnitario: Number,
    subtotal: Number,
  }],
  totalConsumos: {
    type: Number,
    default: 0,
  },
  // Total de la transacción
  totalAPagar: {
    type: Number,
    required: true,
  },
  // Información adicional
  metodoPago: {
    type: String,
    enum: ['Efectivo', 'Tarjeta', 'Transferencia', 'Otro'],
    default: 'Efectivo',
  },
  notas: {
    type: String,
    default: '',
  },
  // Usuario que cerró (para futuro sistema de auth)
  usuarioCierre: {
    type: String,
    default: 'Sistema',
  },
}, {
  timestamps: true, // Crea automáticamente createdAt y updatedAt
});

// Índices para búsquedas rápidas
TransaccionSchema.index({ numeroMesa: 1 });
TransaccionSchema.index({ createdAt: -1 });
TransaccionSchema.index({ totalAPagar: 1 });

export default mongoose.models.Transaccion || mongoose.model('Transaccion', TransaccionSchema);