// models/Mesa.js
import mongoose from 'mongoose';

const ConsumoSchema = new mongoose.Schema({
  productoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producto',
    required: true,
  },
  nombreProducto: String, // Guardamos el nombre por si el producto se elimina después
  cantidad: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  precioUnitario: {
    type: Number,
    required: true,
  },
  subtotal: {
    type: Number,
    required: true,
  },
  fechaRegistro: {
    type: Date,
    default: Date.now,
  },
});

const MesaSchema = new mongoose.Schema({
  numeroMesa: {
    type: Number,
    required: [true, 'El número de mesa es obligatorio'],
    unique: true,
  },
  estado: {
    type: String,
    required: true,
    enum: ['Disponible', 'Ocupada', 'Mantenimiento'],
    default: 'Disponible',
  },
  tarifaPorHora: {
    type: Number,
    required: [true, 'La tarifa por hora es obligatoria'],
  },
  horaInicio: {
    type: Date,
    default: null,
  },
  consumos: [ConsumoSchema], // Array de consumos (RF03)
});

// Previene errores de redefinición de modelos en Next.js
export default mongoose.models.Mesa || mongoose.model('Mesa', MesaSchema);