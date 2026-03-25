import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VIPEmailPayload {
  customer_id: string;
  customer_name: string;
  customer_email: string;
  discount_code: string;
  discount_code_id: string;
}

const EMAIL_MODE = "simulation";

const generateEmailHTML = (customerName: string, discountCode: string): string => {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¡Llegaste a tu décima cosecha! 🌿</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #0f172a;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #0f172a;
      padding: 0;
    }
    .header {
      background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%);
      padding: 40px 20px;
      text-align: center;
      border-radius: 0;
    }
    .logo {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      background-color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
    }
    .header-title {
      color: white;
      font-size: 32px;
      font-weight: bold;
      margin: 0;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    .content {
      background-color: #1e293b;
      padding: 40px 30px;
      color: #e2e8f0;
    }
    .greeting {
      font-size: 24px;
      font-weight: bold;
      color: #84cc16;
      margin-bottom: 20px;
    }
    .message {
      font-size: 16px;
      line-height: 1.8;
      color: #cbd5e1;
      margin-bottom: 30px;
    }
    .code-container {
      background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%);
      border-radius: 12px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
      box-shadow: 0 10px 30px rgba(132, 204, 22, 0.3);
    }
    .code-label {
      color: white;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }
    .code {
      font-size: 32px;
      font-weight: bold;
      color: white;
      letter-spacing: 3px;
      font-family: 'Courier New', monospace;
      padding: 15px;
      background-color: rgba(0,0,0,0.2);
      border-radius: 8px;
      display: inline-block;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%);
      color: white;
      text-decoration: none;
      padding: 18px 50px;
      border-radius: 50px;
      font-size: 18px;
      font-weight: bold;
      margin: 20px 0;
      box-shadow: 0 8px 20px rgba(132, 204, 22, 0.4);
      transition: transform 0.3s ease;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 25px rgba(132, 204, 22, 0.5);
    }
    .benefits {
      background-color: #0f172a;
      border: 2px solid #84cc16;
      border-radius: 12px;
      padding: 25px;
      margin: 30px 0;
    }
    .benefit-item {
      display: flex;
      align-items: start;
      margin-bottom: 15px;
      color: #cbd5e1;
    }
    .benefit-icon {
      font-size: 24px;
      margin-right: 15px;
      color: #84cc16;
    }
    .footer {
      background-color: #0f172a;
      padding: 30px;
      text-align: center;
      color: #64748b;
      font-size: 14px;
      border-top: 1px solid #334155;
    }
    .footer a {
      color: #84cc16;
      text-decoration: none;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-links a {
      color: #84cc16;
      margin: 0 10px;
      font-size: 24px;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🌿</div>
      <h1 class="header-title">¡Llegaste a tu décima cosecha! 🌿</h1>
    </div>

    <div class="content">
      <div class="greeting">¡Hola, ${customerName}!</div>

      <div class="message">
        <p>Tu fidelidad hace crecer nuestra comunidad. Desde Cuida Tu Planta queremos agradecerte por ser parte de nuestra familia verde.</p>

        <p>Has alcanzado un hito muy especial: <strong style="color: #84cc16;">¡Tu décimo pedido!</strong> 🎉</p>

        <p>Como muestra de nuestro agradecimiento, te regalamos un descuento exclusivo del <strong style="color: #84cc16;">20% OFF</strong> para tu próxima compra, sin límite de monto.</p>
      </div>

      <div class="code-container">
        <div class="code-label">Tu Código Exclusivo</div>
        <div class="code">${discountCode}</div>
      </div>

      <div style="text-align: center;">
        <a href="https://cuidatuplanta.cl/?discount=${discountCode}" class="cta-button">
          🎁 Reclamar mi Descuento
        </a>
      </div>

      <div class="benefits">
        <div class="benefit-item">
          <span class="benefit-icon">✨</span>
          <div>
            <strong style="color: #84cc16;">20% de descuento</strong><br>
            Válido en toda tu próxima compra, sin tope de monto
          </div>
        </div>
        <div class="benefit-item">
          <span class="benefit-icon">🎁</span>
          <div>
            <strong style="color: #84cc16;">Pack de Semillas de Regalo</strong><br>
            Incluido automáticamente en tu pedido
          </div>
        </div>
        <div class="benefit-item">
          <span class="benefit-icon">⏰</span>
          <div>
            <strong style="color: #84cc16;">Válido por 1 año</strong><br>
            Tienes todo el tiempo del mundo para usarlo
          </div>
        </div>
        <div class="benefit-item">
          <span class="benefit-icon">🌳</span>
          <div>
            <strong style="color: #84cc16;">Status Bosque VIP</strong><br>
            Ya eres parte de nuestra comunidad más especial
          </div>
        </div>
      </div>

      <div class="message">
        <p style="color: #94a3b8;">Copia tu código y úsalo en tu próxima compra. También lo encontrarás guardado en tu cuenta.</p>
      </div>
    </div>

    <div class="footer">
      <div class="social-links">
        <a href="#">Instagram</a>
        <a href="#">Facebook</a>
        <a href="#">WhatsApp</a>
      </div>
      <p>
        Cuida Tu Planta<br>
        <a href="mailto:contacto@cuidatuplanta.cl">contacto@cuidatuplanta.cl</a><br>
        Chile
      </p>
      <p style="margin-top: 20px; font-size: 12px;">
        Este correo fue enviado porque alcanzaste tu décimo pedido.<br>
        Gracias por ser parte de nuestra comunidad verde 🌱
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const payload: VIPEmailPayload = await req.json();

    const { customer_id, customer_name, customer_email, discount_code, discount_code_id } = payload;

    if (!customer_id || !customer_email || !discount_code) {
      return new Response(
        JSON.stringify({ error: "Faltan parámetros requeridos" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const emailHTML = generateEmailHTML(customer_name, discount_code);
    const subject = "🌿 ¡Llegaste a tu décima cosecha! Tu regalo VIP te espera";



    const emailSent = {
      success: true,
      simulated: true,
      mode: EMAIL_MODE,
      message: "Simulacion generada. No se envio un correo real.",
      customer_email,
      discount_code,
      subject,
      sent_at: new Date().toISOString(),
      html_preview: emailHTML.substring(0, 200) + "...",
    };

    return new Response(
      JSON.stringify(emailSent),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error enviando email VIP:", error);

    return new Response(
      JSON.stringify({
        error: "Error al procesar el envío del email",
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
