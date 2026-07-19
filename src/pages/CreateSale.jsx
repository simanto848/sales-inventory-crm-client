import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const CreateSale = () => {
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  
  const [cart, setCart] = useState([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(15);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [branchRes, custRes, prodRes] = await Promise.all([
          api.get('/branches'),
          api.get('/customers'),
          api.get('/products?per_page=100'),
        ]);

        setBranches(branchRes.data.data.data || branchRes.data.data || []);
        setCustomers(custRes.data.data.data || custRes.data.data || []);
        setProducts(prodRes.data.data.data || prodRes.data.data || []);
      } catch (err) {
        console.error('Error loading checkout master data:', err);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!searchProductQuery) {
      setFilteredProducts([]);
      return;
    }

    const matches = products.filter(p => 
      p.name.toLowerCase().includes(searchProductQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchProductQuery.toLowerCase())
    );
    setFilteredProducts(matches.slice(0, 5));
  }, [searchProductQuery, products]);

  const handleBranchChange = (e) => {
    const bId = e.target.value;
    setSelectedBranchId(bId);
    setCart([]);
  };

  const getBranchStock = (product, branchId) => {
    if (!branchId) return 0;
    const branchStockObj = (product.branches || []).find(b => b.id === parseInt(branchId));
    return branchStockObj ? branchStockObj.pivot?.stock_quantity : 0;
  };

  const handleAddToCart = (product) => {
    if (!selectedBranchId) {
      alert('Please select a branch first.');
      return;
    }

    const stock = getBranchStock(product, selectedBranchId);
    if (stock <= 0) {
      alert('This product is out of stock at the selected branch.');
      return;
    }

    const existingCartItem = cart.find(item => item.product.id === product.id);
    if (existingCartItem) {
      if (existingCartItem.quantity >= stock) {
        alert(`Cannot add more. Only ${stock} items available in stock at this branch.`);
        return;
      }
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }

    setSearchProductQuery('');
  };

  const handleQtyChange = (productId, qtyVal) => {
    const quantity = parseInt(qtyVal);
    if (isNaN(quantity) || quantity <= 0) return;

    const cartItem = cart.find(item => item.product.id === productId);
    const stock = getBranchStock(cartItem.product, selectedBranchId);

    if (quantity > stock) {
      alert(`Insufficient stock. Only ${stock} items available.`);
      return;
    }

    setCart(cart.map(item => 
      item.product.id === productId ? { ...item, quantity } : item
    ));
  };

  const handleRemoveFromCart = (productId) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0);
  };

  const subtotal = calculateSubtotal();
  const discountAmount = subtotal * (discountPercent / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (taxPercent / 100);
  const total = taxableAmount + taxAmount;

  const handleSubmitCheckout = async () => {
    if (!selectedBranchId) {
      alert('Please select a branch.');
      return;
    }
    if (!selectedCustomerId) {
      alert('Please select a customer.');
      return;
    }
    if (cart.length === 0) {
      alert('Your cart is empty.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        branch_id: parseInt(selectedBranchId),
        customer_id: parseInt(selectedCustomerId),
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        discount_amount: parseFloat(discountAmount.toFixed(2)),
        tax_amount: parseFloat(taxAmount.toFixed(2)),
      };

      const res = await api.post('/sales', payload);
      if (res.data.success) {
        alert('Sale completed successfully! An HTML invoice has been automatically generated and sent to the customer.');
        navigate('/sales');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error executing checkout transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px' }}>Record New Sale</h1>

      <div className="checkout-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '16px' }}>1. Sale Parameters</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Branch Location</label>
                <select 
                  className="form-control"
                  value={selectedBranchId}
                  onChange={handleBranchChange}
                >
                  <option value="">-- Select Store Branch --</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <span style={{ fontSize: '11px', color: 'var(--text)' }}>
                  Changing branch will empty the cart since stock levels vary by branch.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Customer CRM Record</label>
                <select 
                  className="form-control"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                >
                  <option value="">-- Associate Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '16px' }}>2. Add Products</h3>
            <div className="form-group" style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search products by SKU or Name..."
                value={searchProductQuery}
                onChange={(e) => setSearchProductQuery(e.target.value)}
                disabled={!selectedBranchId}
              />
              {!selectedBranchId && (
                <span style={{ fontSize: '12px', color: 'var(--danger)' }}>
                  Please choose a branch location to unlock product search.
                </span>
              )}

              {filteredProducts.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: 'var(--panel-bg)', border: '1px solid var(--border)', borderRadius: '8px', zIndex: 5, boxShadow: 'var(--shadow-lg)', marginTop: '4px' }}>
                  {filteredProducts.map(product => {
                    const stock = getBranchStock(product, selectedBranchId);
                    return (
                      <div 
                        key={product.id} 
                        onClick={() => handleAddToCart(product)}
                        style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                      >
                        <div>
                          <strong>{product.name}</strong> <code style={{ fontSize: '12px' }}>{product.sku}</code>
                        </div>
                        <div>
                          <span>${parseFloat(product.price).toFixed(2)}</span>
                          <span 
                            className={`badge ${stock <= 5 ? 'badge-danger' : 'badge-success'}`}
                            style={{ marginLeft: '10px' }}
                          >
                            {stock} available
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <h4 style={{ color: 'var(--text-h)', margin: '20px 0 10px' }}>Cart Items</h4>
            {cart.length === 0 ? (
              <p style={{ color: 'var(--text)', fontStyle: 'italic' }}>Cart is currently empty. Add products above.</p>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Total</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map(item => (
                      <tr key={item.product.id}>
                        <td>{item.product.name}</td>
                        <td><code>{item.product.sku}</code></td>
                        <td>${parseFloat(item.product.price).toFixed(2)}</td>
                        <td>
                          <input
                            type="number"
                            className="cart-qty-input"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleQtyChange(item.product.id, e.target.value)}
                          />
                        </td>
                        <td>${(parseFloat(item.product.price) * item.quantity).toFixed(2)}</td>
                        <td>
                          <button 
                            onClick={() => handleRemoveFromCart(item.product.id)}
                            className="btn btn-danger"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ position: 'sticky', top: '24px' }}>
          <h3 className="card-title" style={{ marginBottom: '20px' }}>Order Summary</h3>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          <div className="form-group" style={{ margin: '16px 0' }}>
            <label className="form-label" style={{ fontSize: '13px' }}>Discount (%)</label>
            <input
              type="number"
              className="form-control"
              min="0"
              max="100"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
            />
          </div>

          <div className="summary-row">
            <span>Discount Amount</span>
            <span style={{ color: 'var(--danger)' }}>-${discountAmount.toFixed(2)}</span>
          </div>

          <div className="form-group" style={{ margin: '16px 0' }}>
            <label className="form-label" style={{ fontSize: '13px' }}>Tax / VAT (%)</label>
            <input
              type="number"
              className="form-control"
              min="0"
              value={taxPercent}
              onChange={(e) => setTaxPercent(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>

          <div className="summary-row">
            <span>Tax Amount ({taxPercent}%)</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>

          <div className="summary-row summary-total">
            <span>Order Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <button
            onClick={handleSubmitCheckout}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '24px', fontSize: '16px' }}
            disabled={submitting || cart.length === 0}
          >
            {submitting ? 'Processing Transaction...' : 'Complete Checkout'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateSale;
