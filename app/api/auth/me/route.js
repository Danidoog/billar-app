// app/api/auth/me/route.js
import dbConnect from '../../../../lib/dbConnect';
import Usuario from '../../../../models/Usuario';
import { verificarToken } from '../../../../lib/jwt';
import { NextResponse } from 'next/server';

export async function GET(req) {
  await dbConnect();
  
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Token no proporcionado' 
      }, { status: 401 });
    }
    
    const token = authHeader.substring(7); // Remover "Bearer "
    
    // Verificar token
    const decoded = verificarToken(token);
    
    if (!decoded) {
      return NextResponse.json({ 
        success: false, 
        error: 'Token inválido o expirado' 
      }, { status: 401 });
    }
    
    // Buscar usuario
    const usuario = await Usuario.findById(decoded.id);
    
    if (!usuario || !usuario.activo) {
      return NextResponse.json({ 
        success: false, 
        error: 'Usuario no encontrado o inactivo' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error en verificación:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error en el servidor' 
    }, { status: 500 });
  }
}