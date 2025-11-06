// app/api/auth/login/route.js
import dbConnect from '../../../../lib/dbConnect';
import Usuario from '../../../../models/Usuario';
import { generarToken } from '../../../../lib/jwt';
import { NextResponse } from 'next/server';

export async function POST(req) {
  await dbConnect();
  
  try {
    const { email, password } = await req.json();
    
    // Validaciones básicas
    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email y contraseña son requeridos' 
      }, { status: 400 });
    }
    
    // Buscar usuario (incluimos password con select)
    const usuario = await Usuario.findOne({ email }).select('+password');
    
    if (!usuario) {
      return NextResponse.json({ 
        success: false, 
        error: 'Credenciales inválidas' 
      }, { status: 401 });
    }
    
    // Verificar si está activo
    if (!usuario.activo) {
      return NextResponse.json({ 
        success: false, 
        error: 'Usuario desactivado. Contacta al administrador.' 
      }, { status: 403 });
    }
    
    // Verificar contraseña
    const passwordValido = await usuario.compararPassword(password);
    
    if (!passwordValido) {
      return NextResponse.json({ 
        success: false, 
        error: 'Credenciales inválidas' 
      }, { status: 401 });
    }
    
    // Actualizar último acceso
    usuario.ultimoAcceso = new Date();
    await usuario.save();
    
    // Generar token
    const token = generarToken(usuario);
    
    // Respuesta exitosa (sin enviar la contraseña)
    return NextResponse.json({ 
      success: true,
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error en el servidor' 
    }, { status: 500 });
  }
}