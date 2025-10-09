'use client';

import React from 'react';
import Logo from './Logo';

/**
 * Example component showing different Logo configurations
 * This can be used for testing and demonstration purposes
 */
const LogoExample: React.FC = () => {
  return (
    <div style={{ padding: '2rem', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: '2rem', color: '#1f2937' }}>TravelSelBuy Logo Examples</h1>
      
      {/* Light variant examples */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem', color: '#374151' }}>Light Variant (for dark backgrounds)</h2>
        <div style={{ 
          backgroundColor: '#1f2937', 
          padding: '2rem', 
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div>
            <p style={{ color: '#d1d5db', marginBottom: '0.5rem' }}>Small:</p>
            <Logo variant="light" size="sm" />
          </div>
          <div>
            <p style={{ color: '#d1d5db', marginBottom: '0.5rem' }}>Medium:</p>
            <Logo variant="light" size="md" />
          </div>
          <div>
            <p style={{ color: '#d1d5db', marginBottom: '0.5rem' }}>Large:</p>
            <Logo variant="light" size="lg" />
          </div>
          <div>
            <p style={{ color: '#d1d5db', marginBottom: '0.5rem' }}>Extra Large:</p>
            <Logo variant="light" size="xl" />
          </div>
        </div>
      </section>

      {/* Dark variant examples */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem', color: '#374151' }}>Dark Variant (for light backgrounds)</h2>
        <div style={{ 
          backgroundColor: '#ffffff', 
          padding: '2rem', 
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div>
            <p style={{ color: '#374151', marginBottom: '0.5rem' }}>Small:</p>
            <Logo variant="dark" size="sm" />
          </div>
          <div>
            <p style={{ color: '#374151', marginBottom: '0.5rem' }}>Medium:</p>
            <Logo variant="dark" size="md" />
          </div>
          <div>
            <p style={{ color: '#374151', marginBottom: '0.5rem' }}>Large:</p>
            <Logo variant="dark" size="lg" />
          </div>
          <div>
            <p style={{ color: '#374151', marginBottom: '0.5rem' }}>Extra Large:</p>
            <Logo variant="dark" size="xl" />
          </div>
        </div>
      </section>

      {/* With tagline examples */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem', color: '#374151' }}>With Tagline</h2>
        <div style={{ 
          backgroundColor: '#ffffff', 
          padding: '2rem', 
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div>
            <p style={{ color: '#374151', marginBottom: '0.5rem' }}>Medium with tagline:</p>
            <Logo variant="dark" size="md" showTagline={true} />
          </div>
          <div>
            <p style={{ color: '#374151', marginBottom: '0.5rem' }}>Large with tagline:</p>
            <Logo variant="dark" size="lg" showTagline={true} />
          </div>
        </div>
      </section>

      {/* Usage examples */}
      <section>
        <h2 style={{ marginBottom: '1rem', color: '#374151' }}>Usage Examples</h2>
        <div style={{ 
          backgroundColor: '#f3f4f6', 
          padding: '1.5rem', 
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '14px',
          lineHeight: '1.6'
        }}>
          <pre style={{ margin: 0, color: '#374151' }}>
{`// Basic usage
<Logo />

// With custom props
<Logo 
  variant="light" 
  size="lg" 
  showTagline={true} 
  className="my-custom-class" 
/>

// For header/navigation
<Logo variant="dark" size="md" />

// For hero sections
<Logo variant="light" size="xl" showTagline={true} />`}
          </pre>
        </div>
      </section>
    </div>
  );
};

export default LogoExample;
