// app/api/auth/register/route.js
import dbConnect from '../../../../lib/dbConnect';
import Usuario from '../../../../models/Usuario';
import { NextResponse } from 'next/server';

export async function POST(req) {
  await dbConnect();
  
  try {
    const { nombre, email, password, rol } = await req.json();
    
    // Validaciones
    if (!nombre || !email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Todos los campos son requeridos' 
      }, { status: 400 });
    }
    
    if (password.length < 6) {
      return NextResponse.json({ 
        success: false, 
        error: 'La contraseña debe tener al menos 6 caracteres' 
      }, { status: 400 });
    }
    
    // Verificar si el email ya existe
    const usuarioExistente = await Usuario.findOne({ email });
    
    if (usuarioExistente) {
      return NextResponse.json({ 
        success: false, 
        error: 'El email ya está registrado' 
      }, { status: 400 });
    }
    
    // Crear usuario
    const usuario = await Usuario.create({
      nombre,
      email,
      password,
      rol: rol || 'Empleado',
    });
    
    return NextResponse.json({ 
      success: true,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Error en el servidor' 
    }, { status: 500 });
  }
}