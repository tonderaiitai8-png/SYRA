Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { 
            cartItems, 
            customerInfo,
            successUrl,
            cancelUrl
        } = await req.json();

        console.log('Checkout request received:', { 
            itemsCount: cartItems?.length,
            customerInfo 
        });

        // Validate required parameters
        if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
            throw new Error('Cart items are required');
        }

        if (!customerInfo || !customerInfo.name || !customerInfo.address || !customerInfo.phone) {
            throw new Error('Complete customer information is required');
        }

        if (!successUrl || !cancelUrl) {
            throw new Error('Success and cancel URLs are required');
        }

        // Get environment variables
        const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!stripeSecretKey) {
            console.error('Stripe secret key not found in environment');
            throw new Error('Stripe secret key not configured');
        }

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Calculate total amount
        const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        console.log('Total amount:', totalAmount);

        // Create line items for Stripe
        const lineItems = cartItems.map(item => ({
            price_data: {
                currency: 'gbp',
                product_data: {
                    name: item.name,
                    description: `Quantity: ${item.quantity}`
                },
                unit_amount: Math.round(item.price * 100) // Convert to pence
            },
            quantity: item.quantity
        }));

        // Prepare Stripe checkout session data
        const stripeData = {
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer_email: customerInfo.email && customerInfo.email.trim() ? customerInfo.email : undefined,
            billing_address_collection: 'required',
            metadata: {
                customer_name: customerInfo.name,
                customer_phone: customerInfo.phone,
                delivery_address: JSON.stringify(customerInfo.address),
                delivery_time: customerInfo.deliveryTime || '',
                special_instructions: customerInfo.notes || '',
                total_items: cartItems.reduce((sum, item) => sum + item.quantity, 0).toString()
            }
        };

        console.log('Creating Stripe checkout session...');

        // Create checkout session with Stripe
        const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${stripeSecretKey}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams(Object.entries({
                'mode': stripeData.mode,
                'success_url': stripeData.success_url,
                'cancel_url': stripeData.cancel_url,
                ...(stripeData.customer_email && { 'customer_email': stripeData.customer_email }),
                'billing_address_collection': stripeData.billing_address_collection,
                ...stripeData.line_items.reduce((acc, item, idx) => {
                    acc[`line_items[${idx}][price_data][currency]`] = item.price_data.currency;
                    acc[`line_items[${idx}][price_data][product_data][name]`] = item.price_data.product_data.name;
                    acc[`line_items[${idx}][price_data][product_data][description]`] = item.price_data.product_data.description;
                    acc[`line_items[${idx}][price_data][unit_amount]`] = item.price_data.unit_amount.toString();
                    acc[`line_items[${idx}][quantity]`] = item.quantity.toString();
                    return acc;
                }, {}),
                ...Object.entries(stripeData.metadata).reduce((acc, [key, value]) => {
                    acc[`metadata[${key}]`] = value;
                    return acc;
                }, {}),
                'payment_method_types[0]': 'card'
            })).toString()
        });

        console.log('Stripe API response status:', stripeResponse.status);

        if (!stripeResponse.ok) {
            const errorData = await stripeResponse.text();
            console.error('Stripe API error:', errorData);
            throw new Error(`Stripe API error: ${errorData}`);
        }

        const session = await stripeResponse.json();
        console.log('Checkout session created successfully:', session.id);

        // Create order record in database
        const orderData = {
            stripe_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent || null,
            status: 'pending',
            total_amount: totalAmount,
            currency: 'gbp',
            customer_name: customerInfo.name,
            customer_email: customerInfo.email || null,
            customer_phone: customerInfo.phone,
            delivery_address: customerInfo.address,
            delivery_time: customerInfo.deliveryTime || null,
            special_instructions: customerInfo.notes || null,
            cart_items: cartItems,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        console.log('Creating order in database...');

        const orderResponse = await fetch(`${supabaseUrl}/rest/v1/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(orderData)
        });

        if (!orderResponse.ok) {
            const errorText = await orderResponse.text();
            console.error('Failed to create order:', errorText);
            throw new Error(`Failed to create order: ${errorText}`);
        }

        const order = await orderResponse.json();
        const orderId = order[0].id;
        console.log('Order created successfully:', orderId);

        // Create order items
        const orderItems = cartItems.map(item => ({
            order_id: orderId,
            item_id: item.id,
            item_name: item.name,
            quantity: item.quantity,
            price: item.price,
            created_at: new Date().toISOString()
        }));

        console.log('Creating order items...');

        const orderItemsResponse = await fetch(`${supabaseUrl}/rest/v1/order_items`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderItems)
        });

        if (!orderItemsResponse.ok) {
            const errorText = await orderItemsResponse.text();
            console.error('Failed to create order items:', errorText);
            console.warn('Order created but order items creation failed');
        } else {
            console.log('Order items created successfully');
        }

        const result = {
            data: {
                checkoutUrl: session.url,
                sessionId: session.id,
                orderId: orderId,
                totalAmount: totalAmount,
                currency: 'gbp'
            }
        };

        console.log('Checkout session creation completed successfully');

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Checkout session creation error:', error);

        const errorResponse = {
            error: {
                code: 'CHECKOUT_SESSION_FAILED',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
