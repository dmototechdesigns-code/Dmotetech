// Migration script: backfill variant_label for orders.cart_data
// Usage: run with Node or paste into browser console (with Supabase client available)

const SUPABASE_URL = 'https://ycipxljvymewdltlblvn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaXB4bGp2eW1ld2RsdGxibHZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNzA5MzksImV4cCI6MjA5Nzk0NjkzOX0.dleDKMUuavLtA_pPKicnBexgGb4SqOGM7oU7QoEBm9I';

(async () => {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Fetch orders which have cart_data array but missing variant_label in first item
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, cart_data')
      .is('cart_data', null)
      .neq('cart_data', '[]')
      .limit(1000);

    if (error) throw error;

    const updates = [];

    for (const ord of orders) {
      let changed = false;
      const cart = Array.isArray(ord.cart_data) ? ord.cart_data : [];
      const newCart = cart.map(item => {
        const variantLabel = item.variant_label || item.variant || item.option || item.size || '';
        if (!item.variant_label && variantLabel) changed = true;
        return Object.assign({}, item, { variant_label: variantLabel });
      });
      if (changed) {
        updates.push({ id: ord.id, cart_data: newCart });
      }
    }

    for (const up of updates) {
      const { error: upErr } = await supabase
        .from('orders')
        .update({ cart_data: up.cart_data })
        .eq('id', up.id);
      if (upErr) console.error('Update failed for order', up.id, upErr);
      else console.log('Updated order', up.id);
    }

    console.log('Migration complete. Updated', updates.length, 'orders.');
  } catch (err) {
    console.error('Migration error:', err.message || err);
  }
})();
