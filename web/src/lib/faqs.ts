// Answers describe how Aforiq actually works today; keep them in sync with the purchase flow.

export type FaqLink = { label: string; href: string };
export type Faq = { id: string; q: string; a: string[]; links?: FaqLink[] };
export type FaqCategory = { id: string; label: string; summary: string; faqs: Faq[] };

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "compras",
    label: "Compras",
    summary: "Cómo elegir y comprar tus entradas.",
    faqs: [
      {
        id: "como-comprar",
        q: "¿Cómo compro una entrada?",
        a: [
          "Busca tu evento, entra a su página y presiona «Comprar Tickets». Para comprar necesitas iniciar sesión en tu cuenta Aforiq; si no tienes una, puedes crearla en un minuto.",
          "Elige el sector y la cantidad de entradas. Si el sector tiene asientos numerados, eliges tus asientos en el plano. Luego completas tus datos, revisas la orden y pagas.",
        ],
        links: [{ label: "Ver eventos", href: "/eventos/" }],
      },
      {
        id: "cuenta-para-comprar",
        q: "¿Necesito una cuenta para comprar?",
        a: [
          "Sí. Tus entradas quedan guardadas en tu cuenta, en «Mi cuenta → Mis entradas», para que siempre las tengas a mano el día del evento.",
        ],
        links: [{ label: "Crear cuenta", href: "/registro/" }],
      },
      {
        id: "maximo-entradas",
        q: "¿Cuántas entradas puedo comprar?",
        a: [
          "Cada evento define un máximo de entradas por compra, que verás al elegir tu sector. Si necesitas más, puedes hacer una nueva compra después.",
        ],
      },
      {
        id: "reserva",
        q: "¿Por cuánto tiempo se guarda mi selección?",
        a: [
          "Al continuar desde la selección de entradas, las reservamos para ti por unos minutos mientras completas tus datos y el pago. Verás el tiempo restante en la parte superior de la página.",
          "Si el tiempo se acaba, las entradas se liberan para otros compradores y debes volver a elegirlas. No se hace ningún cobro.",
        ],
      },
      {
        id: "preventa",
        q: "¿Qué es una preventa?",
        a: [
          "Algunos eventos venden entradas por etapas. Durante una preventa el precio puede ser menor y la cantidad de entradas es limitada. Cuando termina, comienza la venta general al precio normal.",
        ],
      },
      {
        id: "cupon",
        q: "¿Cómo uso un cupón de descuento?",
        a: [
          "En el paso «Tus datos» o en la confirmación de tu orden, presiona «¿Tienes un cupón de descuento?» e ingresa el código. El descuento se aplica sobre el valor de las entradas y lo verás reflejado en el total antes de pagar.",
        ],
      },
    ],
  },
  {
    id: "pagos",
    label: "Pagos",
    summary: "Medios de pago, cargos y comprobantes.",
    faqs: [
      {
        id: "medios-pago",
        q: "¿Cómo pago mis entradas?",
        a: [
          "Pagas a través de Flow, una plataforma de pagos segura. Puedes usar Webpay Plus, tarjetas de crédito y débito, transferencias bancarias y billeteras digitales.",
          "Aforiq no guarda los datos de tu tarjeta.",
        ],
      },
      {
        id: "cargo-servicio",
        q: "¿Qué es el cargo por servicio?",
        a: [
          "Es un cargo de 10% sobre el valor de las entradas que se suma al total. Lo verás detallado en el resumen de tu orden antes de pagar. La emisión del e-ticket es gratis.",
        ],
      },
      {
        id: "comprobante",
        q: "¿Dónde recibo el comprobante de pago?",
        a: [
          "Al completar el pago te enviamos un correo con la confirmación de tu compra y tus entradas. Flow además te envía el comprobante de la transacción.",
        ],
      },
      {
        id: "pago-rechazado",
        q: "Mi pago fue rechazado, ¿qué hago?",
        a: [
          "Si el pago no se completa, no se hace ningún cobro y las entradas se liberan. Puedes volver a intentarlo eligiendo nuevamente tus entradas. Si el problema continúa, revisa con tu banco o escríbenos.",
        ],
        links: [{ label: "Escríbenos", href: "/contacto/?motivo=no-puedo-comprar" }],
      },
    ],
  },
  {
    id: "entradas",
    label: "Entradas y acceso",
    summary: "Dónde están tus entradas y cómo usarlas.",
    faqs: [
      {
        id: "donde-entradas",
        q: "¿Dónde recibo mis entradas?",
        a: [
          "Tus entradas quedan en «Mi cuenta → Mis entradas» y también te llegan al correo de tu cuenta al completar la compra. Desde ahí puedes descargarlas o imprimirlas.",
        ],
        links: [{ label: "Ir a Mis entradas", href: "/mi-cuenta/" }],
      },
      {
        id: "presentar-entradas",
        q: "¿Cómo presento mis entradas?",
        a: [
          "Muestra el código QR de cada entrada en el acceso del evento, desde tu celular o impreso. Cada entrada tiene un código único que se valida una sola vez.",
          "Si tu entrada es nominativa, lleva también tu cédula de identidad o pasaporte.",
        ],
      },
      {
        id: "nominativas",
        q: "¿Qué es una entrada nominativa?",
        a: [
          "En algunos eventos cada entrada queda a nombre de la persona que asistirá. Al comprar te pediremos nombre, RUT o pasaporte y fecha de nacimiento de cada asistente, y en el acceso podrán pedirte tu documento.",
        ],
      },
      {
        id: "no-llego-correo",
        q: "No me llegó el correo con mis entradas",
        a: [
          "Revisa tu carpeta de spam o promociones. De todas formas, tus entradas siempre están disponibles en «Mi cuenta → Mis entradas» con el mismo correo con el que compraste.",
        ],
        links: [{ label: "Ir a Mis entradas", href: "/mi-cuenta/" }],
      },
      {
        id: "codigo-orden",
        q: "¿Dónde encuentro el código de mi compra?",
        a: [
          "Cada compra tiene un código de orden que empieza con «PS-». Lo encuentras en el correo de confirmación y en la página de tu compra. Tenlo a mano si nos escribes por un problema con una compra.",
        ],
      },
    ],
  },
  {
    id: "cuenta",
    label: "Mi cuenta",
    summary: "Tus datos, contraseña y preferencias.",
    faqs: [
      {
        id: "modificar-datos",
        q: "¿Dónde modifico mis datos?",
        a: ["Inicia sesión y entra a «Mi cuenta → Datos personales». Ahí puedes actualizar tu nombre."],
        links: [{ label: "Ir a Mi cuenta", href: "/mi-cuenta/?seccion=datos" }],
      },
      {
        id: "olvide-contrasena",
        q: "Olvidé mi contraseña",
        a: [
          "En la página de inicio de sesión presiona «¿Olvidaste tu contraseña?» e ingresa tu correo. Te enviaremos un enlace para crear una nueva. Si no lo ves, revisa tu carpeta de spam.",
        ],
        links: [{ label: "Recuperar contraseña", href: "/recuperar-contrasena/" }],
      },
      {
        id: "notificaciones",
        q: "¿Cómo elijo qué notificaciones recibo?",
        a: ["En «Mi cuenta → Notificaciones» puedes activar o desactivar recordatorios de tus eventos, preventas y novedades."],
        links: [{ label: "Ir a Notificaciones", href: "/mi-cuenta/?seccion=notificaciones" }],
      },
    ],
  },
  {
    id: "devoluciones",
    label: "Devoluciones",
    summary: "Cuándo corresponde una devolución.",
    faqs: [
      {
        id: "cuando-devolucion",
        q: "¿Puedo pedir la devolución de mis entradas?",
        a: [
          "Si el evento se suspende o se reprograma, tienes derecho a la devolución del valor de tus entradas, de acuerdo con la Ley del Consumidor.",
          "Fuera de esos casos, las entradas no tienen devolución por cambio de planes, así que revisa bien la fecha, el lugar y el sector antes de pagar.",
        ],
      },
      {
        id: "solicitar-devolucion",
        q: "¿Cómo solicito una devolución?",
        a: [
          "Escríbenos desde el formulario de contacto eligiendo el motivo «Devoluciones» e incluye el código de tu orden. Te responderemos al correo que indiques.",
        ],
        links: [{ label: "Solicitar devolución", href: "/contacto/?motivo=devolucion" }],
      },
      {
        id: "cobro-duplicado",
        q: "Me cobraron dos veces, ¿qué hago?",
        a: [
          "Escríbenos con el código de tu orden y el detalle del cobro. Revisaremos el caso con el medio de pago y te contactaremos.",
        ],
        links: [{ label: "Escríbenos", href: "/contacto/?motivo=cobro" }],
      },
    ],
  },
  {
    id: "productores",
    label: "Productores",
    summary: "Para quienes quieren vender entradas en Aforiq.",
    faqs: [
      {
        id: "publicar-evento",
        q: "Quiero vender entradas en Aforiq, ¿qué debo hacer?",
        a: [
          "Completa la solicitud en nuestra página para productores con tus datos y los de tu evento. Te contactaremos y te daremos acceso al panel con tu cuenta Aforiq para que crees tu evento.",
        ],
        links: [{ label: "Enviar solicitud", href: "/organizadores/#solicitud" }],
      },
    ],
  },
];
