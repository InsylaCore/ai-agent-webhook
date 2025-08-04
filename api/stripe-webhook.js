const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.supabaseUrl,
  process.env.SUPABASE_SERVICE_KEY || process.env.supabaseServiceKey
);

function generateAccessToken() {
 return 'access_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export default async function handler(req, res) {
 const sig = req.headers['stripe-signature'];
 let event;

 try {
   event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
 } catch (err) {
   return res.status(400).send(`Webhook Error: ${err.message}`);
 }

 if (event.type === 'checkout.session.completed') {
   const session = event.data.object;
   const customerEmail = session.customer_details.email;
   const paymentIntentId = session.payment_intent;
   const metadata = session.metadata || {};
   const accessToken = generateAccessToken();
   
   try {
     const { data, error } = await supabase
       .from('payments')
       .insert([{
         stripe_payment_id: paymentIntentId,
         user_email: customerEmail,
         business_name: metadata.business_name || '',
         agent_type: metadata.agent_type || '',
         target_audience: metadata.target_audience || '',
         access_token: accessToken,
         payment_amount: session.amount_total
       }]);

     if (error) throw error;
     
   } catch (error) {
     console.error('Database error:', error);
     return res.status(500).json({ error: 'Database operation failed' });
   }
 }

 res.json({ received: true });
}
