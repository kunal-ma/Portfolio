function errorResponse(message, code = 500) {
    return new Response(message, {
        status: code,
        headers: { "Content-Type": "text/plain" }
    });
}

export async function onRequest(context) {
    try {
        const { request, env } = context;

        // Whitelisted domains for Function access
        const ALLOWED_ORIGINS = [
            "https://kunalma.pages.dev",
            "https://dev.kunalma.pages.dev"
        ];

        // Error : (403) Unknown origin of request
        const origin = request.headers.get("Origin") || "unknown";
        if (!ALLOWED_ORIGINS.includes(origin)) {
            return errorResponse(`Unknown origin of request. Origin: ${origin}`, 403);
        }

        // Error : (405) POST Requests only
        if (request.method !== "POST") {
            return errorResponse(`Only POST Requests accepted. Method used: ${request.method}`, 405);
        }

        // Generate key for KV pair check
        const ip = request.headers.get("CF-Connecting-IP") || "unknown";
        const today = new Date().toISOString().split("T")[0];
        const key = `${ip}:${today}`;

        // Initialize environment variables
        const KV = env.FORM_KV;

        // KV Read Operation to check value of generated key
        let count = parseInt(await KV.get(key)) || 0;

        // Error : (429) Rate limit exceeded
        if (count >= 3) {
            return errorResponse(`Rate limit has been reached for ${key}`, 429);
        }

        try {
            // Initialize form data into entry variables
            const formData = await request.json();
            const e = formData.email;
            const m = formData.message;

            // Error : (400) Form field length exceeded
            if (e.length > 100 || m.length > 390) {
                return errorResponse(`Form field length exceeded. Length of e: ${e.length}, m: ${m.length}`)
            }

            // Forward form submission data to Resend API
            const mailResponse = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${env.AUTH_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'submission@resend.dev',
                    to: 'kunalma23@gmail.com',
                    subject: 'Portfolio: Form Submission',
                    html: `
                        <div style="font-family: Arial, sans-serif; color: #333; background: #fff; padding: 16px; border-radius: 6px; border: 1px solid #e0e0e0; max-width: 600px; margin: auto;">
                            <h2 style="font-size: 18px; margin-top: 0;">New Form Submission</h2>
                            <p style="margin: 0 0 8px;"><strong>Reference:</strong> <br><code>${key}</code></p>
                            <p style="margin: 0 0 8px;"><strong>Email:</strong> <br>${formData.email}</p>
                            <p style="margin: 0 0 4px;"><strong>Message:</strong></p>
                            <blockquote style="margin: 0; padding: 12px; background: #f9f9f9; border-left: 4px solid #6b86ff;">
                                ${formData.message}
                            </blockquote>
                        </div>
                    `
                })
            })

            // Error : (503) Mail Service unavailable
            if (mailResponse.status !== 200) {
                const error = await mailResponse.json();
                return errorResponse(JSON.stringify(error, null, 2), 503);
            }

            // KV Write Operation to increment value of pair, or create new pair
            await KV.put(key, (count + 1).toString(), {
                expirationTtl: 86400 // 1 day
            });

            // Response : (200) Successful
            return new Response("Success", { status: 200 });
        }
        catch (err) {
            // Error : (502) Request forwarding to API failed
            return errorResponse(err?.message || String(err), 502);
        }
    }
    catch (err) {
        // Error : (501) Worker execution failed
        return errorResponse(err?.message || String(err), 501);
    }
}
