import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEmployeesData = async () => {
      try {
        const [empRes, topRes] = await Promise.all([
          api.get('/employees'),
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
    loadEmployeesData();
  }, []);

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px' }}>Employees & KPIs</h1>

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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Employees;
