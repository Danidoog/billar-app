// models/Producto.js
import mongoose from 'mongoose';

const ProductoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del producto es obligatorio'],
    trim: true,
  },
  categoria: {
    type: String,
    required: [true, 'La categoría es obligatoria'],
    enum: ['Bebidas', 'Cervezas', 'Snacks', 'Comidas', 'Otros'],
    default: 'Otros',
  },
  precio: {
    type: Number,
    required: [true, 'El precio es obligatorio'],
    min: [0, 'El precio no puede ser negativo'],
  },
  stock: {
    type: Number,
    required: [true, 'El stock es obligatorio'],
    min: [0, 'El stock no puede ser negativo'],
    default: 0,
  },
  imagen: {
    type: String, // URL o emoji para representar el producto
    default: '📦',
  },
  activo: {
    type: Boolean,
    default: true, // Para "ocultar" productos sin eliminarlos
  },
}, {
  timestamps: true, // Añade createdAt y updatedAt automáticamente
});

// Previene errores de redefinición de modelos en Next.js
export default mongoose.models.Producto || mongoose.model('Producto', ProductoSchema);