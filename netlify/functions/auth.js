// Example Netlify Function for Authentication
// This would handle login/register API calls

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { method, path } = event;
    const body = event.body ? JSON.parse(event.body) : {};

    switch (path) {
      case '/api/auth/login':
        if (method === 'POST') {
          const { email, password } = body;
          
          // Handle login logic
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: error.message }),
            };
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ user: data.user }),
          };
        }
        break;

      case '/api/auth/register':
        if (method === 'POST') {
          const { email, password, userData } = body;
          
          // Handle registration logic
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: userData,
            },
          });

          if (error) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: error.message }),
            };
          }

          return {
            statusCode: 201,
            headers,
            body: JSON.stringify({ user: data.user }),
          };
        }
        break;

      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Not found' }),
        };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
