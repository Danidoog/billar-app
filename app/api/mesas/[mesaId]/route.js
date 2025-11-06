// app/api/mesas/[mesaId]/route.js
import dbConnect from '../../../../lib/dbConnect';
import Mesa from '../../../../models/Mesa';
import Transaccion from '../../../../models/Transaccion';
import { NextResponse } from 'next/server'; 

// PATCH: Abrir o Cerrar Mesa
export async function PATCH(req, context) {
  await dbConnect();
  
  const params = await context.params;
  const id = params?.mesaId;

  if (!id) {
     return NextResponse.json({ success: false, error: 'ID de mesa no proporcionado en la URL.' }, { status: 400 });
  }
  
  try {
    const body = await req.json();
    const { action, metodoPago, notas } = body;
    
    const mesa = await Mesa.findById(id); 

    if (!mesa) {
      return NextResponse.json({ success: false, error: 'Mesa no encontrada con el ID proporcionado.' }, { status: 404 });
    }

    let updatedMesa;

    // --- RF01: Abrir Mesa ---
    if (action === 'abrir' && mesa.estado === 'Disponible') {
      updatedMesa = await Mesa.findByIdAndUpdate(
        id,
        { 
          estado: 'Ocupada', 
          horaInicio: new Date(), 
          consumos: [] // Limpiamos consumos al abrir
        },
        { new: true, runValidators: true }
      );
      
      return NextResponse.json({ 
        success: true, 
        data: updatedMesa 
      }, { status: 200 });
    } 
    
    // --- RF02 + RF03 + RF09: Cerrar Mesa, Calcular Factura y Guardar Historial ---
    else if (action === 'cerrar' && mesa.estado === 'Ocupada') {
      
      const horaFin = new Date();
      const horaInicio = new Date(mesa.horaInicio);
      
      const diffMs = horaFin.getTime() - horaInicio.getTime();
      const minutosJugados = Math.max(0, Math.ceil(diffMs / (1000 * 60))); 
      
      const costoTiempo = (mesa.tarifaPorHora / 60) * minutosJugados;
      
      // Calcular total de consumos
      const totalConsumos = mesa.consumos.reduce((sum, consumo) => sum + consumo.subtotal, 0);
      
      const totalAPagar = costoTiempo + totalConsumos;

      // ============ GUARDAR TRANSACCIÓN EN HISTORIAL ============
      try {
        const transaccion = await Transaccion.create({
          numeroMesa: mesa.numeroMesa,
          mesaId: mesa._id,
          horaInicio: horaInicio,
          horaFin: horaFin,
          minutosJugados: minutosJugados,
          tarifaPorHora: mesa.tarifaPorHora,
          costoTiempo: costoTiempo,
          consumos: mesa.consumos.map(c => ({
            productoId: c.productoId,
            nombreProducto: c.nombreProducto,
            cantidad: c.cantidad,
            precioUnitario: c.precioUnitario,
            subtotal: c.subtotal,
          })),
          totalConsumos: totalConsumos,
          totalAPagar: totalAPagar,
          metodoPago: metodoPago || 'Efectivo',
          notas: notas || '',
          usuarioCierre: 'Sistema', // Aquí irá el usuario cuando implementes auth
        });
        
        console.log('✅ Transacción guardada:', transaccion._id);
      } catch (errorTransaccion) {
        console.error('❌ Error al guardar transacción:', errorTransaccion);
        // No bloqueamos el cierre de mesa si falla el historial
      }
      // =========================================================

      // Cerrar la mesa
      updatedMesa = await Mesa.findByIdAndUpdate(
        id,
        { 
          estado: 'Disponible', 
          horaInicio: null,
          consumos: [] // Limpiamos consumos al cerrar
        },
        { new: true, runValidators: true }
      );

      return NextResponse.json({ 
        success: true, 
        data: updatedMesa,
        factura: {
            minutosJugados,
            costoTiempo,
            consumos: mesa.consumos,
            totalConsumos,
            totalAPagar
        }
      }, { status: 200 });

    } else {
      return NextResponse.json({ 
        success: false, 
        error: `Acción no válida. Estado actual: ${mesa.estado}, Acción: ${action}` 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error en PATCH:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error al procesar la solicitud: ' + error.message 
    }, { status: 400 });
  }
}