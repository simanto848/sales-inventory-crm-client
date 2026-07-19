import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../utils/api';

const Employees = () => {
  const { toast, confirm } = useToast();
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & form state
  const [showRegModal, setShowRegModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [regLoading, setRegLoading] = useState(false);

  const isAdmin = user?.role === 'admin';

  const loadEmployeesData = async () => {
    setLoading(true);
    try {
      const [empRes, topRes] = await Promise.all([
        api.get('/employees?per_page=100'),
        api.get('/employees/top-performers'),
      ]);

      setEmployees(empRes.data.data.data || empRes.data.data || []);
      setTopPerformers(topRes.data.data || []);
    } catch (err) {
      console.error('Error fetching employee KPI records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployeesData();
  }, []);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegLoading(true);
    try {
      const res = await api.post('/employees', formData);
      if (res.data.success) {
        toast('Employee registered successfully.', 'success');
        setShowRegModal(false);
        setFormData({ name: '', email: '', password: '', password_confirmation: '' });
        loadEmployeesData();
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Error registering employee.', 'error');
    } finally {
      setRegLoading(false);
    }
  };

  const handleDeleteEmployee = async (employee) => {
    const isConfirmed = await confirm(`Are you sure you want to remove employee ${employee.name}?`, 'Remove Employee');
    if (!isConfirmed) return;
    try {
      const res = await api.delete(`/employees/${employee.id}`);
      if (res.data.success) {
        toast('Employee deleted successfully.', 'success');
        loadEmployeesData();
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to delete employee.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '28px' }}>Employees & KPIs</h1>
        {isAdmin && (
          <button onClick={() => setShowRegModal(true)} className="btn btn-primary">
            + Register Employee
          </button>
        )}
      </div>

      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05), rgba(139, 92, 246, 0.05))', border: '1px solid var(--primary)', marginBottom: '32px' }}>
        <h3 className="card-title" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🏆</span> Top Performers Leaderboard
        </h3>
        <p style={{ fontSize: '14px', margin: '6px 0 20px', color: 'var(--text)' }}>
          Employees with the highest sales performance and inactive customer conversions.
        </p>

        {topPerformers.length === 0 ? (
          <p style={{ fontStyle: 'italic', color: 'var(--text)' }}>Leaderboard empty. Complete sales to assign KPIs!</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {topPerformers.map((emp, index) => (
              <div key={emp.id} className="stat-card" style={{ position: 'relative', border: '1px solid var(--border)', background: 'var(--panel-bg)' }}>
                <span style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '20px' }}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </span>
                <div style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--text-h)', marginBottom: '4px' }}>
                  {emp.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text)', textTransform: 'capitalize', marginBottom: '12px' }}>
                  {emp.role}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px' }}>KPI Score:</span>
                  <span className="badge badge-success" style={{ fontSize: '14px', padding: '4px 10px' }}>
                    {emp.kpi_score || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '20px' }}>Organization Roster</h3>
        
        {employees.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '20px' }}>No employee listings found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>KPI Score</th>
                  <th>Performance Tier</th>
                  {isAdmin && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => {
                  const isTop = topPerformers.some(top => top.id === emp.id);
                  const score = emp.kpi_score || 0;
                  
                  return (
                    <tr key={emp.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-h)' }}>
                        {emp.name} {isTop && <span style={{ cursor: 'help' }} title="Top Performer">⭐</span>}
                      </td>
                      <td>{emp.email}</td>
                      <td>
                        <span className={`badge ${emp.role === 'admin' ? 'badge-info' : 'badge-secondary'}`}>
                          {emp.role}
                        </span>
                      </td>
                      <td style={{ fontWeight: 'bold' }}>{score}</td>
                      <td>
                        {score >= 50 ? (
                          <span className="badge badge-success">Elite</span>
                        ) : score >= 20 ? (
                          <span className="badge badge-info">Standard</span>
                        ) : (
                          <span className="badge badge-warning">Probation</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td>
                          {emp.role !== 'admin' && (
                            <button
                              onClick={() => handleDeleteEmployee(emp)}
                              className="btn btn-danger"
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Modal */}
      {showRegModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '90%', maxWidth: '500px', background: 'var(--panel-bg)' }}>
            <div className="card-header">
              <h3 className="card-title">Register Employee User</h3>
              <button onClick={() => setShowRegModal(false)} className="btn btn-secondary" style={{ padding: '6px 12px' }}>Cancel</button>
            </div>
            <form onSubmit={handleRegisterSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={formData.password_confirmation}
                  onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={regLoading}
              >
                {regLoading ? 'Registering...' : 'Register User'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
