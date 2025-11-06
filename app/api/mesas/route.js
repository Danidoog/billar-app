// Este es el nuevo 'pages/api/mesas/index.js'
import dbConnect from '../../../lib/dbConnect';
import Mesa from '../../../models/Mesa';
import { NextResponse } from 'next/server'; // Importar para manejar respuestas

await dbConnect();

// GET: OBTENER TODAS LAS MESAS para el dashboard
export async function GET() {
  try {
    const mesas = await Mesa.find({}).sort({ numeroMesa: 1 });
    return NextResponse.json({ success: true, data: mesas });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

// POST: CREAR UNA NUEVA MESA (Función de Admin/Setup)
export async function POST(req) {
  try {
    const body = await req.json(); // Leer el cuerpo de la solicitud
    const mesa = await Mesa.create(body);
    return NextResponse.json({ success: true, data: mesa }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

// Opcional: Manejo de otros métodos
export async function PATCH() {
    return NextResponse.json({ error: 'Method Not Allowed. Use /api/mesas/[id] para PATCH.' }, { status: 405 });
}