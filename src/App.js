import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [productos, setProductos] = useState([]);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const productosInicial = [
    { id: 1, nombre: 'Lana Merino', variantes: [
        { sku: 'LM-BEIGE-01', color: 'beige', stock: 45, precio: 25000 },
        { sku: 'LM-BLANCO-01', color: 'blanco', stock: 32, precio: 25000 },
        { sku: 'LM-NEGRO-01', color: 'negro', stock: 18, precio: 25000 },
      ]
    },
    { id: 2, nombre: 'Algodón Premium', variantes: [
        { sku: 'AP-ROJO-01', color: 'rojo', stock: 8, precio: 15000 },
        { sku: 'AP-AZUL-01', color: 'azul', stock: 22, precio: 15000 },
      ]
    },
    { id: 3, nombre: 'Tela Poliéster', variantes: [
        { sku: 'TP-VERDE-01', color: 'verde', stock: 3, precio: 12000 },
        { sku: 'TP-GRIS-01', color: 'gris', stock: 55, precio: 12000 },
      ]
    },
  ];

  const COLORES = {
    beige: '#F5E6D3', blanco: '#FFFFFF', negro: '#000000', rojo: '#DC143C',
    azul: '#0066CC', verde: '#228B22', gris: '#808080', rosado: '#FF69B4',
    naranja: '#FF8C00', amarillo: '#FFD700', marron: '#8B4513', purpura: '#800080',
  };

  useEffect(() => { setProductos(productosInicial); }, []);

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

  const exportarCSV = () => {
    let csv = 'Producto,SKU,Color,Stock,Precio\n';
    productos.forEach(p => {
      p.variantes.forEach(v => {
        csv += `${p.nombre},${v.sku},${v.color},${v.stock},${v.precio}\n`;
      });
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventario-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!isLoggedIn) {
    return (
      <div style={{minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'}}>
        <div style={{background: 'white', borderRadius: '1rem', boxShadow: '0 20px 25px rgba(0,0,0,0.3)', padding: '2rem', width: '100%', maxWidth: '400px'}}>
          <div style={{textAlign: 'center', marginBottom: '2rem'}}>
            <div style={{fontSize: '3rem', marginBottom: '1rem'}}>📦</div>
            <h1 style={{fontSize: '2rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #667eea 0%, #ff6b9d 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0}}>La Tijera</h1>
            <p style={{color: '#666', marginTop: '0.5rem', fontSize: '1.1rem'}}>Gestión de Inventario Pro</p>
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
                  placeholder="Ingresa tu contraseña"
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
              style={{background: 'linear-gradient(135deg, #667eea 0%, #ff6b9d 100%)', color: 'white', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '1rem', transition: 'transform 0.2s'}}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              ✨ Ingresar
            </button>
          </form>
          <p style={{textAlign: 'center', fontSize: '0.75rem', color: '#999', marginTop: '1.5rem'}}>Contraseña: latijera2026</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight: '100vh', background: '#f3f4f6'}}>
      <div style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
        <div style={{maxWidth: '80rem', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
            <div style={{fontSize: '2rem'}}>📦</div>
            <h1 style={{fontSize: '1.875rem', fontWeight: 'bold', color: 'white', margin: 0}}>La Tijera</h1>
          </div>
          <button
            onClick={handleLogout}
            style={{display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ef4444', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: '600', border: 'none', cursor: 'pointer'}}
          >
            🚪 Salir
          </button>
        </div>
      </div>

      <div style={{background: 'white', borderBottom: '4px solid #667eea', position: 'sticky', top: 0, zIndex: 10}}>
        <div style={{maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem', display: 'flex', gap: '2rem'}}>
          {[
            { tab: 'dashboard', icon: '📊', label: 'Dashboard' },
            { tab: 'productos', icon: '📦', label: 'Productos' },
            { tab: 'reportes', icon: '📈', label: 'Reportes' }
          ].map(({ tab, icon, label }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{padding: '1rem 1rem', fontWeight: 'bold', borderBottom: activeTab === tab ? '4px solid #667eea' : '4px solid transparent', background: 'none', border: 'none', cursor: 'pointer', color: activeTab === tab ? '#667eea' : '#666', fontSize: '1rem'}}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{maxWidth: '80rem', margin: '0 auto', padding: '2rem 1.5rem'}}>
        {activeTab === 'dashboard' && (
          <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
              <div style={{background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)', borderRadius: '0.5rem', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', padding: '1.5rem', color: 'white'}}>
                <p style={{fontSize: '0.875rem', opacity: 0.9, margin: 0}}>📊 Stock Total</p>
                <p style={{fontSize: '2.25rem', fontWeight: 'bold', marginTop: '0.5rem', margin: '0.5rem 0 0 0'}}>{totalStock}</p>
              </div>
              <div style={{background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', borderRadius: '0.5rem', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', padding: '1.5rem', color: 'white'}}>
                <p style={{fontSize: '0.875rem', opacity: 0.9, margin: 0}}>🏷️ Variantes SKU</p>
                <p style={{fontSize: '2.25rem', fontWeight: 'bold', marginTop: '0.5rem', margin: '0.5rem 0 0 0'}}>{totalVariantes}</p>
              </div>
              <div style={{background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', borderRadius: '0.5rem', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', padding: '1.5rem', color: 'white'}}>
                <p style={{fontSize: '0.875rem', opacity: 0.9, margin: 0}}>⚠️ Stock Crítico (&lt;5)</p>
                <p style={{fontSize: '2.25rem', fontWeight: 'bold', marginTop: '0.5rem', margin: '0.5rem 0 0 0'}}>{stockCritico}</p>
              </div>
              <div style={{background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)', borderRadius: '0.5rem', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', padding: '1.5rem', color: 'white'}}>
                <p style={{fontSize: '0.875rem', opacity: 0.9, margin: 0}}>📦 Productos Base</p>
                <p style={{fontSize: '2.25rem', fontWeight: 'bold', marginTop: '0.5rem', margin: '0.5rem 0 0 0'}}>{productos.length}</p>
              </div>
            </div>

            {productos.filter(p => p.variantes.some(v => v.stock < 5)).length > 0 && (
              <div style={{background: '#fef2f2', border: '4px solid #ef4444', borderRadius: '0.5rem', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', padding: '1.5rem'}}>
                <h2 style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#b91c1c', marginTop: 0}}>🚨 Stock Crítico (&lt;5 unidades)</h2>
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                  {productos.filter(p => p.variantes.some(v => v.stock < 5)).map(p => (
                    <div key={p.id} style={{background: 'white', borderLeft: '4px solid #ef4444', padding: '1rem', borderRadius: '0.25rem'}}>
                      {p.variantes.filter(v => v.stock < 5).map(v => (
                        <div key={v.sku} style={{color: '#7f1d1d', fontWeight: '600'}}>
                          <strong>{p.nombre}</strong> ({v.color}) - SKU: {v.sku} - Stock: {v.stock} ⚠️
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'productos' && (
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <h2 style={{fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1.5rem'}}>📦 Productos</h2>
            {productos.map(producto => (
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
                    <table style={{width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse'}}>
                      <thead style={{background: '#667eea', color: 'white'}}>
                        <tr>
                          <th style={{textAlign: 'left', padding: '0.75rem 0.5rem', fontWeight: 'bold'}}>Color</th>
                          <th style={{textAlign: 'left', padding: '0.75rem 0.5rem', fontWeight: 'bold'}}>SKU</th>
                          <th style={{textAlign: 'center', padding: '0.75rem 0.5rem', fontWeight: 'bold'}}>Stock</th>
                          <th style={{textAlign: 'right', padding: '0.75rem 0.5rem', fontWeight: 'bold'}}>Precio</th>
                          <th style={{textAlign: 'center', padding: '0.75rem 0.5rem', fontWeight: 'bold'}}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {producto.variantes.map(v => (
                          <tr key={v.sku} style={{borderTop: '1px solid #e5e7eb'}}>
                            <td style={{padding: '0.75rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                              <div style={{width: '1.5rem', height: '1.5rem', borderRadius: '50%', border: '2px solid #d1d5db', backgroundColor: COLORES[v.color]}}></div>
                              <span style={{textTransform: 'capitalize', fontWeight: '600'}}>{v.color}</span>
                            </td>
                            <td style={{padding: '0.75rem 0.5rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#666'}}>{v.sku}</td>
                            <td style={{padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 'bold'}}>{v.stock}</td>
                            <td style={{padding: '0.75rem 0.5rem', textAlign: 'right', color: '#16a34a', fontWeight: '600'}}>${v.precio.toLocaleString()}</td>
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

        {activeTab === 'reportes' && (
          <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
            <button
              onClick={exportarCSV}
              style={{background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '1rem', maxWidth: '200px'}}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              ⬇️ Exportar CSV
            </button>
            <div style={{background: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', overflow: 'hidden'}}>
              <table style={{width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse'}}>
                <thead style={{background: '#1f2937', color: 'white'}}>
                  <tr>
                    <th style={{textAlign: 'left', padding: '0.75rem 1.5rem', fontWeight: 'bold'}}>Producto</th>
                    <th style={{textAlign: 'left', padding: '0.75rem 1.5rem', fontWeight: 'bold'}}>SKU</th>
                    <th style={{textAlign: 'left', padding: '0.75rem 1.5rem', fontWeight: 'bold'}}>Color</th>
                    <th style={{textAlign: 'center', padding: '0.75rem 1.5rem', fontWeight: 'bold'}}>Stock</th>
                    <th style={{textAlign: 'right', padding: '0.75rem 1.5rem', fontWeight: 'bold'}}>Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map(p => p.variantes.map(v => (
                    <tr key={v.sku} style={{borderTop: '1px solid #e5e7eb'}}>
                      <td style={{padding: '0.75rem 1.5rem', fontWeight: '600'}}>{p.nombre}</td>
                      <td style={{padding: '0.75rem 1.5rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#666'}}>{v.sku}</td>
                      <td style={{padding: '0.75rem 1.5rem', textTransform: 'capitalize'}}>{v.color}</td>
                      <td style={{padding: '0.75rem 1.5rem', textAlign: 'center', fontWeight: 'bold'}}>{v.stock}</td>
                      <td style={{padding: '0.75rem 1.5rem', textAlign: 'right', color: '#16a34a', fontWeight: 'bold'}}>${(v.stock * v.precio).toLocaleString()}</td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
