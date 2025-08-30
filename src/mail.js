export async function sendEmail(env, { title, content }) {
    const mailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.FORM_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: 'Portfolio <notifications@resend.dev>',
            to: 'kunalma23@gmail.com',
            subject: title,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; padding: 24px; text-align: center;">
                    <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 2px 6px rgba(0,0,0,0.05); overflow: hidden;">
                        <div style="background: #4f46e5; color: #fff; padding: 16px 20px;">
                            <h2 style="margin: 0; font-size: 20px; font-weight: 600; text-align: center;">${title}</h2>
                        </div>
                        <div style="padding: 20px; text-align: center;">
                            <p style="margin: 0 0 12px; font-size: 14px; color: #555;">${content}</p>
                        </div>
                        <div style="background: #f3f4f6; padding: 12px 20px; font-size: 12px; color: #888; text-align: center;">
                            This is an automated notification. Please do not reply to this email.
                        </div>
                    </div>
                </div>
            `
        })
    });

    return mailResponse;
}
