import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../utils/api';

const Products = () => {
  const { toast, confirm } = useToast();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
  });

  // Modal forms state
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [formData, setFormData] = useState({ name: '', sku: '', price: '' });
  const [modalLoading, setModalLoading] = useState(false);

  const fetchProducts = async (page = 1, query = '') => {
    setLoading(true);
    try {
      let url = query ? `/products/search?q=${encodeURIComponent(query)}&page=${page}` : `/products?page=${page}`;
      const response = await api.get(url);
      if (response.data && response.data.success) {
        setProducts(response.data.data.data);
        setPagination({
          current_page: response.data.data.current_page,
          last_page: response.data.data.last_page,
        });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async () => {
    try {
      const branchRes = await api.get('/branches');
      if (branchRes.data && branchRes.data.success) {
        setBranches(branchRes.data.data.data || branchRes.data.data);
      }
    } catch (err) {
      console.error('Error loading branches:', err);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      await loadBranches();
      fetchProducts(1);
    };
    loadInitialData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts(1, searchQuery);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val === '') {
      fetchProducts(1, '');
    }
  };

  const changePage = (page) => {
    if (page >= 1 && page <= pagination.last_page) {
      fetchProducts(page, searchQuery);
    }
  };

  const openAddModal = () => {
    setEditProduct(null);
    setFormData({ name: '', sku: '', price: '' });
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditProduct(product);
    setFormData({ name: product.name, sku: product.sku, price: product.price });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      if (editProduct) {
        // Update product
        const res = await api.put(`/products/${editProduct.id}`, formData);
        if (res.data.success) {
          toast('Product updated successfully.', 'success');
          setShowModal(false);
          fetchProducts(pagination.current_page, searchQuery);
        }
      } else {
        // Create product
        const res = await api.post('/products', formData);
        if (res.data.success) {
          toast('Product created successfully.', 'success');
          setShowModal(false);
          fetchProducts(1, searchQuery);
        }
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Error processing product request.', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteProduct = async (product) => {
    const isConfirmed = await confirm(`Are you sure you want to delete ${product.name}?`, 'Delete Product');
    if (!isConfirmed) return;
    try {
      const res = await api.delete(`/products/${product.id}`);
      if (res.data.success) {
        toast('Product deleted successfully.', 'success');
        fetchProducts(pagination.current_page, searchQuery);
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to delete product.', 'error');
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div>
      <div className="card-header">
        <h1 style={{ margin: 0, fontSize: '28px' }}>Inventory Catalog</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, SKU..."
              value={searchQuery}
              onChange={handleSearchChange}
              style={{ width: '260px' }}
            />
            <button type="submit" className="btn btn-primary">Search</button>
          </form>
          {isAdmin && (
            <button onClick={openAddModal} className="btn btn-primary">
              + Add Product
            </button>
          )}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loader-container">
            <div className="loader"></div>
          </div>
        ) : products.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px' }}>No products found in catalog.</p>
        ) : (
          <div>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Product Name</th>
                    <th>Price</th>
                    {branches.map(branch => (
                      <th key={branch.id}>{branch.name} Stock</th>
                    ))}
                    <th>Total Available</th>
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => {
                    const totalStock = (product.branches || []).reduce(
                      (acc, b) => acc + (b.pivot?.stock_quantity || 0), 0
                    );

                    return (
                      <tr key={product.id}>
                        <td><code>{product.sku}</code></td>
                        <td style={{ fontWeight: 600, color: 'var(--text-h)' }}>{product.name}</td>
                        <td>${parseFloat(product.price).toFixed(2)}</td>
                        {branches.map(branch => {
                          const branchStockObj = (product.branches || []).find(b => b.id === branch.id);
                          const quantity = branchStockObj ? branchStockObj.pivot?.stock_quantity : 0;
                          return (
                            <td key={branch.id}>
                              <span className={`badge ${quantity <= 5 ? 'badge-danger' : quantity <= 15 ? 'badge-warning' : 'badge-success'}`}>
                                {quantity}
                              </span>
                            </td>
                          );
                        })}
                        <td style={{ fontWeight: 'bold' }}>
                          <span className={`badge ${totalStock <= 15 ? 'badge-danger' : 'badge-info'}`}>
                            {totalStock}
                          </span>
                        </td>
                        {isAdmin && (
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                onClick={() => openEditModal(product)} 
                                className="btn btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteProduct(product)} 
                                className="btn btn-danger"
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pagination.last_page > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
                <button
                  onClick={() => changePage(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px' }}
                >
                  Previous
                </button>
                <span style={{ alignSelf: 'center', fontSize: '14px' }}>
                  Page {pagination.current_page} of {pagination.last_page}
                </span>
                <button
                  onClick={() => changePage(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '90%', maxWidth: '500px', background: 'var(--panel-bg)' }}>
            <div className="card-header">
              <h3 className="card-title">{editProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ padding: '6px 12px' }}>Cancel</button>
            </div>
            
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">SKU</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={modalLoading}
              >
                {modalLoading ? 'Saving...' : 'Save Product'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
