// app/api/transacciones/estadisticas/route.js
import dbConnect from '../../../../lib/dbConnect';
import Transaccion from '../../../../models/Transaccion';
import { NextResponse } from 'next/server';

// GET: Estadísticas del día/semana/mes
export async function GET(req) {
  await dbConnect();
  
  try {
    const { searchParams } = new URL(req.url);
    const periodo = searchParams.get('periodo') || 'dia'; // dia, semana, mes
    
    const ahora = new Date();
    let fechaInicio = new Date();
    
    switch(periodo) {
      case 'dia':
        fechaInicio.setHours(0, 0, 0, 0);
        break;
      case 'semana':
        fechaInicio.setDate(ahora.getDate() - 7);
        break;
      case 'mes':
        fechaInicio.setMonth(ahora.getMonth() - 1);
        break;
    }
    
    // Estadísticas generales
    const estadisticas = await Transaccion.aggregate([
      {
        $match: {
          createdAt: { $gte: fechaInicio }
        }
      },
      {
        $group: {
          _id: null,
          totalVentas: { $sum: '$totalAPagar' },
          totalTransacciones: { $sum: 1 },
          promedioVenta: { $avg: '$totalAPagar' },
          totalTiempo: { $sum: '$costoTiempo' },
          totalConsumos: { $sum: '$totalConsumos' },
          ventaMaxima: { $max: '$totalAPagar' },
          ventaMinima: { $min: '$totalAPagar' },
        }
      }
    ]);
    
    // Productos más vendidos
    const productosMasVendidos = await Transaccion.aggregate([
      {
        $match: {
          createdAt: { $gte: fechaInicio }
        }
      },
      { $unwind: '$consumos' },
      {
        $group: {
          _id: '$consumos.nombreProducto',
          cantidadVendida: { $sum: '$consumos.cantidad' },
          totalVentas: { $sum: '$consumos.subtotal' },
        }
      },
      { $sort: { cantidadVendida: -1 } },
      { $limit: 10 }
    ]);
    
    // Mesas más rentables
    const mesasRentables = await Transaccion.aggregate([
      {
        $match: {
          createdAt: { $gte: fechaInicio }
        }
      },
      {
        $group: {
          _id: '$numeroMesa',
          totalVentas: { $sum: '$totalAPagar' },
          numeroTransacciones: { $sum: 1 },
        }
      },
      { $sort: { totalVentas: -1 } },
      { $limit: 10 }
    ]);
    
    // Ventas por hora (para identificar horarios pico)
    const ventasPorHora = await Transaccion.aggregate([
      {
        $match: {
          createdAt: { $gte: fechaInicio }
        }
      },
      {
        $group: {
          _id: { $hour: '$horaFin' },
          totalVentas: { $sum: '$totalAPagar' },
          transacciones: { $sum: 1 },
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Métodos de pago
    const metodosPago = await Transaccion.aggregate([
      {
        $match: {
          createdAt: { $gte: fechaInicio }
        }
      },
      {
        $group: {
          _id: '$metodoPago',
          total: { $sum: '$totalAPagar' },
          cantidad: { $sum: 1 },
        }
      }
    ]);
    
    return NextResponse.json({ 
      success: true,
      periodo,
      fechaInicio,
      estadisticas: estadisticas[0] || {
        totalVentas: 0,
        totalTransacciones: 0,
        promedioVenta: 0,
        totalTiempo: 0,
        totalConsumos: 0,
        ventaMaxima: 0,
        ventaMinima: 0,
      },
      productosMasVendidos,
      mesasRentables,
      ventasPorHora,
      metodosPago,
    }, { status: 200 });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 400 });
  }
}