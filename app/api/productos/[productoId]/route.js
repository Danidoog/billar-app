// app/api/productos/[productoId]/route.js
import dbConnect from '../../../../lib/dbConnect';
import Producto from '../../../../models/Producto';
import { NextResponse } from 'next/server';

// PATCH: Actualizar un producto
export async function PATCH(req, context) {
  await dbConnect();
  
  const params = await context.params;
  const id = params?.productoId;
  
  if (!id) {
    return NextResponse.json({ success: false, error: 'ID no proporcionado' }, { status: 400 });
  }
  
  try {
    const body = await req.json();
    const producto = await Producto.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    
    if (!producto) {
      return NextResponse.json({ success: false, error: 'Producto no encontrado' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: producto }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

// DELETE: Eliminar (desactivar) un producto
export async function DELETE(req, context) {
  await dbConnect();
  
  const params = await context.params;
  const id = params?.productoId;
  
  if (!id) {
    return NextResponse.json({ success: false, error: 'ID no proporcionado' }, { status: 400 });
  }
  
  try {
    // En lugar de eliminar, lo desactivamos
    const producto = await Producto.findByIdAndUpdate(
      id, 
      { activo: false },
      { new: true }
    );
    
    if (!producto) {
      return NextResponse.json({ success: false, error: 'Producto no encontrado' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: producto }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}