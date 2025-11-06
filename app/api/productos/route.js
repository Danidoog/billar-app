// app/api/productos/route.js
import dbConnect from '../../../lib/dbConnect';
import Producto from '../../../models/Producto';
import { NextResponse } from 'next/server';

// GET: Obtener todos los productos
export async function GET(req) {
  await dbConnect();
  
  try {
    const { searchParams } = new URL(req.url);
    const soloActivos = searchParams.get('activos') === 'true';
    
    const filtro = soloActivos ? { activo: true } : {};
    const productos = await Producto.find(filtro).sort({ categoria: 1, nombre: 1 });
    
    return NextResponse.json({ success: true, data: productos }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

// POST: Crear un nuevo producto
export async function POST(req) {
  await dbConnect();
  
  try {
    const body = await req.json();
    const producto = await Producto.create(body);
    
    return NextResponse.json({ success: true, data: producto }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}