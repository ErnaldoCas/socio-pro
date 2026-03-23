export async function POST(request) {
  const formData = await request.formData()
  const imagen = formData.get('imagen')

  if (!imagen) {
    return Response.json({ error: 'No se recibió imagen' }, { status: 400 })
  }

  const bytes = await imagen.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const mimeType = imagen.type || 'image/jpeg'

  const prompt = `Analiza esta imagen de factura o lista de productos chilena.
  
Extrae TODOS los productos que veas con sus datos.
En facturas busca: descripción del producto, cantidad, precio unitario.
En listas busca: nombre, cantidad, precio.

Responde SOLO en formato JSON válido:
{
  "productos": [
    {
      "nombre": "nombre del producto",
      "stock": cantidad numérica (si no hay usa 1),
      "precio": precio de venta sugerido (precio unitario * 1.3),
      "costo": precio unitario de la factura,
      "stock_minimo": 5,
      "categoria": "insumos"
    }
  ],
  "confianza": "alta|media|baja",
  "nota": "resumen de lo encontrado"
}

Responde SOLO JSON sin texto adicional.`

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}` }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }
      ],
      temperature: 0.3
    })
  })

  const data = await response.json()
  const texto = data.choices?.[0]?.message?.content || ''

  try {
    const clean = texto.replace(/```json|```/g, '').trim()
    const resultado = JSON.parse(clean)
    return Response.json(resultado)
  } catch {
    return Response.json({ error: 'No se pudo interpretar la imagen', productos: [] }, { status: 500 })
  }
}