import React, { useState, useEffect } from 'react';
import './App.css';

const WP_URL = 'https://latijera.cl';
const WP_CONSUMER_KEY = 'ck_00ab7fccc2078bf5b48b4d68d02e4da048702542';
const WP_CONSUMER_SECRET = 'cs_7e2ff15307605193e03af7230930dcdca7eef889';
const LIOREN_URL = 'https://www.lioren.cl/api';
const LIOREN_TOKEN = '6e88c7f5c4ff6b9fba88a58a72d467d539a37288e4c697ac2a587a1a3b5480bd061cca1d0975deab';

const fetchWordPress = async (endpoint, method = 'GET', body = null) => {
  const auth = btoa(`${WP_CONSUMER_KEY}:${WP_CONSUMER_SECRET}`);
  try {
    const url = `${WP_URL}/wp-json/wc/v3${endpoint}`;
    const options = {
      method: method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`Error ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

const fetchLioren = async (endpoint, method = 'GET', body = null) => {
  try {
    const url = `${LIOREN_URL}${endpoint}`;
    const options = {
      method: method,
      headers: {
        'Authorization': `Bearer ${LIOREN_TOKEN}`,
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`Error ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error Lioren:', error);
    throw error;
  }
};

const subirImagenWordPress = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const auth = btoa(`${WP_CONSUMER_KEY}:${WP_CONSUMER_SECRET}`);
  try {
    const response = await fetch(`${WP_URL}/wp-json/wp/v2/media`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}` },
      body: formData,
      mode: 'cors',
    });
    if (!response.ok) throw new Error('Error subiendo imagen');
    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('Error subiendo imagen:', error);
    throw error;
  }
};

const procesarProductosWordPress = async (productosWP) => {
  const productosFormateados = [];
  if (!productosWP || productosWP.length === 0) return [];
  
  for (const producto of productosWP) {
    const variantes = [];
    if (producto.variations && producto.variations.length > 0) {
      for (const variacionId of producto.variations) {
        try {
          const variacion = await fetchWordPress(`/products/${producto.id}/variations/${variacionId}`);
          variantes.push({
            id: variacion.id,
            sku: variacion.sku || `SKU-${variacion.id}`,
            color: variacion.attributes?.[0]?.option || 'Sin color',
            precioSinIva: parseFloat(variacion.price) || 0,
            precioConIva: Math.round((parseFloat(variacion.price) || 0) * 1.19 * 100) / 100,
            stock: variacion.stock_quantity !== null ? variacion.stock_quantity : 0,
            descripcion: variacion.description || '',
          });
        } catch (error) {
          console.error('Error variación:', error);
        }
      }
    }
    if (variantes.length > 0) {
      productosFormateados.push({
        id: producto.id,
        nombre: producto.name,
        descripcion: producto.description || '',
        variantes: variantes,
      });
    }
  }
  return productosFormateados;
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Búsqueda y filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroMinPrice, setFiltroMinPrice] = useState('');
  const [filtroMaxPrice, setFiltroMaxPrice] = useState('');
  const [filtroStock, setFiltroStock] = useState('todos');
  
  // Historial de precios
  const [historialPrecios, setHistorialPrecios] = useState({});
  
  // Editar precios masivo
  const [editandoMasivo, setEditandoMasivo] = useState(null);
  const [nuevosPreciosMasivo, setNuevosPreciosMasivo] = useState({});
  
  // Ajuste inventario
  const [ajusteInventario, setAjusteInventario] = useState({
    varianteId: '',
    nuevaUnidades: '',
    razon: '',
  });

  const COLORES = {
    beige: '#F5E6D3', blanco: '#FFFFFF', negro: '#000000', rojo: '#DC143C',
    azul: '#0066CC', verde: '#228B22', gris: '#808080', rosado: '#FF69B4',
    naranja: '#FF8C00', amarillo: '#FFD700', marron: '#8B4513', purpura: '#800080',
    'sin color': '#CCCCCC',
  };

  useEffect(() => { 
    if (isLoggedIn) cargarProductos();
  }, [isLoggedIn]);

  useEffect(() => {
    aplicarFiltros();
  }, [productos, busqueda, filtroMinPrice, filtroMaxPrice, filtroStock]);

  const cargarProductos = async () => {
    setLoading(true);
    try {
      const productosWP = await fetchWordPress('/products?per_page=100');
      if (!productosWP) throw new Error('No se pudo conectar');
      const productosFormateados = await procesarProductosWordPress(productosWP);
      setProductos(productosFormateados);
      
      // Cargar historial de precios desde localStorage
      const hist = localStorage.getItem('historialPrecios');
      if (hist) setHistorialPrecios(JSON.parse(hist));
    } catch (error) {
      console.error('Error:', error);
      alert('Error cargando productos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let filtrados = productos;
    
    if (busqueda) {
      filtrados = filtrados.filter(p => 
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.variantes.some(v => v.sku.toLowerCase().includes(busqueda.toLowerCase()) ||
                               v.color.toLowerCase().includes(busqueda.toLowerCase()))
      );
    }
    
    if (filtroMinPrice || filtroMaxPrice) {
      const min = parseFloat(filtroMinPrice) || 0;
      const max = parseFloat(filtroMaxPrice) || Infinity;
      filtrados = filtrados.filter(p =>
        p.variantes.some(v => v.precioSinIva >= min && v.precioSinIva <= max)
      );
    }
    
    if (filtroStock === 'critico') {
      filtrados = filtrados.filter(p =>
        p.variantes.some(v => v.stock < 5)
      );
    } else if (filtroStock === 'bajo') {
      filtrados = filtrados.filter(p =>
        p.variantes.some(v => v.stock >= 5 && v.stock < 20)
      );
    } else if (filtroStock === 'ok') {
      filtrados = filtrados.filter(p =>
        p.variantes.some(v => v.stock >= 20)
      );
    }
    
    setProductosFiltrados(filtrados);
  };

  const actualizarPrecio = async (varianteId, precioSinIva, productoId) => {
    setLoading(true);
    try {
      const precioConIva = Math.round(precioSinIva * 1.19 * 100) / 100;
      
      await fetchWordPress(
        `/products/${productoId}/variations/${varianteId}`,
        'PUT',
        { price: precioSinIva }
      );
      
      // Guardar en historial
      const nuevoHistorial = { ...historialPrecios };
      if (!nuevoHistorial[varianteId]) nuevoHistorial[varianteId] = [];
      nuevoHistorial[varianteId].push({
        fecha: new Date().toLocaleString(),
        precioAnterior: productos.find(p => p.variantes.find(v => v.id === varianteId))?.variantes.find(v => v.id === varianteId)?.precioSinIva,
        precioNuevo: precioSinIva,
      });
      setHistorialPrecios(nuevoHistorial);
      localStorage.setItem('historialPrecios', JSON.stringify(nuevoHistorial));
      
      // Actualizar app
      cargarProductos();
      alert('✅ Precio actualizado');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const actualizarPreciosMasivo = async (productoId) => {
    setLoading(true);
    try {
      const producto = productos.find(p => p.id === productoId);
      for (const variante of producto.variantes) {
        const nuevoPrecio = parseFloat(nuevosPreciosMasivo[variante.id]) || variante.precioSinIva;
        await actualizarPrecio(variante.id, nuevoPrecio, productoId);
      }
      setEditandoMasivo(null);
      setNuevosPreciosMasivo({});
      alert('✅ Precios actualizados masivamente');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const ajustarInventario = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const variante = productos.flatMap(p => p.variantes).find(v => v.id === parseInt(ajusteInventario.varianteId));
      const productoId = productos.find(p => p.variantes.includes(variante))?.id;
      
      await fetchWordPress(
        `/products/${productoId}/variations/${ajusteInventario.varianteId}`,
        'PUT',
        { stock_quantity: parseInt(ajusteInventario.nuevaUnidades) }
      );
      
      alert('✅ Inventario ajustado');
      setAjusteInventario({ varianteId: '', nuevaUnidades: '', razon: '' });
      cargarProductos();
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const borrarProducto = async (productoId) => {
    if (!window.confirm('¿Seguro que quieres borrar este producto? Se eliminará de WordPress.')) return;
    
    setLoading(true);
    try {
      await fetchWordPress(`/products/${productoId}`, 'DELETE');
      alert('✅ Producto eliminado');
      cargarProductos();
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'latijera2026') { setIsLoggedIn(true); setPassword(''); }
    else { alert('Contraseña incorrecta'); }
  };

  const handleLogout = () => { setIsLoggedIn(false); setPassword(''); };

  const getStockColor = (stock) => {
    if (stock < 5) return '#EF4444';
    if (stock < 20) return '#FBBF24';
    return '#10B981';
  };

  const getStockStatus = (stock) => {
    if (stock < 5) return '⚠️ CRÍTICO';
    if (stock < 20) return '⚡ BAJO';
    return '✓ OK';
  };

  const totalStock = productos.reduce((sum, p) => sum + p.variantes.reduce((s, v) => s + v.stock, 0), 0);
  const totalVariantes = productos.reduce((sum, p) => sum + p.variantes.length, 0);
  const stockCritico = productos.filter(p => p.variantes.some(v => v.stock < 5)).length;

  if (!isLoggedIn) {
    return (
      <div style={{minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'}}>
        <div style={{background: 'white', borderRadius: '1rem', boxShadow: '0 20px 25px rgba(0,0,0,0.3)', padding: '2rem', width: '100%', maxWidth: '400px'}}>
          <div style={{textAlign: 'center', marginBottom: '2rem'}}>
            <div style={{fontSize: '3rem', marginBottom: '1rem'}}>📦</div>
            <h1 style={{fontSize: '2rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #667eea 0%, #ff6b9d 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0}}>La Tijera</h1>
            <p style={{color: '#666', marginTop: '0.5rem', fontSize: '1.1rem'}}>Gestión de Inventario Pro v3.0</p>
          </div>
          <form onSubmit={handleLogin} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <div>
              <label style={{display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem'}}>🔐 Contraseña</label>
              <div style={{position: 'relative'}}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{width: '100%', padding: '0.75rem 1rem', border: '2px solid #ccc', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box'}}
                  placeholder="latijera2026"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{position: 'absolute', right: '0.75rem', top: '0.75rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer'}}
                >
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
            </div>
            <button
              type="submit"
              style={{background: 'linear-gradient(135deg, #667eea 0%, #ff6b9d 100%)', color: 'white', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '1rem'}}
            >
              ✨ Ingresar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight: '100vh', background: '#f3f4f6'}}>
      <div style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
        <div style={{maxWidth: '100%', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
            <div style={{fontSize: '2rem'}}>📦</div>
            <h1 style={{fontSize: '1.875rem', fontWeight: 'bold', color: 'white', margin: 0}}>La Tijera v3.0</h1>
            {loading && <span style={{fontSize: '0.875rem', color: '#fff', marginLeft: '1rem'}}>⏳</span>}
          </div>
          <button onClick={handleLogout} style={{display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ef4444', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: '600', border: 'none', cursor: 'pointer'}}>
            🚪 Salir
          </button>
        </div>
      </div>

      <div style={{background: 'white', borderBottom: '4px solid #667eea', position: 'sticky', top: 0, zIndex: 10, overflowX: 'auto'}}>
        <div style={{padding: '0 1.5rem', display: 'flex', gap: '1rem', minWidth: 'min-content'}}>
          {[
            { tab: 'dashboard', icon: '📊', label: 'Dashboard' },
            { tab: 'productos', icon: '📦', label: 'Productos' },
            { tab: 'precios', icon: '💰', label: 'Precios' },
            { tab: 'inventario', icon: '📊', label: 'Inventario' },
            { tab: 'historial', icon: '📈', label: 'Historial' },
          ].map(({ tab, icon, label }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{padding: '1rem 1rem', fontWeight: 'bold', borderBottom: activeTab === tab ? '4px solid #667eea' : '4px solid transparent', background: 'none', border: 'none', cursor: 'pointer', color: activeTab === tab ? '#667eea' : '#666', fontSize: '0.875rem', whiteSpace: 'nowrap'}}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{maxWidth: '100%', margin: '0 auto', padding: '2rem 1.5rem'}}>
        {activeTab === 'dashboard' && (
          <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
              <div style={{background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)', borderRadius: '0.5rem', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', padding: '1.5rem', color: 'white'}}>
                <p style={{fontSize: '0.875rem', opacity: 0.9, margin: 0}}>📊 Stock Total</p>
                <p style={{fontSize: '2.25rem', fontWeight: 'bold', marginTop: '0.5rem', margin: '0.5rem 0 0 0'}}>{totalStock}</p>
              </div>
              <div style={{background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', borderRadius: '0.5rem', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', padding: '1.5rem', color: 'white'}}>
                <p style={{fontSize: '0.875rem', opacity: 0.9, margin: 0}}>🏷️ Variantes</p>
                <p style={{fontSize: '2.25rem', fontWeight: 'bold', marginTop: '0.5rem', margin: '0.5rem 0 0 0'}}>{totalVariantes}</p>
              </div>
              <div style={{background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', borderRadius: '0.5rem', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', padding: '1.5rem', color: 'white'}}>
                <p style={{fontSize: '0.875rem', opacity: 0.9, margin: 0}}>⚠️ Stock Crítico</p>
                <p style={{fontSize: '2.25rem', fontWeight: 'bold', marginTop: '0.5rem', margin: '0.5rem 0 0 0'}}>{stockCritico}</p>
              </div>
              <div style={{background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)', borderRadius: '0.5rem', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', padding: '1.5rem', color: 'white'}}>
                <p style={{fontSize: '0.875rem', opacity: 0.9, margin: 0}}>📦 Productos</p>
                <p style={{fontSize: '2.25rem', fontWeight: 'bold', marginTop: '0.5rem', margin: '0.5rem 0 0 0'}}>{productos.length}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'productos' && (
          <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
            <div style={{background: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
              <h3 style={{fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', margin: 0}}>🔍 Filtros</h3>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
                <input
                  type="text"
                  placeholder="Buscar por nombre, SKU, color..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  style={{padding: '0.75rem 1rem', border: '2px solid #ccc', borderRadius: '0.5rem'}}
                />
                <input
                  type="number"
                  placeholder="Precio mínimo"
                  value={filtroMinPrice}
                  onChange={(e) => setFiltroMinPrice(e.target.value)}
                  style={{padding: '0.75rem 1rem', border: '2px solid #ccc', borderRadius: '0.5rem'}}
                />
                <input
                  type="number"
                  placeholder="Precio máximo"
                  value={filtroMaxPrice}
                  onChange={(e) => setFiltroMaxPrice(e.target.value)}
                  style={{padding: '0.75rem 1rem', border: '2px solid #ccc', borderRadius: '0.5rem'}}
                />
                <select
                  value={filtroStock}
                  onChange={(e) => setFiltroStock(e.target.value)}
                  style={{padding: '0.75rem 1rem', border: '2px solid #ccc', borderRadius: '0.5rem'}}
                >
                  <option value="todos">Todos</option>
                  <option value="critico">Stock Crítico</option>
                  <option value="bajo">Stock Bajo</option>
                  <option value="ok">Stock OK</option>
                </select>
              </div>
              <p style={{fontSize: '0.875rem', color: '#666', marginTop: '1rem', margin: '1rem 0 0 0'}}>📊 Mostrando {productosFiltrados.length} de {productos.length} productos</p>
            </div>

            {productosFiltrados.map(producto => (
              <div key={producto.id} style={{background: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', overflow: 'hidden', borderLeft: '4px solid #667eea'}}>
                <button
                  onClick={() => setExpandedProduct(expandedProduct === producto.id ? null : producto.id)}
                  style={{width: '100%', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '1rem'}}
                  onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.target.style.background = 'white'}
                >
                  <div>
                    <h3 style={{fontSize: '1.125rem', color: '#1f2937', margin: 0}}>{producto.nombre}</h3>
                    <p style={{fontSize: '0.875rem', color: '#666', margin: '0.25rem 0 0 0'}}>{producto.variantes.length} variantes</p>
                  </div>
                  <span style={{fontSize: '1.25rem'}}>{expandedProduct === producto.id ? '▼' : '▶'}</span>
                </button>

                {expandedProduct === producto.id && (
                  <div style={{borderTop: '2px solid #e5e7eb', padding: '1rem 1.5rem', background: '#f9fafb'}}>
                    <div style={{display: 'flex', gap: '1rem', marginBottom: '1rem'}}>
                      <button
                        onClick={() => setEditandoMasivo(editandoMasivo === producto.id ? null : producto.id)}
                        style={{padding: '0.5rem 1rem', background: '#667eea', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem'}}
                      >
                        💰 {editandoMasivo === producto.id ? 'Cancelar' : 'Editar Precios'}
                      </button>
                      <button
                        onClick={() => borrarProducto(producto.id)}
                        style={{padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem'}}
                      >
                        🗑️ Borrar
                      </button>
                    </div>

                    {editandoMasivo === producto.id && (
                      <div style={{background: 'white', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', border: '2px solid #667eea'}}>
                        <h4 style={{margin: 0, marginBottom: '1rem'}}>Editar Precios Masivamente</h4>
                        {producto.variantes.map(v => (
                          <div key={v.id} style={{display: 'flex', gap: '1rem', marginBottom: '0.5rem', alignItems: 'center'}}>
                            <span style={{minWidth: '120px', fontSize: '0.875rem'}}>{v.color}</span>
                            <input
                              type="number"
                              defaultValue={v.precioSinIva}
                              onChange={(e) => setNuevosPreciosMasivo({...nuevosPreciosMasivo, [v.id]: e.target.value})}
                              style={{width: '100px', padding: '0.5rem', border: '2px solid #ccc', borderRadius: '0.5rem'}}
                              step="0.01"
                            />
                            <span style={{fontSize: '0.75rem', color: '#666'}}>SIN IVA</span>
                          </div>
                        ))}
                        <button
                          onClick={() => actualizarPreciosMasivo(producto.id)}
                          style={{marginTop: '1rem', padding: '0.5rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', width: '100%'}}
                        >
                          ✅ Guardar Todos
                        </button>
                      </div>
                    )}

                    <table style={{width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse'}}>
                      <thead style={{background: '#667eea', color: 'white'}}>
                        <tr>
                          <th style={{textAlign: 'left', padding: '0.75rem 0.5rem'}}>Color</th>
                          <th style={{textAlign: 'left', padding: '0.75rem 0.5rem'}}>SKU</th>
                          <th style={{textAlign: 'center', padding: '0.75rem 0.5rem'}}>Stock</th>
                          <th style={{textAlign: 'right', padding: '0.75rem 0.5rem'}}>Precio s/IVA</th>
                          <th style={{textAlign: 'right', padding: '0.75rem 0.5rem'}}>Precio c/IVA</th>
                          <th style={{textAlign: 'center', padding: '0.75rem 0.5rem'}}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {producto.variantes.map(v => (
                          <tr key={v.id} style={{borderTop: '1px solid #e5e7eb'}}>
                            <td style={{padding: '0.75rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                              <div style={{width: '1.5rem', height: '1.5rem', borderRadius: '50%', border: '2px solid #d1d5db', backgroundColor: COLORES[v.color.toLowerCase()] || '#CCCCCC'}}></div>
                              <span style={{textTransform: 'capitalize'}}>{v.color}</span>
                            </td>
                            <td style={{padding: '0.75rem 0.5rem', fontFamily: 'monospace', fontSize: '0.75rem'}}>{v.sku}</td>
                            <td style={{padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 'bold'}}>{v.stock}</td>
                            <td style={{padding: '0.75rem 0.5rem', textAlign: 'right', color: '#16a34a', fontWeight: '600'}}>${v.precioSinIva}</td>
                            <td style={{padding: '0.75rem 0.5rem', textAlign: 'right', color: '#16a34a', fontWeight: '600'}}>${v.precioConIva}</td>
                            <td style={{padding: '0.75rem 0.5rem', textAlign: 'center'}}>
                              <span style={{fontSize: '0.75rem', fontWeight: 'bold', padding: '0.25rem 0.75rem', borderRadius: '9999px', background: getStockColor(v.stock), color: 'white'}}>
                                {getStockStatus(v.stock)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'precios' && (
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <h2 style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937'}}>💰 Gestión de Precios</h2>
            {productosFiltrados.length === 0 ? (
              <p style={{color: '#666'}}>No hay productos para mostrar</p>
            ) : (
              productosFiltrados.map(p => (
                <div key={p.id} style={{background: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
                  <h3 style={{margin: 0, marginBottom: '1rem'}}>{p.nombre}</h3>
                  <div style={{display: 'grid', gap: '1rem'}}>
                    {p.variantes.map(v => (
                      <div key={v.id} style={{display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem', justifyContent: 'space-between'}}>
                        <div style={{flex: 1}}>
                          <p style={{margin: 0, fontWeight: '600'}}>{v.color} ({v.sku})</p>
                          <p style={{margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#666'}}>S/IVA: ${v.precioSinIva} | C/IVA: ${v.precioConIva}</p>
                        </div>
                        <input
                          type="number"
                          defaultValue={v.precioSinIva}
                          onChange={(e) => {
                            const nuevoP = parseFloat(e.target.value);
                            // Actualizar en tiempo real
                          }}
                          style={{width: '100px', padding: '0.5rem', border: '2px solid #ccc', borderRadius: '0.5rem'}}
                          step="0.01"
                        />
                        <button
                          onClick={() => actualizarPrecio(v.id, parseFloat(document.querySelector(`input[data-variante="${v.id}"]`)?.value || v.precioSinIva), p.id)}
                          style={{padding: '0.5rem 1rem', background: '#667eea', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer'}}
                        >
                          💾
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'inventario' && (
          <div style={{background: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '2rem', maxWidth: '600px'}}>
            <h2 style={{fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', margin: 0}}>📊 Ajustar Inventario</h2>
            <form onSubmit={ajustarInventario} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <div>
                <label style={{display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem'}}>Selecciona variante *</label>
                <select
                  value={ajusteInventario.varianteId}
                  onChange={(e) => setAjusteInventario({...ajusteInventario, varianteId: e.target.value})}
                  style={{width: '100%', padding: '0.75rem 1rem', border: '2px solid #ccc', borderRadius: '0.5rem'}}
                >
                  <option value="">-- Selecciona --</option>
                  {productos.flatMap(p => p.variantes.map(v => (
                    <option key={v.id} value={v.id}>{p.nombre} - {v.color}</option>
                  )))}
                </select>
              </div>

              <div>
                <label style={{display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem'}}>Nuevas unidades *</label>
                <input
                  type="number"
                  value={ajusteInventario.nuevaUnidades}
                  onChange={(e) => setAjusteInventario({...ajusteInventario, nuevaUnidades: e.target.value})}
                  style={{width: '100%', padding: '0.75rem 1rem', border: '2px solid #ccc', borderRadius: '0.5rem'}}
                  min="0"
                />
              </div>

              <div>
                <label style={{display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem'}}>Razón del cambio</label>
                <select
                  value={ajusteInventario.razon}
                  onChange={(e) => setAjusteInventario({...ajusteInventario, razon: e.target.value})}
                  style={{width: '100%', padding: '0.75rem 1rem', border: '2px solid #ccc', borderRadius: '0.5rem'}}
                >
                  <option value="">-- Selecciona razón --</option>
                  <option value="rotura">Rotura/Daño</option>
                  <option value="merma">Merma</option>
                  <option value="conteo">Conteo físico</option>
                  <option value="ajuste">Ajuste administrativo</option>
                  <option value="otra">Otra</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{background: '#10b981', color: 'white', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontWeight: 'bold', border: 'none', cursor: 'pointer', opacity: loading ? 0.6 : 1}}
              >
                ✅ Ajustar
              </button>
            </form>
          </div>
        )}

        {activeTab === 'historial' && (
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <h2 style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937'}}>📈 Historial de Precios</h2>
            {Object.keys(historialPrecios).length === 0 ? (
              <p style={{color: '#666'}}>No hay historial de cambios</p>
            ) : (
              Object.entries(historialPrecios).map(([varianteId, cambios]) => {
                const variante = productos.flatMap(p => p.variantes).find(v => v.id === parseInt(varianteId));
                if (!variante) return null;
                return (
                  <div key={varianteId} style={{background: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
                    <h4 style={{margin: 0, marginBottom: '1rem'}}>{variante.color} ({variante.sku})</h4>
                    <div style={{fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                      {cambios.reverse().map((cambio, idx) => (
                        <div key={idx} style={{padding: '0.5rem', background: '#f9fafb', borderRadius: '0.25rem'}}>
                          <span style={{fontWeight: '600'}}>{cambio.fecha}</span><br />
                          ${cambio.precioAnterior} → ${cambio.precioNuevo}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
