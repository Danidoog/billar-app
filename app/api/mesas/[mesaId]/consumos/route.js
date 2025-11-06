// app/api/mesas/[mesaId]/consumos/route.js
import dbConnect from '../../../../../lib/dbConnect';
import Mesa from '../../../../../models/Mesa';
import Producto from '../../../../../models/Producto';
import { NextResponse } from 'next/server';

// POST: Añadir consumo a una mesa
export async function POST(req, context) {
  await dbConnect();
  
  const params = await context.params;
  const mesaId = params?.mesaId;
  
  if (!mesaId) {
    return NextResponse.json({ success: false, error: 'ID de mesa no proporcionado' }, { status: 400 });
  }
  
  try {
    const body = await req.json();
    const { productoId, cantidad = 1 } = body;
    
    if (!productoId) {
      return NextResponse.json({ success: false, error: 'ID de producto no proporcionado' }, { status: 400 });
    }
    
    // Verificar que la mesa existe y está ocupada
    const mesa = await Mesa.findById(mesaId);
    if (!mesa) {
      return NextResponse.json({ success: false, error: 'Mesa no encontrada' }, { status: 404 });
    }
    
    if (mesa.estado !== 'Ocupada') {
      return NextResponse.json({ success: false, error: 'La mesa debe estar ocupada para añadir consumos' }, { status: 400 });
    }
    
    // Verificar que el producto existe y tiene stock
    const producto = await Producto.findById(productoId);
    if (!producto) {
      return NextResponse.json({ success: false, error: 'Producto no encontrado' }, { status: 404 });
    }
    
    if (!producto.activo) {
      return NextResponse.json({ success: false, error: 'Producto no disponible' }, { status: 400 });
    }
    
    if (producto.stock < cantidad) {
      return NextResponse.json({ success: false, error: `Stock insuficiente. Disponible: ${producto.stock}` }, { status: 400 });
    }
    
    // Crear el consumo
    const consumo = {
      productoId: producto._id,
      nombreProducto: producto.nombre,
      cantidad: cantidad,
      precioUnitario: producto.precio,
      subtotal: producto.precio * cantidad,
      fechaRegistro: new Date(),
    };
    
    // Añadir consumo a la mesa
    mesa.consumos.push(consumo);
    await mesa.save();
    
    // Reducir stock del producto
    producto.stock -= cantidad;
    await producto.save();
    
    return NextResponse.json({ 
      success: true, 
      data: mesa,
      mensaje: `${cantidad}x ${producto.nombre} añadido a la mesa #${mesa.numeroMesa}`
    }, { status: 200 });
    
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

// GET: Obtener consumos de una mesa
export async function GET(req, context) {
  await dbConnect();
  
  const params = await context.params;
  const mesaId = params?.mesaId;
  
  if (!mesaId) {
    return NextResponse.json({ success: false, error: 'ID de mesa no proporcionado' }, { status: 400 });
  }
  
  try {
    const mesa = await Mesa.findById(mesaId);
    if (!mesa) {
      return NextResponse.json({ success: false, error: 'Mesa no encontrada' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: mesa.consumos }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}