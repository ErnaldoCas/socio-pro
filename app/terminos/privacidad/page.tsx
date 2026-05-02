export default function Privacidad() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">

        <div className="mb-8">
          <p className="text-xs text-gray-400 mb-1">Mi Socio Pro</p>
          <h1 className="text-2xl font-bold text-gray-900">Política de Privacidad</h1>
          <p className="text-sm text-gray-500 mt-1">Última actualización: mayo de 2026</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">1. Quiénes somos</h2>
            <p>Mi Socio Pro es una aplicación web de contabilidad y finanzas para emprendedores chilenos. Esta política describe cómo recopilamos, usamos y protegemos tu información personal.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">2. Información que recopilamos</h2>
            <p className="mb-2">Recopilamos la siguiente información al usar Mi Socio Pro:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
              <li><strong>Datos de cuenta:</strong> nombre y correo electrónico de tu cuenta de Google, obtenidos mediante autenticación OAuth.</li>
              <li><strong>Datos del negocio:</strong> nombre del negocio, nombre del dueño y configuración de planes.</li>
              <li><strong>Movimientos financieros:</strong> ingresos, egresos, conceptos, montos y categorías que tú ingresas.</li>
              <li><strong>Inventario:</strong> productos, precios, costos y niveles de stock que tú registras.</li>
              <li><strong>Datos de uso:</strong> consultas al Socio IA, análisis generados y configuraciones de la app.</li>
              <li><strong>Datos de pago:</strong> el procesamiento de pagos lo realiza exclusivamente Mercado Pago — no almacenamos datos de tarjetas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">3. Cómo usamos tu información</h2>
            <p className="mb-2">Usamos tu información exclusivamente para:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
              <li>Prestarte el servicio de Mi Socio Pro y sus funcionalidades.</li>
              <li>Generar análisis financieros personalizados mediante IA.</li>
              <li>Procesar y gestionar tu suscripción al plan Pro.</li>
              <li>Enviarte notificaciones push sobre tu negocio (solo si las activas).</li>
              <li>Mejorar el servicio y corregir errores.</li>
            </ul>
            <p className="mt-2 font-medium text-gray-800">No vendemos ni compartimos tus datos con terceros para fines publicitarios.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">4. Inteligencia artificial y tus datos</h2>
            <p>El Socio IA analiza tus movimientos, inventario y datos del negocio para generar recomendaciones personalizadas. Estos datos se envían a la API de Groq (proveedor de IA) de forma segura para procesar cada consulta. Groq no almacena tus datos de forma permanente según sus políticas de uso. Los análisis generados se guardan en nuestra base de datos solo si tú decides guardarlos explícitamente.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">5. Almacenamiento y seguridad</h2>
            <p>Tus datos se almacenan en Supabase (PostgreSQL), con cifrado en tránsito (HTTPS) y en reposo. Usamos Row Level Security (RLS) para garantizar que cada usuario solo acceda a sus propios datos. Los accesos administrativos están protegidos con claves de servicio seguras.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">6. Colaboradores y multiusuario</h2>
            <p>Si usas el plan Pro y agregas colaboradores, estos podrán ver y registrar información de tu negocio según los permisos que tú les asignes. Eres responsable de gestionar los accesos de tu equipo. Los colaboradores no pueden ver datos de otros negocios ni acceder a configuraciones que no tengan permiso.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">7. Notificaciones push</h2>
            <p>Las notificaciones push son opcionales. Si las activas, almacenamos tu suscripción VAPID para enviarte alertas de stock bajo. Puedes desactivarlas en cualquier momento desde Configuración.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">8. Tus derechos</h2>
            <p className="mb-2">Tienes derecho a:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
              <li><strong>Acceder</strong> a todos tus datos desde la aplicación.</li>
              <li><strong>Exportar</strong> tus movimientos en formato Excel o HTML (plan Pro).</li>
              <li><strong>Corregir</strong> cualquier dato incorrecto directamente en la app.</li>
              <li><strong>Eliminar</strong> tu cuenta y todos tus datos asociados — contáctanos y lo procesamos en un plazo máximo de 30 días.</li>
              <li><strong>Portabilidad:</strong> exporta tus datos en cualquier momento.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">9. Retención de datos</h2>
            <p>Conservamos tus datos mientras tu cuenta esté activa. Si eliminas tu cuenta, tus datos se borran permanentemente de nuestros servidores en un plazo máximo de 30 días, excepto aquellos que debamos conservar por obligaciones legales.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">10. Cookies y almacenamiento local</h2>
            <p>Mi Socio Pro usa cookies de sesión para mantener tu autenticación (gestionadas por Supabase) y almacenamiento local del navegador para guardar preferencias como el modo oscuro. No usamos cookies de seguimiento ni publicitarias.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">11. Proveedores de servicio</h2>
            <p className="mb-2">Para operar Mi Socio Pro usamos los siguientes proveedores:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
              <li><strong>Supabase</strong> — base de datos y autenticación</li>
              <li><strong>Vercel</strong> — infraestructura y despliegue</li>
              <li><strong>Groq</strong> — procesamiento de IA</li>
              <li><strong>Mercado Pago</strong> — procesamiento de pagos</li>
              <li><strong>Google</strong> — autenticación OAuth</li>
            </ul>
            <p className="mt-2">Cada proveedor tiene sus propias políticas de privacidad y manejo de datos.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">12. Menores de edad</h2>
            <p>Mi Socio Pro no está dirigido a menores de 18 años. No recopilamos intencionalmente datos de menores. Si detectamos que un menor ha creado una cuenta, la eliminaremos de inmediato.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">13. Cambios a esta política</h2>
            <p>Podemos actualizar esta Política de Privacidad ocasionalmente. Te notificaremos de cambios significativos a través de la aplicación. El uso continuo del servicio implica la aceptación de la política actualizada.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">14. Ley aplicable</h2>
            <p>Esta política se rige por la Ley N° 19.628 sobre Protección de la Vida Privada de Chile y sus modificaciones vigentes.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">15. Contacto</h2>
            <p>Para ejercer tus derechos o consultar sobre el manejo de tus datos, contáctanos a través de la aplicación o al correo que aparece en tu perfil de cuenta.</p>
          </section>

        </div>

        <div className="mt-6 text-center">
          <a href="/terminos" className="text-sm text-green-600 hover:underline">
            ← Ver Términos y Condiciones
          </a>
        </div>

      </div>
    </main>
  )
}