"use client";

import { useState, useEffect } from 'react';

// =========================================================
// INTERFACES DE TIPADO
// =========================================================

interface Consumo {
  _id?: string;
  productoId: string;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface Mesa {
  _id: string;
  numeroMesa: number;
  tarifaPorHora: number;
  estado: 'Disponible' | 'Ocupada'; 
  horaInicio: Date | null;
  consumos: Consumo[];
}

interface Producto {
  _id: string;
  nombre: string;
  categoria: 'Bebidas' | 'Cervezas' | 'Snacks' | 'Comidas' | 'Otros';
  precio: number;
  stock: number;
  imagen: string;
  activo: boolean;
}

interface Transaccion {
  _id: string;
  numeroMesa: number;
  horaInicio: Date;
  horaFin: Date;
  minutosJugados: number;
  tarifaPorHora: number;
  costoTiempo: number;
  consumos: Consumo[];
  totalConsumos: number;
  totalAPagar: number;
  metodoPago: string; // <-- CORRECCIÓN #1 (Ver explicación)
  notas: string;
  createdAt: Date;
}

interface Estadisticas {
  totalVentas: number;
  totalTransacciones: number;
  promedioVenta: number; // <-- CORRECCIÓN #1 (Ver explicación)
  totalTiempo: number;
  totalConsumos: number;
}

// =========================================================
// UTILIDADES
// =========================================================

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
};

const calcularTiempoTranscurrido = (horaInicio: Date) => {
  const ahora = new Date();
  const diffMs = ahora.getTime() - new Date(horaInicio).getTime();
  const minutos = Math.floor(diffMs / (1000 * 60));
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  return { horas, minutos: mins, totalMinutos: minutos };
};

const categoriasEmojis: {[key: string]: string} = {
  'Bebidas': '🥤',
  'Cervezas': '🍺',
  'Snacks': '🍿',
  'Comidas': '🍔',
  'Otros': '📦',
};

const categorias = ['Todas', 'Bebidas', 'Cervezas', 'Snacks', 'Comidas', 'Otros'];

export default function Home() {
  // Estados generales
  const [vistaActual, setVistaActual] = useState<'mesas' | 'inventario' | 'historial'>('mesas');
  
  // Estados de Mesas
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormularioMesa, setMostrarFormularioMesa] = useState(false);
  const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);
  const [mostrarConsumos, setMostrarConsumos] = useState(false);
  const [tiemposActuales, setTiemposActuales] = useState<{[key: string]: {horas: number, minutos: number, totalMinutos: number}}>({});

  // Estados de Productos
  const [productos, setProductos] = useState<Producto[]>([]);
  const [mostrarFormularioProducto, setMostrarFormularioProducto] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltroModal, setCategoriaFiltroModal] = useState('Todas');
  const [cantidades, setCantidades] = useState<{[key: string]: number}>({});
  const [emojiSeleccionado, setEmojiSeleccionado] = useState('📦');
  const [mostrarSelectorEmoji, setMostrarSelectorEmoji] = useState(false);

  // Estados de Historial
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');
  const [filtroMesa, setFiltroMesa] = useState('');
  const [transaccionExpandida, setTransaccionExpandida] = useState<string | null>(null);

  // =========================================================
  // EFECTOS Y FETCHING
  // =========================================================

  // Actualizar tiempos cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      const nuevosTiempos: {[key: string]: {horas: number, minutos: number, totalMinutos: number}} = {};
      mesas.forEach(mesa => {
        if (mesa.estado === 'Ocupada' && mesa.horaInicio) {
          nuevosTiempos[mesa._id] = calcularTiempoTranscurrido(mesa.horaInicio);
        }
      });
      setTiemposActuales(nuevosTiempos);
    }, 1000);
    return () => clearInterval(interval);
  }, [mesas]);

  // Fetchers de datos
  const fetchMesas = async () => {
    try {
      const res = await fetch('/api/mesas');
      const { data } = await res.json();
      setMesas(data);
    } catch (error) {
      console.error('Error al cargar mesas:', error);
    }
  };

  const fetchProductos = async () => {
    try {
      const res = await fetch('/api/productos');
      const { data } = await res.json();
      setProductos(data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  const fetchTransacciones = async () => {
    try {
      let url = '/api/transacciones?limite=100';
      
      if (filtroFechaInicio) {
        url += `&fechaInicio=${filtroFechaInicio}`;
      }
      // CORRECCIÓN #2: Se añade T23:59:59 para incluir el día completo en el filtro
      if (filtroFechaFin) {
        url += `&fechaFin=${filtroFechaFin}T23:59:59`;
      }
      if (filtroMesa) {
        url += `&numeroMesa=${filtroMesa}`;
      }
      
      const res = await fetch(url);
      const { data, estadisticas: stats } = await res.json();
      setTransacciones(data);
      setEstadisticas(stats);
    } catch (error) {
      console.error('Error al cargar transacciones:', error);
    }
  };

  // Carga inicial de datos
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchMesas(), fetchProductos()]);
      setLoading(false);
    };
    loadData();
    // Intervalo de actualización en segundo plano
    const interval = setInterval(() => {
      fetchMesas();
      fetchProductos();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Carga de historial al cambiar de pestaña
  useEffect(() => {
    if (vistaActual === 'historial') {
      fetchTransacciones();
    }
  }, [vistaActual]); // Se ejecuta cuando 'vistaActual' cambia

  // CORRECCIÓN #3: Efecto para mantener sincronizado el modal de consumos
  // Si la mesa seleccionada cambia (porque se actualizó 'mesas'), actualiza el modal.
  useEffect(() => {
    if (mesaSeleccionada) {
      const mesaActualizada = mesas.find(m => m._id === mesaSeleccionada._id);
      if (mesaActualizada) {
        setMesaSeleccionada(mesaActualizada);
      } else {
        // Si la mesa ya no existe (ej. se eliminó), cierra el modal
        cerrarModalConsumos();
      }
    }
  }, [mesas, mesaSeleccionada?._id]); // Depende de 'mesas' y del ID seleccionado


  // =========================================================
  // FUNCIONES DE MESAS (RF01, RF02)
  // =========================================================
  const handleAccionMesa = async (id: string, action: 'abrir' | 'cerrar') => {
    if (action === 'cerrar') {
      const mesa = mesas.find(m => m._id === id);
      if (!mesa) return;
      
      const tiempo = tiemposActuales[id];
      const costoTiempo = tiempo ? (mesa.tarifaPorHora / 60) * tiempo.totalMinutos : 0;
      const totalConsumos = mesa.consumos.reduce((sum, c) => sum + c.subtotal, 0);
      const total = costoTiempo + totalConsumos;
      
      const confirmacion = confirm(
        `🎱 RESUMEN DE LA CUENTA (Mesa #${mesa.numeroMesa})\n\n` +
        `⏱ Tiempo: ${tiempo?.horas || 0}h ${tiempo?.minutos || 0}m\n` +
        `💵 Costo tiempo: ${formatCurrency(costoTiempo)}\n` +
        `🍔 Consumos: ${formatCurrency(totalConsumos)}\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `💰 TOTAL: ${formatCurrency(total)}\n\n` +
        `¿Cerrar mesa y cobrar?`
      );
      
      if (!confirmacion) return;
    }
    
    try {
      const res = await fetch(`/api/mesas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const result = await res.json();

      if (result.success) {
        if (action === 'cerrar') {
          const { factura } = result;
          alert(
            `✅ ¡Mesa Cerrada!\n\n` +
            `⏱ Tiempo jugado: ${factura.minutosJugados} minutos\n` +
            `💵 Costo del tiempo: ${formatCurrency(factura.costoTiempo)}\n` +
            `🍔 Total consumos: ${formatCurrency(factura.totalConsumos)}\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `💰 TOTAL PAGADO: ${formatCurrency(factura.totalAPagar)}`
          );
          // Si la vista actual es 'historial', refrescamos
          if (vistaActual === 'historial') {
            fetchTransacciones();
          }
        }
        fetchMesas();
      } else {
        alert(`❌ Error: ${result.error || 'Operación fallida.'}`);
      }
    } catch (error) {
      alert(`Error de conexión al ${action} la mesa.`);
    }
  };

  const handleCrearMesa = async (e: any) => {
    e.preventDefault();
    const numero = parseInt(e.target.numeroMesa.value);
    const tarifa = parseInt(e.target.tarifaPorHora.value);

    if (isNaN(numero) || isNaN(tarifa)) return alert('Ingresa números válidos.');

    await fetch('/api/mesas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numeroMesa: numero, tarifaPorHora: tarifa }),
    });
    fetchMesas();
    e.target.reset();
    setMostrarFormularioMesa(false);
  };

  // =========================================================
  // FUNCIONES DE CONSUMOS (RF03 - Agregar Producto)
  // =========================================================
  const handleAgregarConsumo = async (productoId: string, cantidad: number = 1) => {
    if (!mesaSeleccionada) return;

    try {
      const res = await fetch(`/api/mesas/${mesaSeleccionada._id}/consumos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productoId, cantidad }),
      });

      const result = await res.json();

      if (result.success) {
        // Quitamos el alert para una experiencia más fluida
        // alert(`✅ ${result.mensaje}`); 
        
        // Refrescamos los datos en segundo plano
        await fetchMesas();
        await fetchProductos();
        
        // CORRECCIÓN #3: Se elimina la actualización de estado local (stale state)
        // El useEffect [mesas, ...] se encargará de actualizar el modal.
        
        // Resetear la cantidad del producto a 1
        setCantidades(prev => ({...prev, [productoId]: 1}));
      } else {
        alert(`❌ ${result.error}`);
      }
    } catch (error) {
      alert('Error al agregar consumo');
    }
  };

  // Funciones de utilidad para el modal de consumos
  const getCantidad = (productoId: string) => {
    return cantidades[productoId] || 1;
  };

  const setCantidad = (productoId: string, nuevaCantidad: number) => {
    setCantidades(prev => ({...prev, [productoId]: nuevaCantidad}));
  };

  const abrirModalConsumos = (mesa: Mesa) => {
    setMesaSeleccionada(mesa);
    setMostrarConsumos(true);
  };

  const cerrarModalConsumos = () => {
    setMostrarConsumos(false);
    setMesaSeleccionada(null);
    setCategoriaFiltroModal('Todas');
    setCantidades({}); // Resetear todas las cantidades al cerrar
  };

  // =========================================================
  // FUNCIONES DE PRODUCTOS (RF03 - CRUD)
  // =========================================================
  const handleSubmitProducto = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const productoData = {
      nombre: formData.get('nombre') as string,
      categoria: formData.get('categoria') as string,
      precio: parseInt(formData.get('precio') as string),
      stock: parseInt(formData.get('stock') as string),
      imagen: emojiSeleccionado,
      activo: true // Al crear/editar, se asume activo
    };

    if (isNaN(productoData.precio) || isNaN(productoData.stock)) {
      return alert('El precio y el stock deben ser números válidos.');
    }

    try {
      let success = false;
      
      if (productoEditando) {
        // Mantenemos el estado 'activo' si ya existía (ej. si estaba inactivo)
        const dataAEnviar = { ...productoData, activo: productoEditando.activo };
        const res = await fetch(`/api/productos/${productoEditando._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataAEnviar),
        });
        const result = await res.json();
        success = result.success;
        if (success) {
          alert('✅ Producto actualizado exitosamente');
        } else {
          alert('❌ Error: ' + (result.error || 'No se pudo actualizar el producto'));
        }
      } else {
        const res = await fetch('/api/productos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productoData),
        });
        const result = await res.json();
        success = result.success;
        if (success) {
          alert('✅ Producto creado exitosamente');
        } else {
          alert('❌ Error: ' + (result.error || 'No se pudo crear el producto'));
        }
      }
      
      if (success) {
        await fetchProductos();
        setMostrarFormularioProducto(false);
        setProductoEditando(null);
        setEmojiSeleccionado('📦');
      }
    } catch (error) {
      console.error('Error al guardar producto:', error);
      alert('❌ Error de conexión al guardar el producto');
    }
  };

  const handleEditarProducto = (producto: Producto) => {
    setProductoEditando(producto);
    setEmojiSeleccionado(producto.imagen || '📦');
    setMostrarFormularioProducto(true);
  };

  // CORRECCIÓN #4: Cambiado de DELETE a PATCH (Soft Delete)
  const handleEliminarProducto = async (id: string) => {
    if (!confirm('¿Estás seguro de DESACTIVAR este producto?')) return;
    
    try {
      // Se cambia el método a PATCH y se envía activo: false
      const res = await fetch(`/api/productos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: false }),
      });
      const result = await res.json();
      if (result.success) {
        alert('✅ Producto desactivado');
        fetchProductos();
      } else {
        alert('❌ Error al desactivar el producto: ' + result.error);
      }
    } catch (error) {
      alert('❌ Error de conexión al desactivar el producto');
    }
  };

  const handleActivarProducto = async (id: string) => {
    try {
      const res = await fetch(`/api/productos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: true }),
      });
      const result = await res.json();
      if (result.success) {
        alert('✅ Producto activado');
        fetchProductos();
      }
    } catch (error) {
      alert('❌ Error al activar el producto');
    }
  };

  const handleCancelarProducto = () => {
    setMostrarFormularioProducto(false);
    setProductoEditando(null);
    setEmojiSeleccionado('📦');
  };

  // Lista de emojis disponibles por categoría
  const emojisDisponibles = {
    'Bebidas': ['🥤', '🧃', '🧋', '🍹', '🍸', '🥛', '☕', '🍵', '🧉', '🍶'],
    'Cervezas': ['🍺', '🍻', '🍾', '🥂', '🍷'],
    'Snacks': ['🍿', '🥨', '🌭', '🍕', '🍔', '🥪', '🌮', '🌯', '🥙', '🍟', '🥓', '🍖'],
    'Comidas': ['🍔', '🍕', '🌭', '🍗', '🥩', '🍤', '🍱', '🍜', '🍝', '🥘', '🥗', '🍲'],
    'Otros': ['📦', '🎁', '🛍️', '🎀', '🎈', '🎉', '🎊', '🧊', '🔥', '⭐']
  };

  // =========================================================
  // FILTROS Y ESTADÍSTICAS (Lógica)
  // =========================================================
  const productosFiltrados = productos.filter(p => {
    const cumpleFiltro = filtroCategoria === 'Todas' || p.categoria === filtroCategoria;
    const cumpleBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return cumpleFiltro && cumpleBusqueda;
  });

  const productosActivosParaModal = productos.filter(p => p.activo);
  const productosModalFiltrados = productosActivosParaModal.filter(p => 
    categoriaFiltroModal === 'Todas' || p.categoria === categoriaFiltroModal
  );

  // Estadísticas
  const mesasDisponibles = mesas.filter(m => m.estado === 'Disponible').length;
  const mesasOcupadas = mesas.filter(m => m.estado === 'Ocupada').length;
  const productosActivos = productos.filter(p => p.activo).length;
  const productosInactivos = productos.filter(p => !p.activo).length;
  const valorTotalInventario = productos.reduce((sum, p) => sum + (p.precio * p.stock), 0);

  // =========================================================
  // RENDERIZADO (JSX)
  // =========================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-md border-b border-purple-500/20 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl">
                <span className="text-4xl">🎱</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">8-Billiards Club</h1>
                <p className="text-purple-300 text-sm">Sistema de Gestión Profesional</p>
              </div>
            </div>
            
            {/* Navegación por Tabs */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setVistaActual('mesas')}
                className={`font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 ${
                  vistaActual === 'mesas'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                }`}
              >
                🎱 Mesas
              </button>
              <button
                onClick={() => setVistaActual('inventario')}
                className={`font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 ${
                  vistaActual === 'inventario'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                    : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                }`}
              >
                📦 Inventario
              </button>
              <button
                onClick={() => setVistaActual('historial')}
                className={`font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 ${
                  vistaActual === 'historial'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                    : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                }`}
              >
                📊 Historial
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        
        {/* ==================== VISTA DE MESAS ==================== */}
        {vistaActual === 'mesas' && (
          <>
            {/* Estadísticas de Mesas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-md border border-green-500/30 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-300 text-sm font-medium">Disponibles</p>
                    <p className="text-4xl font-bold text-white mt-2">{mesasDisponibles}</p>
                  </div>
                  <div className="text-5xl">✅</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-md border border-red-500/30 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-300 text-sm font-medium">Ocupadas</p>
                    <p className="text-4xl font-bold text-white mt-2">{mesasOcupadas}</p>
                  </div>
                  <div className="text-5xl">🔴</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-md border border-purple-500/30 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-sm font-medium">Total Mesas</p>
                    <p className="text-4xl font-bold text-white mt-2">{mesas.length}</p>
                  </div>
                  <div className="text-5xl">🎯</div>
                </div>
              </div>
            </div>

            {/* Botón Crear Mesa */}
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Panel de Mesas</h2>
              <button
                onClick={() => setMostrarFormularioMesa(!mostrarFormularioMesa)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                ➕ Nueva Mesa
              </button>
            </div>

            {/* Formulario de Creación de Mesa */}
            {mostrarFormularioMesa && (
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border border-purple-500/30 rounded-2xl p-6 shadow-2xl mb-8">
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span>🛠️</span> Crear Nueva Mesa
                </h3>
                <form onSubmit={handleCrearMesa} className="flex flex-col md:flex-row gap-4">
                  <input 
                    name="numeroMesa" 
                    type="number" 
                    placeholder="Número de Mesa" 
                    required 
                    className="flex-1 p-4 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    min="1"
                  />
                  <input 
                    name="tarifaPorHora" 
                    type="number" 
                    placeholder="Tarifa por Hora (COP)" 
                    required 
                    className="flex-1 p-4 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    min="100"
                  />
                  <button 
                    type="submit" 
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    Crear Mesa
                  </button>
                </form>
              </div>
            )}

            {/* Grid de Mesas */}
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                <p className="text-purple-300 mt-4">Cargando mesas...</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {mesas.map((mesa) => {
                const tiempo = tiemposActuales[mesa._id];
                const costoActual = tiempo ? (mesa.tarifaPorHora / 60) * tiempo.totalMinutos : 0;
                const totalConsumos = mesa.consumos.reduce((sum, c) => sum + c.subtotal, 0);
                
                return (
                  <div 
                    key={mesa._id}
                    className={`relative overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-3xl ${
                      mesa.estado === 'Ocupada' 
                        ? 'bg-gradient-to-br from-red-600/30 to-red-800/30 border-2 border-red-500' 
                        : 'bg-gradient-to-br from-green-600/30 to-green-800/30 border-2 border-green-500'
                    }`}
                  >
                    <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${
                      mesa.estado === 'Ocupada' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-green-500 text-white'
                    }`}>
                      {mesa.estado === 'Ocupada' ? '🔴 OCUPADA' : '✅ LIBRE'}
                    </div>

                    <div className="p-6 backdrop-blur-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-white/10 p-3 rounded-xl">
                          <span className="text-3xl">🎱</span>
                        </div>
                        <div>
                          <h3 className="text-3xl font-extrabold text-white">Mesa #{mesa.numeroMesa}</h3>
                          <p className="text-sm text-gray-300">{formatCurrency(mesa.tarifaPorHora)}/hora</p>
                        </div>
                      </div>

                      {mesa.estado === 'Ocupada' && tiempo && (
                        <div className="bg-black/30 rounded-xl p-4 mb-4 border border-red-500/30">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-300">⏱️ Tiempo:</span>
                            <span className="text-xl font-bold text-white">
                              {tiempo.horas}h {tiempo.minutos}m
                            </span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-300">💵 Costo tiempo:</span>
                            <span className="text-lg font-bold text-yellow-400">
                              {formatCurrency(costoActual)}
                            </span>
                          </div>
                          {mesa.consumos.length > 0 && (
                            <div className="flex justify-between items-center mb-2 pt-2 border-t border-red-500/30">
                              <span className="text-sm text-gray-300">🍔 Consumos:</span>
                              <span className="text-lg font-bold text-green-400">
                                {formatCurrency(totalConsumos)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center pt-2 border-t border-red-500/30">
                            <span className="text-sm text-white font-bold">💰 TOTAL:</span>
                            <span className="text-xl font-bold text-white">
                              {formatCurrency(costoActual + totalConsumos)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">
                            Inicio: {new Date(mesa.horaInicio!).toLocaleTimeString('es-CO')}
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        {mesa.estado === 'Disponible' ? (
                          <button 
                            onClick={() => handleAccionMesa(mesa._id, 'abrir')}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                          >
                            ▶️ Abrir Mesa
                          </button>
                        ) : (
                          <>
                            <button 
                              onClick={() => abrirModalConsumos(mesa)}
                              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
                            >
                              🍔 Añadir Consumo ({mesa.consumos.length})
                            </button>
                            <button 
                              onClick={() => handleAccionMesa(mesa._id, 'cerrar')}
                              className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
                            >
                              ⏹️ Cerrar y Cobrar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {mesas.length === 0 && !loading && (
              <div className="text-center py-12 bg-slate-800/30 backdrop-blur-md rounded-2xl border border-slate-700">
                <span className="text-6xl mb-4 block">🎱</span>
                <p className="text-white text-xl font-semibold mb-2">No hay mesas creadas</p>
                <p className="text-gray-400">Haz clic en "Nueva Mesa" para comenzar</p>
              </div>
            )}
          </>
        )}

        {/* ==================== VISTA DE INVENTARIO ==================== */}
        {vistaActual === 'inventario' && (
          <>
            {/* Estadísticas de Inventario */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-md border border-blue-500/30 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-300 text-sm font-medium">Total Productos</p>
                    <p className="text-4xl font-bold text-white mt-2">{productos.length}</p>
                  </div>
                  <div className="text-5xl">📦</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-md border border-green-500/30 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-300 text-sm font-medium">Activos</p>
                    <p className="text-4xl font-bold text-white mt-2">{productosActivos}</p>
                  </div>
                  <div className="text-5xl">✅</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-md border border-red-500/30 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-300 text-sm font-medium">Inactivos</p>
                    <p className="text-4xl font-bold text-white mt-2">{productosInactivos}</p>
                  </div>
                  <div className="text-5xl">❌</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-md border border-yellow-500/30 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-300 text-sm font-medium">Valor Inventario</p>
                    <p className="text-2xl md:text-3xl font-bold text-white mt-2">{formatCurrency(valorTotalInventario)}</p>
                  </div>
                  <div className="text-5xl">💰</div>
                </div>
              </div>
            </div>

            {/* Botón Crear Producto */}
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Gestión de Productos</h2>
              <button
                onClick={() => {
                  setMostrarFormularioProducto(!mostrarFormularioProducto);
                  setProductoEditando(null);
                  setEmojiSeleccionado('📦');
                }}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                ➕ Nuevo Producto
              </button>
            </div>

            {/* Formulario de Producto */}
            {mostrarFormularioProducto && (
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border border-purple-500/30 rounded-2xl p-6 shadow-2xl mb-8">
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span>{productoEditando ? '✏️' : '➕'}</span>
                  {productoEditando ? 'Editar Producto' : 'Crear Nuevo Producto'}
                </h3>
                <form onSubmit={handleSubmitProducto} className="space-y-4">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white mb-2 font-medium">Nombre del Producto</label>
                      <input 
                        name="nombre" 
                        type="text" 
                        placeholder="Ej: Cerveza Corona" 
                        defaultValue={productoEditando?.nombre}
                        required 
                        className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-white mb-2 font-medium">Categoría</label>
                      <select
                        name="categoria"
                        defaultValue={productoEditando?.categoria || 'Cervezas'}
                        required
                        className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all appearance-none"
                      >
                        {categorias.slice(1).map(cat => ( // slice(1) para omitir 'Todas'
                           <option key={cat} value={cat}>{categoriasEmojis[cat]} {cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white mb-2 font-medium">Precio de Venta (COP)</label>
                      <input
                        name="precio"
                        type="number"
                        placeholder="Ej: 5000"
                        defaultValue={productoEditando?.precio}
                        required
                        min="0"
                        className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-white mb-2 font-medium">Existencias (Stock)</label>
                      <input
                        name="stock"
                        type="number"
                        placeholder="Ej: 100"
                        defaultValue={productoEditando?.stock}
                        required
                        min="0"
                        className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white mb-2 font-medium">Ícono (Emoji)</label>
                    <div className="flex gap-2">
                      <input
                        name="imagen"
                        type="text"
                        readOnly
                        value={emojiSeleccionado}
                        className="p-4 w-20 text-center text-3xl bg-slate-700/50 border border-slate-600 rounded-xl text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarSelectorEmoji(!mostrarSelectorEmoji)}
                        className="flex-1 p-4 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-400 hover:bg-slate-700/80 transition-all"
                      >
                        Seleccionar Ícono...
                      </button>
                    </div>
                    {mostrarSelectorEmoji && (
                      <div className="p-4 bg-slate-900 border border-slate-600 rounded-xl mt-2 grid grid-cols-10 gap-2">
                        {Object.values(emojisDisponibles).flat().map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setEmojiSeleccionado(emoji);
                              setMostrarSelectorEmoji(false);
                            }}
                            className="text-3xl p-2 rounded-lg hover:bg-purple-600 transition-all text-center"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-4 pt-4 mt-4 border-t border-purple-500/30">
                    <button
                      type="button"
                      onClick={handleCancelarProducto}
                      className="bg-slate-700/50 text-gray-300 hover:bg-slate-600/50 font-bold py-3 px-6 rounded-xl shadow-lg transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all"
                    >
                      {productoEditando ? 'Actualizar Producto' : 'Crear Producto'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Filtros y Búsqueda (Inventario) */}
            <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-4 shadow-2xl mb-8 flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="flex-1 p-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="p-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
              >
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat === 'Todas' ? 'Todas las Categorías' : `${categoriasEmojis[cat] || '📦'} ${cat}`}</option>
                ))}
              </select>
            </div>

            {/* Listado de Productos (Tabla) */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-slate-800/50 backdrop-blur-md rounded-2xl shadow-2xl text-white">
                <thead>
                  <tr className="border-b border-purple-500/30 text-left text-sm font-semibold uppercase tracking-wider text-purple-300">
                    <th className="p-4 rounded-tl-2xl">Producto</th>
                    <th className="p-4 hidden sm:table-cell">Categoría</th>
                    <th className="p-4 text-right">Precio</th>
                    <th className="p-4 text-right">Stock</th>
                    <th className="p-4 text-center">Estado</th>
                    <th className="p-4 text-center rounded-tr-2xl">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.map((p) => (
                    <tr key={p._id} className="border-b border-slate-700/50 hover:bg-slate-700/50 transition-colors">
                      <td className="p-4 font-semibold flex items-center gap-3">
                        <span className="text-3xl">{p.imagen}</span>
                        <span className="text-lg">{p.nombre}</span>
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                        <span className="text-sm px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-medium">
                          {p.categoria}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-lg">{formatCurrency(p.precio)}</td>
                      <td className={`p-4 text-right font-bold text-lg ${p.stock < 10 ? 'text-red-400' : 'text-white'}`}>
                        {p.stock}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.activo ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-300'}`}>
                          {p.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-4 text-center space-x-2">
                        <button
                          onClick={() => handleEditarProducto(p)}
                          className="text-yellow-400 hover:text-yellow-300 p-2 rounded-full hover:bg-slate-700 transition"
                          title="Editar Producto"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                        </button>
                        {p.activo ? (
                          <button
                            onClick={() => handleEliminarProducto(p._id)}
                            className="text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-slate-700 transition"
                            title="Desactivar Producto"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivarProducto(p._id)}
                            className="text-green-400 hover:text-green-300 p-2 rounded-full hover:bg-slate-700 transition"
                            title="Activar Producto"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {productosFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-gray-400">
                        No se encontraron productos que coincidan con los filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ==================== VISTA DE HISTORIAL ==================== */}
        {vistaActual === 'historial' && (
          <>
            {/* Estadísticas de Historial */}
            {estadisticas && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-md border border-green-500/30 rounded-2xl p-6 md:col-span-2">
                  <p className="text-green-300 text-sm font-medium">Ventas Totales (Rango)</p>
                  <p className="text-3xl md:text-5xl font-bold text-white mt-2">{formatCurrency(estadisticas.totalVentas)}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-md border border-purple-500/30 rounded-2xl p-6">
                  <p className="text-purple-300 text-sm font-medium">Total Transac.</p>
                  <p className="text-4xl font-bold text-white mt-2">{estadisticas.totalTransacciones}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-md border border-blue-500/30 rounded-2xl p-6">
                  <p className="text-blue-300 text-sm font-medium">Total Consumos</p>
                  <p className="text-3xl md:text-4xl font-bold text-white mt-2">{formatCurrency(estadisticas.totalConsumos)}</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-md border border-yellow-500/30 rounded-2xl p-6">
                  <p className="text-yellow-300 text-sm font-medium">Total Tiempo</p>
                  <p className="text-3xl md:text-4xl font-bold text-white mt-2">{formatCurrency(estadisticas.totalTiempo)}</p>
                </div>
              </div>
            )}

            {/* Filtros de Historial */}
            <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 shadow-2xl mb-8">
              <h3 className="text-2xl font-bold text-white mb-4">Filtrar Historial</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-white mb-2 font-medium">Fecha Inicio</label>
                  <input
                    type="date"
                    value={filtroFechaInicio}
                    onChange={(e) => setFiltroFechaInicio(e.target.value)}
                    className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 font-medium">Fecha Fin</label>
                  <input
                    type="date"
                    value={filtroFechaFin}
                    onChange={(e) => setFiltroFechaFin(e.target.value)}
                    className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 font-medium">Número de Mesa</label>
                  <input
                    type="number"
                    placeholder="Ej: 5"
                    value={filtroMesa}
                    onChange={(e) => setFiltroMesa(e.target.value)}
                    className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={fetchTransacciones}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all"
                  >
                    Buscar
                  </button>
                </div>
              </div>
            </div>

            {/* Listado de Transacciones */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Transacciones Recientes</h2>
              {transacciones.map(t => (
                <div key={t._id} className="bg-slate-800/50 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50">
                  <button
                    onClick={() => setTransaccionExpandida(transaccionExpandida === t._id ? null : t._id)}
                    className="w-full p-6 text-left flex items-center justify-between hover:bg-slate-700/50 transition"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">🎱</span>
                      <div>
                        <p className="text-xl font-bold text-white">Mesa #{t.numeroMesa}</p>
                        <p className="text-sm text-gray-400">
                          {new Date(t.createdAt).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-400">{formatCurrency(t.totalAPagar)}</p>
                      <p className="text-sm text-gray-400">{t.minutosJugados} min. ({t.consumos.length} consumos)</p>
                    </div>
                  </button>
                  
                  {/* Detalle Expandido */}
                  {transaccionExpandida === t._id && (
                    <div className="p-6 bg-black/30 border-t border-purple-500/30">
                      <h4 className="text-xl font-bold text-white mb-4">Detalle de la Transacción</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Detalles de Tiempo */}
                        <div className="bg-slate-700/50 p-4 rounded-xl">
                          <p className="text-lg font-semibold text-purple-300 mb-2">Detalle de Tiempo</p>
                          <div className="space-y-1 text-sm">
                            <p className="flex justify-between"><span>Tarifa:</span> <span className="font-medium text-white">{formatCurrency(t.tarifaPorHora)}/hr</span></p>
                            <p className="flex justify-between"><span>Inicio:</span> <span className="font-medium text-white">{new Date(t.horaInicio).toLocaleTimeString('es-CO')}</span></p>
                            <p className="flex justify-between"><span>Fin:</span> <span className="font-medium text-white">{new Date(t.horaFin).toLocaleTimeString('es-CO')}</span></p>
                            <p className="flex justify-between"><span>Minutos Jugados:</span> <span className="font-medium text-white">{t.minutosJugados} min</span></p>
                            <p className="flex justify-between border-t border-slate-600 pt-1 mt-1 font-bold"><span>Total Tiempo:</span> <span className="text-yellow-400">{formatCurrency(t.costoTiempo)}</span></p>
                          </div>
                        </div>
                        {/* Detalles de Consumos */}
                        <div className="bg-slate-700/50 p-4 rounded-xl">
                          <p className="text-lg font-semibold text-purple-300 mb-2">Detalle de Consumos ({t.consumos.length})</p>
                          <div className="space-y-2 text-sm max-h-40 overflow-y-auto pr-2">
                            {t.consumos.length === 0 && <p className="text-gray-400">Sin consumos.</p>}
                            {t.consumos.map((c, i) => (
                              <div key={i} className="flex justify-between bg-slate-600/50 p-2 rounded-md">
                                <div>
                                  <p className="font-medium text-white">{c.nombreProducto}</p>
                                  <p className="text-xs text-gray-400">{c.cantidad} x {formatCurrency(c.precioUnitario)}</p>
                                </div>
                                <p className="font-medium text-white">{formatCurrency(c.subtotal)}</p>
                              </div>
                            ))}
                          </div>
                          <p className="flex justify-between border-t border-slate-600 pt-2 mt-2 font-bold"><span>Total Consumos:</span> <span className="text-green-400">{formatCurrency(t.totalConsumos)}</span></p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {transacciones.length === 0 && (
                <div className="text-center py-12 bg-slate-800/30 backdrop-blur-md rounded-2xl border border-slate-700">
                  <span className="text-6xl mb-4 block">📊</span>
                  <p className="text-white text-xl font-semibold mb-2">No se encontraron transacciones</p>
                  <p className="text-gray-400">Ajusta los filtros o espera a que se cierren mesas.</p>
                </div>
              )}
            </div>
          </>
        )}

      </main>

      {/* =========================================================
      MODALES
      ========================================================= */}

      {/* Modal: Añadir Consumos a Mesa (RF03) */}
      {mostrarConsumos && mesaSeleccionada && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={cerrarModalConsumos}>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 md:p-8 max-w-4xl w-full shadow-2xl border border-purple-500/50" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 border-b border-purple-500/30 pb-4">
              <h3 className="text-3xl font-bold text-white flex items-center gap-2">
                <span className="text-4xl">🍔</span> Consumos (Mesa #{mesaSeleccionada.numeroMesa})
              </h3>
              <button onClick={cerrarModalConsumos} className="text-white text-4xl hover:text-gray-400 transition transform hover:rotate-90 duration-300">
                &times;
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Columna 1: Productos disponibles */}
              <div className="md:col-span-2 bg-slate-700/50 p-4 rounded-xl border border-slate-700">
                <h4 className="text-xl font-semibold text-white mb-4">Añadir Artículos</h4>
                
                {/* Filtros Modal */}
                <div className="flex space-x-3 overflow-x-auto pb-3 mb-3 border-b border-slate-600">
                  {categorias.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoriaFiltroModal(cat)}
                      className={`flex-shrink-0 text-sm font-medium py-1 px-3 rounded-full transition-colors ${
                        categoriaFiltroModal === cat 
                          ? 'bg-purple-600 text-white shadow-md' 
                          : 'bg-slate-600 hover:bg-slate-500 text-gray-300'
                      }`}
                    >
                      {cat === 'Todas' ? 'Todas' : `${categoriasEmojis[cat] || '📦'} ${cat}`}
                    </button>
                  ))}
                </div>

                {/* Grid de Productos */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-2">
                  {productosModalFiltrados.map(p => (
                    <div 
                      key={p._id} 
                      className="relative bg-slate-800/80 rounded-xl p-3 text-center transition-all duration-200 hover:bg-slate-700/80 border border-slate-700"
                    >
                      <span className="text-3xl block mb-1">{p.imagen}</span>
                      <p className="text-sm font-semibold text-white truncate">{p.nombre}</p>
                      <p className="text-xs text-yellow-400 font-bold mb-2">{formatCurrency(p.precio)}</p>
                      <p className="text-xs text-gray-400 mb-2">Stock: {p.stock}</p>
                      
                      {p.stock === 0 ? (
                         <p className="text-xs text-red-400 mt-1 font-bold">Agotado</p>
                      ) : (
                        <div className="flex gap-2 items-center">
                          <input 
                            type="number" 
                            min="1" 
                            max={p.stock}
                            value={getCantidad(p._id)}
                            onChange={(e) => setCantidad(p._id, parseInt(e.target.value) || 1)}
                            onClick={(e) => e.stopPropagation()} // Evita que se cierre el modal
                            className="w-1/2 text-center p-1 text-sm bg-slate-700 rounded-md text-white border border-slate-600"
                          />
                          <button 
                            onClick={() => handleAgregarConsumo(p._id, getCantidad(p._id))}
                            className="w-1/2 bg-green-600 hover:bg-green-700 text-white text-sm py-1 rounded-lg disabled:opacity-50"
                            disabled={getCantidad(p._id) > p.stock || getCantidad(p._id) <= 0}
                          >
                            +
                          </button>
                        </div>
                      )}
                      {getCantidad(p._id) > p.stock && (
                        <p className="text-xs text-red-400 mt-1">Stock max: {p.stock}</p>
                      )}
                    </div>
                  ))}
                  {productosModalFiltrados.length === 0 && (
                      <p className="col-span-3 text-center text-gray-400 py-4">No hay productos activos o en stock para mostrar.</p>
                  )}
                </div>
              </div>
              
              {/* Columna 2: Resumen de Consumos */}
              <div className="md:col-span-1 bg-slate-700/50 p-4 rounded-xl border border-slate-700 flex flex-col">
                <h4 className="text-xl font-semibold text-white mb-4">Detalle de Cuenta</h4>
                <div className="flex-1 space-y-3 max-h-60 overflow-y-auto pr-2">
                  
                  {mesaSeleccionada.consumos.length === 0 && (
                    <p className="text-gray-400 text-center py-4">Aún no hay consumos registrados.</p>
                  )}
                  
                  {mesaSeleccionada.consumos.map((c, index) => (
                    <div key={index} className="bg-slate-600/50 p-3 rounded-lg flex justify-between items-center text-sm">
                      <div>
                        <p className="text-white font-medium">{c.nombreProducto}</p>
                        <p className="text-gray-400 text-xs">{c.cantidad} x {formatCurrency(c.precioUnitario)}</p>
                      </div>
                      <p className="text-green-400 font-bold">{formatCurrency(c.subtotal)}</p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-600">
                  <div className="flex justify-between items-center text-lg font-bold text-white">
                    <span>Total Consumos:</span>
                    <span className="text-green-400">
                      {formatCurrency(mesaSeleccionada.consumos.reduce((sum, c) => sum + c.subtotal, 0))}
                    </span>
                  </div>
                  <button
                    onClick={() => handleAccionMesa(mesaSeleccionada._id, 'cerrar')}
                    className="w-full mt-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold py-3 rounded-xl transition"
                  >
                    Cerrar y Cobrar Ahora
                  </button>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      )}

    </div>
  );
}