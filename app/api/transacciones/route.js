// app/api/transacciones/route.js
import dbConnect from '../../../lib/dbConnect';
import Transaccion from '../../../models/Transaccion';
import { NextResponse } from 'next/server';

// GET: Obtener historial de transacciones con filtros
export async function GET(req) {
  await dbConnect();
  
  try {
    const { searchParams } = new URL(req.url);
    
    // Filtros opcionales
    const numeroMesa = searchParams.get('numeroMesa');
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');
    const limite = parseInt(searchParams.get('limite') || '50');
    const pagina = parseInt(searchParams.get('pagina') || '1');
    
    // Construir filtro
    const filtro = {};
    
    if (numeroMesa) {
      filtro.numeroMesa = parseInt(numeroMesa);
    }
    
    if (fechaInicio || fechaFin) {
      filtro.createdAt = {};
      if (fechaInicio) {
        filtro.createdAt.$gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        const fechaFinDate = new Date(fechaFin);
        fechaFinDate.setHours(23, 59, 59, 999); // Incluir todo el día
        filtro.createdAt.$lte = fechaFinDate;
      }
    }
    
    // Calcular skip para paginación
    const skip = (pagina - 1) * limite;
    
    // Consultar transacciones
    const transacciones = await Transaccion.find(filtro)
      .sort({ createdAt: -1 }) // Más recientes primero
      .skip(skip)
      .limit(limite);
    
    // Contar total de documentos para paginación
    const total = await Transaccion.countDocuments(filtro);
    
    // Calcular estadísticas
    const estadisticas = await Transaccion.aggregate([
      { $match: filtro },
      {
        $group: {
          _id: null,
          totalVentas: { $sum: '$totalAPagar' },
          totalTransacciones: { $sum: 1 },
          promedioVenta: { $avg: '$totalAPagar' },
          totalTiempo: { $sum: '$costoTiempo' },
          totalConsumos: { $sum: '$totalConsumos' },
        }
      }
    ]);
    
    return NextResponse.json({ 
      success: true, 
      data: transacciones,
      paginacion: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
      },
      estadisticas: estadisticas[0] || {
        totalVentas: 0,
        totalTransacciones: 0,
        promedioVenta: 0,
        totalTiempo: 0,
        totalConsumos: 0,
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error al obtener transacciones:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 400 });
  }
}