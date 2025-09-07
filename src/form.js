import { sendEmail } from "./mail.js";

function errorResponse(message, code = 500) {
    return new Response(message, {
        status: code,
        headers: { "Content-Type": "text/plain" }
    });
}

export async function formSubmit(request, env) {
    try {
        // Whitelisted domains for Function access
        const ALLOWED_ORIGINS = [
            // "http://127.0.0.1:8787",
            "https://kunalma.com",
            /^https:\/\/[a-z0-9-]+-kunalma\.kunalma\.workers\.dev$/
        ];

        // Error : (403) Unknown origin of request
        const origin = request.headers.get("Origin") || "unknown";
        if (!ALLOWED_ORIGINS.some(o =>
            (typeof o === "string" && o === origin) ||
            (o instanceof RegExp && o.test(origin)))) {
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
        const KV = env.PORT_KV;

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
                return errorResponse(`Form field length exceeded. Length of e: ${e.length}, m: ${m.length}`, 400);
            }

            // Forward form submission data to Resend API
            const mailResponse = await sendEmail(env, {
                title: "New Form Submission",
                content: `
                    <p><strong>Reference:</strong> <br><code>${key}</code></p>
                    <p><strong>Email:</strong> <br>${formData.email}</p>
                    <p><strong>Message:</strong></p>
                    <blockquote style="margin: 0; padding: 12px; background: #f9f9f9; border-left: 4px solid #6b86ff;">
                        ${formData.message}
                    </blockquote>
                `
            });

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
