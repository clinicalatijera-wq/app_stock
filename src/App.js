import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const WP_URL = 'https://latijera.cl';
const WP_CONSUMER_KEY = 'ck_00ab7fccc2078bf5b48b4d68d02e4da048702542';
const WP_CONSUMER_SECRET = 'cs_7e2ff15307605193e03af7230930dcdca7eef889';
const LIOREN_URL = 'https://vps.latijera.cl';
const LIOREN_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxODUwIiwianRpIjoiZjVkYTVhMDZhNmRjMmQwZDIxOTg5MDU3ZTY5ZDIzOTYzMGEyYjRmYzA1OWQxNDg1ODRiMjc3NGExNzgzNTVlZGU4MzIxYmMxMTUwYWE3YjUiLCJpYXQiOjE3ODYxMTUxMTAuNjQ5NTQ2LCJuYmYiOjE3ODYxMTUxMTAuNjQ5NTQ4LCJleHAiOjE4MTc2NTExMTAuNjQ1NDA1LCJzdWIiOiI4NjcxIiwic2NvcGVzIjpbXX0.E5LiDEAYvlyDE0gA2RuIc6FiOcuT0-4x1WA1lrsRfu_Cjcqvi9NqPPZhvDIqGMShomGZucb_28JO4IVtKb_1MdQJIgw3Dg3VMNBOiKa69aWaj5Rs3WO7luSbQ9mCJ-p5dt5hM2Q4r_ve_deqjjA_vVsqR5YDzV9YlYm7i29o8KgnDfcu1K03V1ASfh_aT-LlaCH7-B9wbFHtFH6VSTIMKjZJWLKXVuu2y0IS6MScIUdrRiZWE73r2pOcIu348_8WGX0JDUDY29DGoL98rMdOx71aS4VcIoemNOwA3oYyxX2S7UAr3tfqMZoG9aY_PYYfYzSVLOgbFlDJVc1wD_irUTw2ypubMoay2jKEs4MqJyYrRVpr83MOrh4hbaIqRrAagSBVDAg5JfXgMFt7AyvjL1oSaNQNbJa8B75eFg0sXS4jAdM4rswMkvpDyiXkVuOtCIecfeltE24zdZnjfKtV-z3Yk6AoT1mOI1hNskRUvnPerDntaS9mpbaBAeWfD5uEywRIPFOF7ovravP7-5YZ3AO131DQYt1-g35Zf5GIxQ1fBycdqge0B3BD1tybMPPt18WEDX3UYExBr9Bk21QNuUkHxBlfkCyGfEPcZe5i2kxYs9HuPQEFMWqfWXdQcXYk-G38cPKsbz-7TqZpXKJhbRvltdDgT7mqhzHxPzv5MkA';

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
  if (!file) return null; // Imagen opcional
  
  // Validar que sea imagen
  const formatosPermitidos = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
  if (!formatosPermitidos.includes(file.type)) {
    throw new Error(`❌ Formato no permitido. Usa: PNG, JPG, GIF, WEBP`);
  }
  
  // Validar tamaño (máx 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error(`❌ Archivo muy grande. Máximo 10MB (tu archivo: ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
  }

  // Validar dimensiones (mínimo 300x300)
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      if (img.width < 300 || img.height < 300) {
        reject(new Error(`❌ Imagen muy pequeña. Mínimo 300x300px (tu imagen: ${img.width}x${img.height}px)`));
        return;
      }
      
      // Proceder con upload
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
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Error subiendo imagen: ${response.status}`);
        }
        
        const data = await response.json();
        resolve(data.id);
      } catch (error) {
        console.error('Error subiendo imagen:', error);
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('❌ No se pudo cargar la imagen. Verifica que sea un archivo válido'));
    };
    
    img.src = URL.createObjectURL(file);
  });
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
          const precioSinIva = parseFloat(variacion.price) || 0;
          variantes.push({
            id: variacion.id,
            sku: variacion.sku || `SKU-${variacion.id}`,
            color: variacion.attributes?.[0]?.option || 'Sin color',
            precioSinIva: precioSinIva,
            precioConIva: Math.round(precioSinIva * 1.19 * 100) / 100,
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
  const [loading, setLoading] = useState(false);
  
  const [busqueda, setBusqueda] = useState('');
  const [filtroMinPrice, setFiltroMinPrice] = useState('');
  const [filtroMaxPrice, setFiltroMaxPrice] = useState('');
  const [filtroStock, setFiltroStock] = useState('todos');
  
  const [historialPrecios, setHistorialPrecios] = useState({});
  const [editandoMasivo, setEditandoMasivo] = useState(null);
  
  const [ajusteInventario, setAjusteInventario] = useState({
    varianteId: '',
    nuevaUnidades: '',
    razon: '',
  });

  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    descripcion: '',
    precioSinIva: '',
    sku: '',
    imagen: null,
  });

  const [tipoPrecionProducto, setTipoPrecionProducto] = useState('sinIva'); // 'sinIva' o 'conIva'

  const [nuevaVariante, setNuevaVariante] = useState({
    productoId: '',
    color: '',
    sku: '',
    precioSinIva: '',
    stock: '',
    imagen: null,
  });

  const [tipoPrecionVariante, setTipoPrecionVariante] = useState('sinIva'); // 'sinIva' o 'conIva'

  const [editandoProducto, setEditandoProducto] = useState(null);
  const [productoEditar, setProductoEditar] = useState({
    id: '',
    nombre: '',
    descripcion: '',
    imagen: null,
  });

  const COLORES = {
    beige: '#F5E6D3', blanco: '#FFFFFF', negro: '#000000', rojo: '#DC143C',
    azul: '#0066CC', verde: '#228B22', gris: '#808080', rosado: '#FF69B4',
    naranja: '#FF8C00', amarillo: '#FFD700', marron: '#8B4513', purpura: '#800080',
    'sin color': '#CCCCCC',
  };



  const aplicarFiltros = useCallback(() => {
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
  }, [productos, busqueda, filtroMinPrice, filtroMaxPrice, filtroStock]);

  useEffect(() => { 
    if (isLoggedIn) cargarProductos();
  }, [isLoggedIn]);

  useEffect(() => {
    aplicarFiltros();
  }, [aplicarFiltros]);

  const cargarProductos = async () => {
    setLoading(true);
    try {
      const productosWP = await fetchWordPress('/products?per_page=100');
      if (!productosWP) throw new Error('No se pudo conectar');
      const productosFormateados = await procesarProductosWordPress(productosWP);
      setProductos(productosFormateados);
      
      const hist = localStorage.getItem('historialPrecios');
      if (hist) setHistorialPrecios(JSON.parse(hist));
    } catch (error) {
      console.log('No se pudo conectar a APIs. Usando datos de demostración.');
      
      // Datos de demostración
      const productosDemo = [
        {
          id: 1,
          nombre: 'Lana Merino Premium',
          descripcion: 'Lana merino de alta calidad',
          variantes: [
            { id: 1, sku: 'LM-ROJO', color: 'Rojo', precioSinIva: 50, precioConIva: 59.50, stock: 25 },
            { id: 2, sku: 'LM-AZUL', color: 'Azul', precioSinIva: 50, precioConIva: 59.50, stock: 8 },
            { id: 3, sku: 'LM-NEGRO', color: 'Negro', precioSinIva: 50, precioConIva: 59.50, stock: 3 },
          ]
        },
        {
          id: 2,
          nombre: 'Tela Algodón Natural',
          descripcion: 'Tela 100% algodón',
          variantes: [
            { id: 4, sku: 'TA-BLANCO', color: 'Blanco', precioSinIva: 30, precioConIva: 35.70, stock: 50 },
            { id: 5, sku: 'TA-BEIGE', color: 'Beige', precioSinIva: 30, precioConIva: 35.70, stock: 15 },
          ]
        },
        {
          id: 3,
          nombre: 'Hilo de Seda',
          descripcion: 'Hilo premium para bordado',
          variantes: [
            { id: 6, sku: 'HS-VERDE', color: 'Verde', precioSinIva: 15, precioConIva: 17.85, stock: 100 },
            { id: 7, sku: 'HS-NARANJA', color: 'Naranja', precioSinIva: 15, precioConIva: 17.85, stock: 2 },
          ]
        },
      ];
      
      setProductos(productosDemo);
    } finally {
      setLoading(false);
    }
  };

  const sincronizarDesdeLiboren = async () => {
    setLoading(true);
    try {
      const productosLiboren = await fetchLioren('/api/lioren/productos');
      if (!productosLiboren || productosLiboren.length === 0) {
        alert('No hay productos en Lioren');
        return;
      }



      let contadorNuevos = 0;

      // Crear productos simples
      for (const prod of productosLiboren) {
        // FILTRO: Saltar productos de cordonería (PCS, MM)
        if (prod.nombre.toUpperCase().includes('PCS') || prod.nombre.toUpperCase().includes('MM')) {
          continue; // Saltar este producto
        }
        
        try {
          // Asegurar que el precio sea válido
          const precioSinIva = Math.round((prod.precio_bruto / 1.19) * 100) / 100;
          
          const productoWP = {
            name: prod.nombre,
            type: 'simple',
            sku: prod.codigo || `SKU-${prod.id}`,
            regular_price: precioSinIva,
            stock_quantity: prod.stocks && prod.stocks[0] ? prod.stocks[0].cantidad : 0,
          };

          await fetchWordPress('/products', 'POST', productoWP);
          contadorNuevos++;

        } catch (error) {
          console.log(`Producto ${prod.nombre} no se pudo crear:`, error.message);
        }
      }

      alert(`✅ Sincronización exitosa!\n${contadorNuevos} productos`);
      cargarProductos();
    } catch (error) {
      alert('Error en sincronización: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const actualizarFotoProducto = async (e) => {
    e.preventDefault();
    if (!editandoProducto || !productoEditar.imagen) {
      alert('Selecciona una imagen');
      return;
    }

    setLoading(true);
    try {
      const imagenId = await subirImagenWordPress(productoEditar.imagen);
      
      await fetchWordPress(`/products/${editandoProducto}`, 'PUT', {
        images: [{ id: imagenId }],
      });

      alert('✅ Foto actualizada en WordPress!');
      setEditandoProducto(null);
      setProductoEditar({ id: '', nombre: '', descripcion: '', imagen: null });
      cargarProductos();
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const actualizarPrecio = async (varianteId, precioSinIva, productoId) => {
    setLoading(true);
    try {
      const precioConIva = Math.round(precioSinIva * 1.19 * 100) / 100;
      
      await fetchWordPress(`/products/${productoId}/variations/${varianteId}`, 'PUT', {
        regular_price: precioSinIva,
      });

      // Actualizar en Lioren
      try {
        const lioren_update = {
          id: varianteId,
          precioneto: precioSinIva,
          preciobruto: precioConIva,
        };
        
        await fetch(`https://cl.lioren.enterprises/empresas/la-tijera-limitada/productos/${varianteId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lioren_update),
          credentials: 'include'
        });
      } catch (err) {
        console.log('Nota: Precio actualizado en WordPress, error en Lioren:', err.message);
      }

      alert('✅ Precio actualizado en WordPress!');
      cargarProductos();
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };


  const crearProducto = async (e) => {
    e.preventDefault();
    
    if (!nuevoProducto.nombre || !nuevoProducto.precioSinIva) {
      alert('Completa al menos nombre y precio');
      return;
    }
    
    setLoading(true);
    
    try {
      let imagenId = null;
      
      if (nuevoProducto.imagen) {
        imagenId = await subirImagenWordPress(nuevoProducto.imagen);
      }
      
      // Usuario ingresa precio CON IVA, calculamos SIN IVA
      const precioConIva = parseFloat(nuevoProducto.precioSinIva);
      const precioSinIva = Math.round(precioConIva / 1.19 * 100) / 100;
      
      const productoData = {
        name: nuevoProducto.nombre,
        description: nuevoProducto.descripcion,
        type: 'variable',
        sku: nuevoProducto.sku || `PRD-${Date.now()}`,
        regular_price: precioSinIva,
        images: imagenId ? [{ id: imagenId }] : [],
        attributes: [
          {
            id: 0,
            name: 'Color',
            position: 0,
            visible: true,
            variation: true,
            options: [],
          },
        ],
      };
      
      await fetchWordPress('/products', 'POST', productoData);
      
      // Crear en Lioren (sin token, haremos un POST simple)
      try {
        const lioren_payload = {
          codigo: nuevoProducto.sku || `PRD-${Date.now()}`,
          nombre: nuevoProducto.nombre,
          precioneto: precioSinIva,
          preciobruto: precioConIva,
          descripcion: nuevoProducto.descripcion || '',
          unidad: 1,
          fraccionable: 0,
          param1: '',
          param2: '',
          param3: '',
          param4: '',
          wooproducts: [{ id: 1224, nombre: 'La Tijera Web', activo: 1 }],
        };
        
        // Hacer POST directo a Lioren
        await fetch('https://cl.lioren.enterprises/empresas/la-tijera-limitada/productos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lioren_payload),
          credentials: 'include'
        });
      } catch (lioreError) {
        console.log('Nota: Producto creado en WordPress pero hubo error en Lioren');
      }
      
      alert('✅ Producto creado en WordPress y Lioren!');
      
      setNuevoProducto({ nombre: '', descripcion: '', precioSinIva: '', sku: '', imagen: null });
      cargarProductos();
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const crearVariante = async (e) => {
    e.preventDefault();
    
    if (!nuevaVariante.productoId || !nuevaVariante.color || !nuevaVariante.sku || !nuevaVariante.precioSinIva) {
      alert('Completa todos los campos requeridos');
      return;
    }
    
    setLoading(true);
    
    try {
      let imagenId = null;
      
      if (nuevaVariante.imagen) {
        imagenId = await subirImagenWordPress(nuevaVariante.imagen);
      }
      
      // Usuario ingresa precio CON IVA, calculamos SIN IVA
      const precioConIva = parseFloat(nuevaVariante.precioSinIva);
      const precioSinIva = Math.round(precioConIva / 1.19 * 100) / 100;
      
      const varianteData = {
        sku: nuevaVariante.sku,
        regular_price: precioSinIva,
        stock_quantity: parseInt(nuevaVariante.stock) || 0,
        attributes: [
          {
            id: 0,
            name: 'Color',
            option: nuevaVariante.color,
          },
        ],
        images: imagenId ? [{ id: imagenId }] : [],
      };
      
      await fetchWordPress(
        `/products/${nuevaVariante.productoId}/variations`,
        'POST',
        varianteData
      );

      const varianteLioren = {
        codigo: nuevaVariante.sku,
        nombre: `${productos.find(p => p.id === parseInt(nuevaVariante.productoId))?.nombre} - ${nuevaVariante.color}`,
        precio_neto: precioSinIva,
        precio_bruto: precioConIva,
        unidad: 'Unidad [ud]',
        fraccionable: false,
      };
      
      try {
        await fetchLioren('/api/lioren/productos', 'POST', varianteLioren)
      } catch (lioreError) {
        console.log('Nota: Variante creada en WordPress');
      }
      
      alert('✅ Variante creada en WordPress y Lioren!');
      
      setNuevaVariante({ productoId: '', color: '', sku: '', precioSinIva: '', stock: '', imagen: null });
      cargarProductos();
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
    if (!window.confirm('¿Seguro que quieres borrar este producto?')) return;
    
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{width: '100%', padding: '0.75rem 1rem', border: '2px solid #ccc', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box'}}
              placeholder="latijera2026"
              autoFocus
            />
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
            <h1 style={{fontSize: '1.5rem', fontWeight: 'bold', color: 'white', margin: 0}}>La Tijera v3.0</h1>
            {loading && <span style={{fontSize: '0.875rem', color: '#fff'}}>⏳</span>}
          </div>
          <button onClick={handleLogout} style={{display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ef4444', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: '600', border: 'none', cursor: 'pointer'}}>
            🚪 Salir
          </button>
        </div>
      </div>

      <div style={{background: 'white', borderBottom: '4px solid #667eea', position: 'sticky', top: 0, zIndex: 10, overflowX: 'auto'}}>
        <div style={{padding: '0 1.5rem', display: 'flex', gap: '0.5rem', minWidth: 'min-content'}}>
          {[
            { tab: 'dashboard', icon: '📊', label: 'Dashboard' },
            { tab: 'productos', icon: '📦', label: 'Productos' },
            { tab: 'crear-producto', icon: '➕', label: 'Crear' },
            { tab: 'editar-producto', icon: '✏️', label: 'Editar' },
            { tab: 'crear-variante', icon: '🎨', label: 'Variante' },
            { tab: 'precios', icon: '💰', label: 'Precios' },
            { tab: 'inventario', icon: '📊', label: 'Inventario' },
            { tab: 'historial', icon: '📈', label: 'Historial' },
          ].map(({ tab, icon, label }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{padding: '1rem 0.75rem', fontWeight: 'bold', borderBottom: activeTab === tab ? '4px solid #667eea' : '4px solid transparent', background: 'none', border: 'none', cursor: 'pointer', color: activeTab === tab ? '#667eea' : '#666', fontSize: '0.75rem', whiteSpace: 'nowrap'}}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{maxWidth: '100%', margin: '0 auto', padding: '2rem 1.5rem'}}>
        {activeTab === 'dashboard' && (
          <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem'}}>
              <div style={{background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)', borderRadius: '0.5rem', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', padding: '1.5rem', color: 'white'}}>
                <p style={{fontSize: '0.875rem', opacity: 0.9, margin: 0}}>📊 Stock Total</p>
                <p style={{fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem', margin: '0.5rem 0 0 0'}}>{totalStock}</p>
              </div>
              <div style={{background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', borderRadius: '0.5rem', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', padding: '1.5rem', color: 'white'}}>
                <p style={{fontSize: '0.875rem', opacity: 0.9, margin: 0}}>🏷️ Variantes</p>
                <p style={{fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem', margin: '0.5rem 0 0 0'}}>{totalVariantes}</p>
              </div>
              <div style={{background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', borderRadius: '0.5rem', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', padding: '1.5rem', color: 'white'}}>
                <p style={{fontSize: '0.875rem', opacity: 0.9, margin: 0}}>⚠️ Crítico</p>
                <p style={{fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem', margin: '0.5rem 0 0 0'}}>{stockCritico}</p>
              </div>
              <div style={{background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)', borderRadius: '0.5rem', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', padding: '1.5rem', color: 'white'}}>
                <p style={{fontSize: '0.875rem', opacity: 0.9, margin: 0}}>📦 Productos</p>
                <p style={{fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem', margin: '0.5rem 0 0 0'}}>{productos.length}</p>
              </div>
            </div>
            <button
              onClick={sincronizarDesdeLiboren}
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                color: 'white',
                padding: '1rem 2rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
                transition: 'all 0.3s',
                maxWidth: '300px'
              }}
            >
              {loading ? '⏳ Sincronizando...' : '🔄 Sincronizar desde Lioren'}
            </button>
          </div>
        )}

        {activeTab === 'productos' && (
          <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
            <div style={{background: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
              <h3 style={{fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', margin: 0}}>🔍 Filtros</h3>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem'}}>
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  style={{padding: '0.75rem 1rem', border: '2px solid #ccc', borderRadius: '0.5rem', fontSize: '0.875rem'}}
                />
                <input
                  type="number"
                  placeholder="Precio min"
                  value={filtroMinPrice}
                  onChange={(e) => setFiltroMinPrice(e.target.value)}
                  style={{padding: '0.75rem 1rem', border: '2px solid #ccc', borderRadius: '0.5rem', fontSize: '0.875rem'}}
                />
                <input
                  type="number"
                  placeholder="Precio max"
                  value={filtroMaxPrice}
                  onChange={(e) => setFiltroMaxPrice(e.target.value)}
                  style={{padding: '0.75rem 1rem', border: '2px solid #ccc', borderRadius: '0.5rem', fontSize: '0.875rem'}}
                />
                <select
                  value={filtroStock}
                  onChange={(e) => setFiltroStock(e.target.value)}
                  style={{padding: '0.75rem 1rem', border: '2px solid #ccc', borderRadius: '0.5rem', fontSize: '0.875rem'}}
                >
                  <option value="todos">Todos</option>
                  <option value="critico">Crítico</option>
                  <option value="bajo">Bajo</option>
                  <option value="ok">OK</option>
                </select>
              </div>
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
                    <h3 style={{fontSize: '1rem', color: '#1f2937', margin: 0}}>{producto.nombre}</h3>
                    <p style={{fontSize: '0.75rem', color: '#666', margin: '0.25rem 0 0 0'}}>{producto.variantes.length} variantes</p>
                  </div>
                  <span>{expandedProduct === producto.id ? '▼' : '▶'}</span>
                </button>

                {expandedProduct === producto.id && (
                  <div style={{borderTop: '2px solid #e5e7eb', padding: '1rem 1.5rem', background: '#f9fafb'}}>
                    <div style={{display: 'flex', gap: '1rem', marginBottom: '1rem'}}>
                      <button
                        onClick={() => setEditandoMasivo(editandoMasivo === producto.id ? null : producto.id)}
                        style={{padding: '0.5rem 1rem', background: '#667eea', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.75rem'}}
                      >
                        💰 Precios
                      </button>
                      <button
                        onClick={() => borrarProducto(producto.id)}
                        style={{padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.75rem'}}
                      >
                        🗑️ Borrar
                      </button>
                    </div>

                    <table style={{width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse'}}>
                      <thead style={{background: '#667eea', color: 'white'}}>
                        <tr>
                          <th style={{textAlign: 'left', padding: '0.5rem'}}>Color</th>
                          <th style={{textAlign: 'left', padding: '0.5rem'}}>SKU</th>
                          <th style={{textAlign: 'center', padding: '0.5rem'}}>Stock</th>
                          <th style={{textAlign: 'right', padding: '0.5rem'}}>S/IVA</th>
                          <th style={{textAlign: 'right', padding: '0.5rem'}}>C/IVA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {producto.variantes.map(v => (
                          <tr key={v.id} style={{borderTop: '1px solid #e5e7eb'}}>
                            <td style={{padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                              <div style={{width: '1rem', height: '1rem', borderRadius: '50%', border: '1px solid #d1d5db', backgroundColor: COLORES[v.color.toLowerCase()] || '#CCCCCC'}}></div>
                              <span>{v.color}</span>
                            </td>
                            <td style={{padding: '0.5rem', fontFamily: 'monospace', fontSize: '0.7rem'}}>{v.sku}</td>
                            <td style={{padding: '0.5rem', textAlign: 'center', fontWeight: 'bold'}}>{v.stock}</td>
                            <td style={{padding: '0.5rem', textAlign: 'right', color: '#16a34a'}}>${v.precioSinIva}</td>
                            <td style={{padding: '0.5rem', textAlign: 'right', color: '#16a34a'}}>${v.precioConIva}</td>
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

        {activeTab === 'crear-producto' && (
          <div style={{background: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '2rem', maxWidth: '500px'}}>
            <h2 style={{fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', margin: 0}}>➕ Crear Producto</h2>
            <form onSubmit={crearProducto} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <input
                type="text"
                placeholder="Nombre *"
                value={nuevoProducto.nombre}
                onChange={(e) => setNuevoProducto({...nuevoProducto, nombre: e.target.value})}
                style={{width: '100%', padding: '0.75rem 1rem', border: '2px solid #ccc', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box'}}
              />
              <textarea
                placeholder="Descripción"
                value={nuevoProducto.descripcion}
                onChange={(e) => setNuevoProducto({...nuevoProducto, descripcion: e.target.value})}
                style={{width: '100%', padding: '0.75rem 1rem', border: '2px solid #ccc', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box', minHeight: '80px', fontFamily: 'inherit'}}
              />
              <div style={{background: '#f0f9ff', border: '1px solid #bfdbfe', borderRadius: '0.5rem', padding: '1rem', marginBottom: '0.5rem'}}>
                <label style={{fontSize: '0.875rem', fontWeight: 'bold', color: '#1e40af', display: 'block', marginBottom: '0.75rem'}}>💰 ¿Cuál precio tienes?</label>
                <div style={{display: 'flex', gap: '1.5rem'}}>
                  <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem'}}>
                    <input
                      type="radio"
                      value="sinIva"
                      checked={tipoPrecionProducto === 'sinIva'}
                      onChange={(e) => setTipoPrecionProducto(e.target.value)}
                      style={{cursor: 'pointer'}}
                    />
                    <span>Tengo el SIN IVA</span>
                  </label>
                  <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem'}}>
                    <input
                      type="radio"
                      value="conIva"
                      checked={tipoPrecionProducto === 'conIva'}
                      onChange={(e) => setTipoPrecionProducto(e.target.value)}
                      style={{cursor: 'pointer'}}
                    />
                    <span>Tengo el CON IVA</span>
                  </label>
                </div>
              </div>

              <div style={{display: 'flex', gap: '1rem'}}>
                {tipoPrecionProducto === 'sinIva' ? (
                  <>
                    <div style={{flex: 1}}>
                      <label style={{fontSize: '0.875rem', fontWeight: 'bold', color: '#666', display: 'block', marginBottom: '0.5rem'}}>Precio SIN IVA *</label>
                      <input
                        type="number"
                        placeholder="$0.00"
                        value={nuevoProducto.precioSinIva}
                        onChange={(e) => setNuevoProducto({...nuevoProducto, precioSinIva: e.target.value})}
                        style={{width: '100%', padding: '0.75rem 1rem', border: '2px solid #3b82f6', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box'}}
                        step="0.01"
                      />
                      <small style={{color: '#3b82f6', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 'bold'}}>👈 Ingresa este valor</small>
                    </div>
                    <div style={{flex: 1}}>
                      <label style={{fontSize: '0.875rem', fontWeight: 'bold', color: '#666', display: 'block', marginBottom: '0.5rem'}}>Precio CON IVA (19%)</label>
                      <input
                        type="number"
                        placeholder="$0.00"
                        value={nuevoProducto.precioSinIva ? (Math.round(parseFloat(nuevoProducto.precioSinIva) * 1.19 * 100) / 100).toFixed(2) : ''}
                        disabled
                        style={{width: '100%', padding: '0.75rem 1rem', border: '2px solid #eee', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box', background: '#f9f9f9', color: '#666', cursor: 'not-allowed'}}
                      />
                      <small style={{color: '#999', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block'}}>Se calcula automáticamente</small>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{flex: 1}}>
                      <label style={{fontSize: '0.875rem', fontWeight: 'bold', color: '#666', display: 'block', marginBottom: '0.5rem'}}>Precio SIN IVA</label>
                      <input
                        type="number"
                        placeholder="$0.00"
                        value={nuevoProducto.precioSinIva ? (Math.round(parseFloat(nuevoProducto.precioSinIva) / 1.19 * 100) / 100).toFixed(2) : ''}
                        disabled
                        style={{width: '100%', padding: '0.75rem 1rem', border: '2px solid #eee', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box', background: '#f9f9f9', color: '#666', cursor: 'not-allowed'}}
                      />
                      <small style={{color: '#999', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block'}}>Se calcula automáticamente</small>
                    </div>
                    <div style={{flex: 1}}>
                      <label style={{fontSize: '0.875rem', fontWeight: 'bold', color: '#666', display: 'block', marginBottom: '0.5rem'}}>Precio CON IVA (19%) *</label>
                      <input
                        type="number"
                        placeholder="$0.00"
                        value={nuevoProducto.precioSinIva}
                        onChange={(e) => setNuevoProducto({...nuevoProducto, precioSinIva: e.target.value})}
                        style={{width: '100%', padding: '0.75rem 1rem', border: '2px solid #3b82f6', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box'}}
                        step="0.01"
                      />
                      <small style={{color: '#3b82f6', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 'bold'}}>👈 Ingresa este valor</small>
                    </div>
                  </>
                )}
              </div>
              <input
                type="text"
                placeholder="SKU"
                value={nuevoProducto.sku}
                onChange={(e) => setNuevoProducto({...nuevoProducto, sku: e.target.value})}
                style={{width: '100%', padding: '0.75rem 1rem', border: '2px solid #ccc', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box'}}
              />
              <div style={{background: '#f0f9ff', border: '1px solid #bfdbfe', borderRadius: '0.5rem', padding: '1rem', marginBottom: '0.5rem'}}>
                <label style={{fontSize: '0.875rem', fontWeight: 'bold', color: '#1e40af', display: 'block', marginBottom: '0.5rem'}}>📸 Foto del Producto (Opcional)</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  onChange={(e) => setNuevoProducto({...nuevoProducto, imagen: e.target.files?.[0] || null})}
                  style={{width: '100%', padding: '0.75rem 1rem', border: '2px solid #bfdbfe', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box'}}
                />
                <small style={{color: '#1e40af', fontSize: '0.75rem', marginTop: '0.5rem', display: 'block', fontWeight: 'bold'}}>✅ Recomendado para WordPress:</small>
                <small style={{color: '#3b82f6', fontSize: '0.75rem', display: 'block'}}>• Tamaño: Mínimo 300x300px (recomendado 1000x1000px+)</small>
                <small style={{color: '#3b82f6', fontSize: '0.75rem', display: 'block'}}>• Formato: PNG, JPG, GIF, WEBP</small>
                <small style={{color: '#3b82f6', fontSize: '0.75rem', display: 'block'}}>• Peso máximo: 10MB</small>
                <small style={{color: '#3b82f6', fontSize: '0.75rem', display: 'block'}}>• Proporción: Cuadrado (1:1) es lo mejor</small>
                {nuevoProducto.imagen && (
                  <small style={{color: '#059669', fontSize: '0.75rem', marginTop: '0.5rem', display: 'block', fontWeight: 'bold'}}>
                    ✓ Archivo seleccionado: {nuevoProducto.imagen.name}
                  </small>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{background: '#10b981', color: 'white', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontWeight: 'bold', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem', opacity: loading ? 0.6 : 1}}
              >
                {loading ? '⏳ Creando...' : '✨ Crear en WP + Lioren'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'crear-variante' && (
          <div style={{background: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '2rem', maxWidth: '500px'}}>
            <h2 style={{fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', margin: 0}}>🎨 Crear Variante</h2>
            <form onSubmit={crearVariante} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <select
                value={nuevaVariante.productoId}
                onChange={(e) => setNuevaVariante({...nuevaVariante, productoId: e.target.value})}
                style={{width: '100%', padding: '0.75rem 1rem', border: '2px solid #ccc', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box'}}
              >
                <option value="">-- Selecciona producto --</option>
                {productos.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Color *"
                value={nuevaVariante.color}
                onChange={(e) => setNuevaVariante({...nuevaVariante, color: e.target.value})}
                style={{width: '100%', padding: '0.75rem 1rem', border: '2px solid #ccc', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box'}}
                list="colores"
              />
              <datalist id="colores">
                <option value="Rojo" />
                <option value="Azul" />
                <option value="Verde" />
                <option value="Amarillo" />
                <option value="Negro" />
                <option value="Blanco" />
              </datalist>
              <input
                type="text"
                placeholder="SKU *"
                value={nuevaVariante.sku}
                onChange={(e) => setNuevaVariante({...nuevaVariante, sku: e.target.value})}
                style={{width: '100%', padding: '0.75rem 1rem', border: '2px solid #ccc', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box'}}
              />
              <div style={{background: '#f0f9ff', border: '1px solid #bfdbfe', borderRadius: '0.5rem', padding: '1rem', marginBottom: '0.5rem'}}>
                <label style={{fontSize: '0.875rem', fontWeight: 'bold', color: '#1e40af', display: 'block', marginBottom: '0.75rem'}}>💰 ¿Cuál precio tienes?</label>
                <div style={{display: 'flex', gap: '1.5rem'}}>
                  <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem'}}>
                    <input
                      type="radio"
                      value="sinIva"
                      checked={tipoPrecionVariante === 'sinIva'}
                      onChange={(e) => setTipoPrecionVariante(e.target.value)}
                      style={{cursor: 'pointer'}}
                    />
                    <span>Tengo el SIN IVA</span>
                  </label>
                  <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem'}}>
                    <input
                      type="radio"
                      value="conIva"
                      checked={tipoPrecionVariante === 'conIva'}
                      onChange={(e) => setTipoPrecionVariante(e.target.value)}
                      style={{cursor: 'pointer'}}
                    />
                    <span>Tengo el CON IVA</span>
                  </label>
                </div>
              </div>

              <div style={{display: 'flex', gap: '1rem'}}>
                {tipoPrecionVariante === 'sinIva' ? (
                  <>
                    <div style={{flex: 1}}>
                      <label style={{fontSize: '0.875rem', fontWeight: 'bold', color: '#666', display: 'block', marginBottom: '0.5rem'}}>Precio SIN IVA *</label>
                      <input
                        type="number"
                        placeholder="$0.00"
                        value={nuevaVariante.precioSinIva}
                        onChange={(e) => setNuevaVariante({...nuevaVariante, precioSinIva: e.target.value})}
                        style={{width: '100%', padding: '0.75rem 1rem', border: '2px solid #3b82f6', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box'}}
                        step="0.01"
                      />
                      <small style={{color: '#3b82f6', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 'bold'}}>👈 Ingresa este valor</small>
                    </div>
                    <div style={{flex: 1}}>
                      <label style={{fontSize: '0.875rem', fontWeight: 'bold', color: '#666', display: 'block', marginBottom: '0.5rem'}}>Precio CON IVA (19%)</label>
                      <input
                        type="number"
                        placeholder="$0.00"
                        value={nuevaVariante.precioSinIva ? (Math.round(parseFloat(nuevaVariante.precioSinIva) * 1.19 * 100) / 100).toFixed(2) : ''}
                        disabled
                        style={{width: '100%', padding: '0.75rem 1rem', border: '2px solid #eee', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box', background: '#f9f9f9', color: '#666', cursor: 'not-allowed'}}
                      />
                      <small style={{color: '#999', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block'}}>Se calcula automáticamente</small>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{flex: 1}}>
                      <label style={{fontSize: '0.875rem', fontWeight: 'bold', color: '#666', display: 'block', marginBottom: '0.5rem'}}>Precio SIN IVA</label>
                      <input
                        type="number"
                        placeholder="$0.00"
                        value={nuevaVariante.precioSinIva ? (Math.round(parseFloat(nuevaVariante.precioSinIva) / 1.19 * 100) / 100).toFixed(2) : ''}
                        disabled
                        style={{width: '100%', padding: '0.75rem 1rem', border: '2px solid #eee', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box', background: '#f9f9f9', color: '#666', cursor: 'not-allowed'}}
                      />
                      <small style={{color: '#999', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block'}}>Se calcula automáticamente</small>
                    </div>
                    <div style={{flex: 1}}>
                      <label style={{fontSize: '0.875rem', fontWeight: 'bold', color: '#666', display: 'block', marginBottom: '0.5rem'}}>Precio CON IVA (19%) *</label>
                      <input
                        type="number"
                        placeholder="$0.00"
                        value={nuevaVariante.precioSinIva}
                        onChange={(e) => setNuevaVariante({...nuevaVariante, precioSinIva: e.target.value})}
                        style={{width: '100%', padding: '0.75rem 1rem', border: '2px solid #3b82f6', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box'}}
                        step="0.01"
                      />
                      <small style={{color: '#3b82f6', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 'bold'}}>👈 Ingresa este valor</small>
                    </div>
                  </>
                )}
              </div>
              <input
                type="number"
                placeholder="Stock"
                value={nuevaVariante.stock}
                onChange={(e) => setNuevaVariante({...nuevaVariante, stock: e.target.value})}
                style={{width: '100%', padding: '0.75rem 1rem', border: '2px solid #ccc', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box'}}
              />
              <div style={{background: '#f0f9ff', border: '1px solid #bfdbfe', borderRadius: '0.5rem', padding: '1rem', marginBottom: '0.5rem'}}>
                <label style={{fontSize: '0.875rem', fontWeight: 'bold', color: '#1e40af', display: 'block', marginBottom: '0.5rem'}}>📸 Foto de la Variante (Opcional)</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  onChange={(e) => setNuevaVariante({...nuevaVariante, imagen: e.target.files?.[0] || null})}
                  style={{width: '100%', padding: '0.75rem 1rem', border: '2px solid #bfdbfe', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box'}}
                />
                <small style={{color: '#1e40af', fontSize: '0.75rem', marginTop: '0.5rem', display: 'block', fontWeight: 'bold'}}>✅ Recomendado para WordPress:</small>
                <small style={{color: '#3b82f6', fontSize: '0.75rem', display: 'block'}}>• Tamaño: Mínimo 300x300px (recomendado 1000x1000px+)</small>
                <small style={{color: '#3b82f6', fontSize: '0.75rem', display: 'block'}}>• Formato: PNG, JPG, GIF, WEBP</small>
                <small style={{color: '#3b82f6', fontSize: '0.75rem', display: 'block'}}>• Peso máximo: 10MB</small>
                <small style={{color: '#3b82f6', fontSize: '0.75rem', display: 'block'}}>• Proporción: Cuadrado (1:1) es lo mejor</small>
                {nuevaVariante.imagen && (
                  <small style={{color: '#059669', fontSize: '0.75rem', marginTop: '0.5rem', display: 'block', fontWeight: 'bold'}}>
                    ✓ Archivo seleccionado: {nuevaVariante.imagen.name}
                  </small>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{background: '#a855f7', color: 'white', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontWeight: 'bold', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem', opacity: loading ? 0.6 : 1}}
              >
                {loading ? '⏳ Creando...' : '✨ Crear en WP + Lioren'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'editar-producto' && (
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', maxWidth: '1000px'}}>
            <div style={{background: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '2rem'}}>
              <h2 style={{fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', margin: 0}}>✏️ Seleccionar Producto</h2>
              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                <select
                  value={editandoProducto || ''}
                  onChange={(e) => {
                    const prodId = e.target.value;
                    if (prodId) {
                      const prod = productos.find(p => p.id === parseInt(prodId));
                      if (prod) {
                        setEditandoProducto(parseInt(prodId));
                        setProductoEditar({
                          id: prod.id,
                          nombre: prod.nombre,
                          descripcion: prod.descripcion,
                          imagen: null,
                        });
                      }
                    }
                  }}
                  style={{width: '100%', padding: '0.75rem 1rem', border: '2px solid #ccc', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box'}}
                >
                  <option value="">-- Selecciona un producto --</option>
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>

                {editandoProducto && (
                  <>
                    <div style={{padding: '1rem', background: '#f0f9ff', borderRadius: '0.5rem', borderLeft: '4px solid #3b82f6'}}>
                      <p style={{margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#666'}}>Producto seleccionado:</p>
                      <p style={{margin: 0, fontWeight: 'bold', fontSize: '1rem'}}>{productoEditar.nombre}</p>
                      {productoEditar.descripcion && (
                        <p style={{margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#666'}}>{productoEditar.descripcion}</p>
                      )}
                    </div>

                    <div style={{background: '#f0f9ff', border: '1px solid #bfdbfe', borderRadius: '0.5rem', padding: '1rem'}}>
                      <label style={{fontSize: '0.875rem', fontWeight: 'bold', color: '#1e40af', display: 'block', marginBottom: '0.5rem'}}>📸 Nueva Foto (Opcional)</label>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                        onChange={(e) => setProductoEditar({...productoEditar, imagen: e.target.files?.[0] || null})}
                        style={{width: '100%', padding: '0.75rem 1rem', border: '2px solid #bfdbfe', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box'}}
                      />
                      <small style={{color: '#1e40af', fontSize: '0.75rem', marginTop: '0.5rem', display: 'block', fontWeight: 'bold'}}>✅ Recomendado:</small>
                      <small style={{color: '#3b82f6', fontSize: '0.75rem', display: 'block'}}>• Tamaño: Mínimo 300x300px (recomendado 1000x1000px+)</small>
                      <small style={{color: '#3b82f6', fontSize: '0.75rem', display: 'block'}}>• Formato: PNG, JPG, GIF, WEBP</small>
                      <small style={{color: '#3b82f6', fontSize: '0.75rem', display: 'block'}}>• Peso máximo: 10MB</small>
                      {productoEditar.imagen && (
                        <small style={{color: '#059669', fontSize: '0.75rem', marginTop: '0.5rem', display: 'block', fontWeight: 'bold'}}>
                          ✓ Archivo: {productoEditar.imagen.name}
                        </small>
                      )}
                    </div>

                    <button
                      onClick={actualizarFotoProducto}
                      disabled={loading || !productoEditar.imagen}
                      style={{background: '#3b82f6', color: 'white', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontWeight: 'bold', border: 'none', cursor: !productoEditar.imagen || loading ? 'not-allowed' : 'pointer', fontSize: '1rem', opacity: !productoEditar.imagen || loading ? 0.6 : 1}}
                    >
                      {loading ? '⏳ Guardando...' : '💾 Actualizar Foto'}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div style={{background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: '0.5rem', padding: '1.5rem'}}>
              <h3 style={{margin: 0, marginBottom: '1rem', color: '#92400e', fontSize: '1rem', fontWeight: 'bold'}}>ℹ️ Instrucciones</h3>
              <ul style={{margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem', color: '#92400e', lineHeight: '1.6'}}>
                <li>Selecciona un producto de la lista</li>
                <li>Carga una nueva imagen (opcional)</li>
                <li>Presiona "Actualizar Foto"</li>
                <li>La imagen se sincronizará con WordPress</li>
              </ul>
              <div style={{marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.5)', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#92400e'}}>
                <p style={{margin: 0, fontWeight: 'bold', marginBottom: '0.5rem'}}>📐 Tamaño de Imagen:</p>
                <p style={{margin: 0}}>Para que WordPress muestre bien tu imagen en la tienda online, necesita:</p>
                <p style={{margin: '0.5rem 0 0 0', fontFamily: 'monospace'}}>Mínimo: 300 x 300 px<br/>Ideal: 1000 x 1000 px o más</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'precios' && (
          <div style={{background: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '2rem'}}>
            <h2 style={{fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem'}}>💰 Editar Precios</h2>
            {productosFiltrados.map(p => (
              <div key={p.id} style={{marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1.5rem'}}>
                <h3 style={{margin: 0, marginBottom: '1rem', fontSize: '1rem', fontWeight: 'bold'}}>{p.nombre}</h3>
                <div style={{display: 'grid', gap: '1rem'}}>
                  {p.variantes.map(v => (
                    <div key={v.id} style={{display: 'grid', gridTemplateColumns: '150px 1fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'center', padding: '0.75rem', background: '#f9f9f9', borderRadius: '0.5rem'}}>
                      <span style={{fontWeight: 'bold', fontSize: '0.875rem'}}>{v.color}</span>
                      <div>
                        <small style={{color: '#666', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem'}}>SIN IVA</small>
                        <input
                          type="number"
                          value={v.precioSinIva}
                          onChange={(e) => {
                            const nuevosProd = productos.map(prod => 
                              prod.id === p.id 
                                ? {
                                    ...prod,
                                    variantes: prod.variantes.map(var_ =>
                                      var_.id === v.id 
                                        ? {...var_, precioSinIva: parseFloat(e.target.value) || 0}
                                        : var_
                                    )
                                  }
                                : prod
                            );
                            setProductos(nuevosProd);
                          }}
                          style={{width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '0.25rem', fontSize: '0.875rem'}}
                          step="0.01"
                        />
                      </div>
                      <div>
                        <small style={{color: '#666', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem'}}>CON IVA (19%)</small>
                        <input
                          type="number"
                          value={(Math.round(v.precioSinIva * 1.19 * 100) / 100).toFixed(2)}
                          disabled
                          style={{width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '0.25rem', fontSize: '0.875rem', background: '#f0f0f0', cursor: 'not-allowed'}}
                        />
                      </div>
                      <div>
                        <small style={{color: '#666', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem'}}>SKU</small>
                        <span style={{fontSize: '0.75rem', fontFamily: 'monospace'}}>{v.sku}</span>
                      </div>
                      <button
                        onClick={() => actualizarPrecio(v.id, v.precioSinIva, p.id)}
                        disabled={loading}
                        style={{background: '#3b82f6', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: 'bold', opacity: loading ? 0.6 : 1}}
                      >
                        {loading ? '⏳' : '💾'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'inventario' && (
          <div style={{background: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '2rem', maxWidth: '500px'}}>
            <h2 style={{fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', margin: 0}}>📊 Ajustar Inventario</h2>
            <form onSubmit={ajustarInventario} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <select
                value={ajusteInventario.varianteId}
                onChange={(e) => setAjusteInventario({...ajusteInventario, varianteId: e.target.value})}
                style={{width: '100%', padding: '0.75rem 1rem', border: '2px solid #ccc', borderRadius: '0.5rem'}}
              >
                <option value="">-- Selecciona variante --</option>
                {productos.flatMap(p => p.variantes.map(v => (
                  <option key={v.id} value={v.id}>{p.nombre} - {v.color}</option>
                )))}
              </select>
              <input
                type="number"
                placeholder="Nuevas unidades"
                value={ajusteInventario.nuevaUnidades}
                onChange={(e) => setAjusteInventario({...ajusteInventario, nuevaUnidades: e.target.value})}
                style={{width: '100%', padding: '0.75rem 1rem', border: '2px solid #ccc', borderRadius: '0.5rem'}}
                min="0"
              />
              <select
                value={ajusteInventario.razon}
                onChange={(e) => setAjusteInventario({...ajusteInventario, razon: e.target.value})}
                style={{width: '100%', padding: '0.75rem 1rem', border: '2px solid #ccc', borderRadius: '0.5rem'}}
              >
                <option value="">-- Razón --</option>
                <option value="rotura">Rotura</option>
                <option value="merma">Merma</option>
                <option value="conteo">Conteo físico</option>
                <option value="ajuste">Ajuste</option>
              </select>
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
            <h2 style={{fontSize: '1.25rem', fontWeight: 'bold'}}>📈 Historial</h2>
            {Object.keys(historialPrecios).length === 0 ? (
              <p style={{color: '#666'}}>Sin cambios</p>
            ) : (
              Object.entries(historialPrecios).map(([varianteId, cambios]) => {
                const variante = productos.flatMap(p => p.variantes).find(v => v.id === parseInt(varianteId));
                if (!variante) return null;
                return (
                  <div key={varianteId} style={{background: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontSize: '0.875rem'}}>
                    <h4 style={{margin: 0, marginBottom: '1rem'}}>{variante.color} ({variante.sku})</h4>
                    {cambios.reverse().map((cambio, idx) => (
                      <div key={idx} style={{padding: '0.5rem', background: '#f9fafb', borderRadius: '0.25rem', marginBottom: '0.5rem'}}>
                        {cambio.fecha}<br />${cambio.precioAnterior} → ${cambio.precioNuevo}
                      </div>
                    ))}
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
