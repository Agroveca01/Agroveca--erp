import { Product } from './supabase';

export function generateProductDataSheet(product: Product): void {
  const content = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Ficha Técnica - ${product.name}</title>
  <style>
    @page { size: A4; margin: 2cm; }
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #10b981;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #10b981;
      margin-bottom: 10px;
    }
    .product-name {
      font-size: 28px;
      font-weight: bold;
      color: #1f2937;
      margin: 20px 0 10px 0;
    }
    .format {
      font-size: 18px;
      color: #6b7280;
      margin-bottom: 20px;
    }
    .section {
      margin: 25px 0;
      padding: 20px;
      background: #f9fafb;
      border-left: 4px solid #10b981;
      border-radius: 4px;
    }
    .section-title {
      font-size: 20px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
    }
    .section-title::before {
      content: "✓";
      display: inline-block;
      width: 28px;
      height: 28px;
      background: #10b981;
      color: white;
      border-radius: 50%;
      text-align: center;
      line-height: 28px;
      margin-right: 10px;
      font-weight: bold;
    }
    .benefits {
      list-style: none;
      padding: 0;
    }
    .benefits li {
      padding: 8px 0;
      padding-left: 30px;
      position: relative;
    }
    .benefits li::before {
      content: "→";
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
      font-size: 18px;
    }
    .warning {
      background: #fef3c7;
      border-left-color: #f59e0b;
      padding: 20px;
      border-radius: 8px;
      margin-top: 30px;
    }
    .warning-title {
      font-size: 18px;
      font-weight: bold;
      color: #92400e;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
    }
    .warning-title::before {
      content: "⚠";
      font-size: 24px;
      margin-right: 10px;
    }
    .specs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-top: 15px;
    }
    .spec-item {
      background: white;
      padding: 15px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }
    .spec-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .spec-value {
      font-size: 18px;
      font-weight: bold;
      color: #1f2937;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">CUIDA TU PLANTA</div>
    <div style="color: #6b7280;">Productos Naturales para el Cuidado de Plantas</div>
  </div>

  <div class="product-name">${product.name}</div>
  <div class="format">${product.format}</div>

  <div class="specs">
    <div class="spec-item">
      <div class="spec-label">Presentación</div>
      <div class="spec-value">${product.format}</div>
    </div>
    <div class="spec-item">
      <div class="spec-label">Precio Base</div>
      <div class="spec-value">$${product.base_price.toLocaleString('es-CL')}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Beneficios del Producto</div>
    <ul class="benefits">
      <li>Tratamiento preventivo y curativo de plagas comunes en plantas</li>
      <li>Formulación natural basada en extractos biológicos</li>
      <li>Apto para plantas ornamentales, hortalizas y frutales</li>
      <li>Control efectivo de hongos, ácaros y cochinillas</li>
      <li>No tóxico para personas y mascotas cuando se usa correctamente</li>
      <li>Potencia el sistema inmune natural de las plantas</li>
      <li>Mejora el desarrollo y vigor de las plantas tratadas</li>
    </ul>
  </div>

  <div class="section">
    <div class="section-title">Modo de Uso</div>
    <p><strong>Productos RTU (Ready To Use - Listo para Usar):</strong></p>
    <ul class="benefits">
      <li>Aplicar directamente sobre las hojas y tallos afectados</li>
      <li>Agitar antes de usar</li>
      <li>Aplicar preferentemente en horas de baja radiación solar</li>
      <li>Repetir aplicación cada 7-10 días según necesidad</li>
    </ul>

    <p style="margin-top: 15px;"><strong>Concentrados (100cc / 200cc):</strong></p>
    <ul class="benefits">
      <li>Diluir en agua según dosificación indicada en la etiqueta</li>
      <li>Mezclar bien antes de aplicar</li>
      <li>Usar pulverizador para aplicación foliar uniforme</li>
      <li>Repetir tratamiento según evolución de la plaga</li>
    </ul>
  </div>

  <div class="section">
    <div class="section-title">Componentes Principales</div>
    <ul class="benefits">
      <li>Extractos naturales de plantas con propiedades insecticidas</li>
      <li>Aceites esenciales con acción fungicida</li>
      <li>Surfactantes naturales para mejor adherencia</li>
      <li>Agua purificada como vehículo</li>
    </ul>
  </div>

  <div class="warning">
    <div class="warning-title">Información Importante de Almacenamiento</div>
    <p><strong>Shelf Life: 2 Años desde la fecha de fabricación</strong></p>
    <p>Para garantizar la máxima efectividad del producto, se recomienda:</p>
    <ul style="margin-top: 10px;">
      <li>Almacenar en lugar fresco y seco</li>
      <li>Mantener alejado de la luz solar directa</li>
      <li>No exponer a temperaturas extremas</li>
      <li>Mantener el envase bien cerrado después de cada uso</li>
      <li>Revisar la fecha de fabricación en la etiqueta</li>
      <li>No utilizar después de 2 años de la fecha de producción</li>
    </ul>
  </div>

  <div class="section">
    <div class="section-title">Precauciones</div>
    <ul class="benefits">
      <li>Mantener fuera del alcance de niños y mascotas</li>
      <li>Evitar contacto con ojos y mucosas</li>
      <li>Usar en áreas ventiladas</li>
      <li>Lavar las manos después de manipular el producto</li>
      <li>No ingerir bajo ninguna circunstancia</li>
      <li>En caso de contacto accidental, enjuagar con abundante agua</li>
    </ul>
  </div>

  <div class="footer">
    <p><strong>Cuida Tu Planta - ERP Management System</strong></p>
    <p>Documento generado automáticamente | ${new Date().toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}</p>
    <p>Para más información, consulte con su distribuidor autorizado</p>
  </div>
</body>
</html>
  `.trim();

  const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  }
}
