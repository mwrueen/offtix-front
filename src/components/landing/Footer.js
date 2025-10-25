import React from 'react';

const Footer = () => {
  return (
    <footer style={{
      backgroundColor: '#1e293b',
      color: 'white',
      padding: '60px 24px 30px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '40px',
          marginBottom: '40px'
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#667eea',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold'
              }}>
                T
              </div>
              <span style={{
                fontSize: '1.5rem',
                fontWeight: '700'
              }}>
                Tabredon
              </span>
            </div>
            <p style={{
              color: '#94a3b8',
              lineHeight: '1.6'
            }}>
              Professional project management made simple. Streamline your workflow and deliver projects on time.
            </p>
          </div>
          
          <div>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: '600',
              marginBottom: '16px'
            }}>
              Product
            </h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              <li style={{ marginBottom: '8px' }}>
                <a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Features</a>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Pricing</a>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Integrations</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: '600',
              marginBottom: '16px'
            }}>
              Company
            </h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              <li style={{ marginBottom: '8px' }}>
                <a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>About</a>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Contact</a>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Privacy</a>
              </li>
            </ul>
          </div>
        </div>
        
        <div style={{
          borderTop: '1px solid #334155',
          paddingTop: '30px',
          textAlign: 'center',
          color: '#94a3b8'
        }}>
          <p style={{ margin: 0 }}>
            © 2024 Tabredon. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;