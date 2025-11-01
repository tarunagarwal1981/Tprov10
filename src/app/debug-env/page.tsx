"use client";

/**
 * DEBUG PAGE - Environment Variables Check
 * Access at: /debug-env
 * 
 * This page helps verify that environment variables are properly
 * loaded in the Netlify deployment.
 * 
 * DELETE THIS FILE after debugging is complete!
 */

export default function DebugEnvPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'monospace',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1 style={{ marginBottom: '20px', color: '#333' }}>
        🔍 Environment Variables Debug
      </h1>
      
      <div style={{ 
        background: '#f5f5f5', 
        padding: '20px', 
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        <h2 style={{ marginTop: 0 }}>Client-Side Environment Variables:</h2>
        
        <div style={{ marginBottom: '15px' }}>
          <strong>NEXT_PUBLIC_SUPABASE_URL:</strong>
          <div style={{ 
            marginTop: '5px',
            padding: '10px',
            background: supabaseUrl ? '#d4edda' : '#f8d7da',
            borderRadius: '4px',
            color: supabaseUrl ? '#155724' : '#721c24'
          }}>
            {supabaseUrl || '❌ NOT SET'}
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong>
          <div style={{ 
            marginTop: '5px',
            padding: '10px',
            background: hasAnonKey ? '#d4edda' : '#f8d7da',
            borderRadius: '4px',
            color: hasAnonKey ? '#155724' : '#721c24'
          }}>
            {hasAnonKey ? '✅ SET (hidden for security)' : '❌ NOT SET'}
          </div>
        </div>

        <div style={{ 
          marginTop: '20px',
          padding: '15px',
          background: '#fff3cd',
          borderRadius: '4px',
          border: '1px solid #ffeaa7'
        }}>
          <strong>⚠️ Status:</strong>
          <p style={{ margin: '10px 0 0 0' }}>
            {supabaseUrl && hasAnonKey 
              ? '✅ Environment variables are loaded correctly!' 
              : '❌ Environment variables are missing. Check Netlify configuration.'}
          </p>
        </div>
      </div>

      <div style={{ 
        marginTop: '30px',
        padding: '20px',
        background: '#e7f3ff',
        borderRadius: '8px',
        border: '1px solid #b3d9ff'
      }}>
        <h3 style={{ marginTop: 0 }}>How to Fix:</h3>
        <ol style={{ paddingLeft: '20px' }}>
          <li>Go to Netlify Dashboard → Site Settings → Environment Variables</li>
          <li>Add: <code>NEXT_PUBLIC_SUPABASE_URL</code> = <code>https://megmjzszmqnmzdxwzigt.supabase.co</code></li>
          <li>Add: <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> = (your anon key)</li>
          <li>Set scopes to: All (Production, Deploy Previews, Branch deploys)</li>
          <li>Trigger a new deployment</li>
          <li>Refresh this page</li>
        </ol>
      </div>

      <div style={{ 
        marginTop: '20px',
        padding: '15px',
        background: '#fff',
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        <strong>🗑️ Remember:</strong>
        <p style={{ margin: '10px 0 0 0' }}>
          Delete this file (<code>src/app/debug-env/page.tsx</code>) after debugging!
        </p>
      </div>
    </div>
  );
}


