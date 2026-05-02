export default function Terminos() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">

        <div className="mb-8">
          <p className="text-xs text-gray-400 mb-1">Mi Socio Pro</p>
          <h1 className="text-2xl font-bold text-gray-900">Términos y Condiciones</h1>
          <p className="text-sm text-gray-500 mt-1">Última actualización: mayo de 2026</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">1. Aceptación de los términos</h2>
            <p>Al registrarte y usar Mi Socio Pro, aceptas estos Términos y Condiciones en su totalidad. Si no estás de acuerdo con alguna parte, te pedimos que no uses el servicio.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">2. Descripción del servicio</h2>
            <p>Mi Socio Pro es una aplicación web de contabilidad y finanzas simples para emprendedores, diseñada para el registro de movimientos de caja, gestión de inventario y análisis financiero asistido por inteligencia artificial. El servicio se ofrece en modalidad SaaS (Software como Servicio) con planes Gratis y Pro.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">3. Registro y cuenta</h2>
            <p>Para usar Mi Socio Pro debes iniciar sesión con una cuenta de Google. Eres responsable de mantener la confidencialidad de tu cuenta y de todas las actividades realizadas con ella. Debes notificarnos de inmediato si detectas un uso no autorizado.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">4. Planes y pagos</h2>
            <p className="mb-2">Mi Socio Pro ofrece dos planes:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
              <li><strong>Plan Gratis:</strong> 40 movimientos por mes, funciones básicas sin costo.</li>
              <li><strong>Plan Pro:</strong> $7.990 CLP mensuales, movimientos ilimitados, colaboradores, análisis profundo y exportación de datos.</li>
            </ul>
            <p className="mt-2">Los pagos se procesan a través de Mercado Pago. Al suscribirte al plan Pro autorizas el cobro mensual automático. Puedes cancelar en cualquier momento desde tu cuenta de Mercado Pago, sin cargos adicionales ni permanencia mínima.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">5. Uso aceptable</h2>
            <p className="mb-2">Te comprometes a usar Mi Socio Pro únicamente para fines legales y de acuerdo con estos términos. Está prohibido:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
              <li>Usar el servicio para actividades ilícitas o fraudulentas.</li>
              <li>Intentar acceder a cuentas de otros usuarios.</li>
              <li>Cargar contenido malicioso o que infrinja derechos de terceros.</li>
              <li>Realizar ingeniería inversa o intentar extraer el código fuente de la aplicación.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">6. Inteligencia artificial</h2>
            <p>Mi Socio Pro utiliza modelos de inteligencia artificial (Groq / Llama) para generar análisis financieros y recomendaciones. Estas respuestas son orientativas y no constituyen asesoría financiera, contable ni legal profesional. El usuario es responsable de las decisiones que tome basándose en los análisis generados por la IA.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">7. Propiedad intelectual</h2>
            <p>Todo el contenido, diseño, código y marca de Mi Socio Pro son propiedad de sus creadores y están protegidos por la legislación de propiedad intelectual vigente en Chile. Los datos que ingresas son de tu propiedad — Mi Socio Pro solo los usa para prestarte el servicio.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">8. Disponibilidad del servicio</h2>
            <p>Nos esforzamos por mantener Mi Socio Pro disponible de forma continua, pero no garantizamos disponibilidad ininterrumpida. Podemos realizar mantenimientos programados o no programados. No somos responsables por pérdidas derivadas de interrupciones del servicio.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">9. Limitación de responsabilidad</h2>
            <p>Mi Socio Pro se provee "tal como es". En la máxima medida permitida por la ley chilena, no somos responsables por daños indirectos, pérdida de datos, lucro cesante ni decisiones financieras tomadas por el usuario basándose en la información de la aplicación.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">10. Modificaciones</h2>
            <p>Nos reservamos el derecho de modificar estos Términos en cualquier momento. Te notificaremos de cambios significativos mediante la aplicación. El uso continuo del servicio después de las modificaciones implica la aceptación de los nuevos términos.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">11. Ley aplicable</h2>
            <p>Estos Términos se rigen por las leyes de la República de Chile. Cualquier disputa se someterá a los tribunales competentes de la ciudad de Santiago.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">12. Contacto</h2>
            <p>Si tienes preguntas sobre estos Términos, puedes contactarnos a través de la aplicación o al correo que aparece en tu perfil de cuenta.</p>
          </section>

        </div>

        <div className="mt-6 text-center">
          <a href="/privacidad" className="text-sm text-green-600 hover:underline">
            Ver Política de Privacidad →
          </a>
        </div>

      </div>
    </main>
  )
}