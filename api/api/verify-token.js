const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { access_token, user_email } = req.body;

  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('access_token', access_token)
      .eq('user_email', user_email)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return res.status(401).json({ 
        verified: false, 
        message: 'Invalid or expired access token' 
      });
    }

    return res.json({ 
      verified: true, 
      business_data: {
        business_name: data.business_name,
        agent_type: data.agent_type,
        target_audience: data.target_audience
      }
    });

  } catch (error) {
    return res.status(500).json({ error: 'Verification failed' });
  }
}
