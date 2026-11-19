// Términos y Condiciones de compra de Aforiq, texto entregado por el cliente.
// Edita aquí el contenido; la página /terminos-y-condiciones lo renderiza tal cual.

export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "lines"; lines: string[] }
  | { type: "checks"; items: string[] };

export type LegalSection = { id: string; title: string; blocks: LegalBlock[] };

export const TERMS_UPDATED = "19 de noviembre de 2026";

export const TERMS_INTRO: string[] = [
  "Los presentes Términos y Condiciones regulan el acceso y uso de la plataforma Aforiq, así como la compra de entradas para eventos comercializados a través de ella.",
  "Al realizar una compra a través de Aforiq, el usuario declara haber leído, comprendido y aceptado estos Términos y Condiciones, las condiciones particulares del evento correspondiente y la Política de Privacidad de Aforiq.",
  "Si el usuario no está de acuerdo con estos Términos y Condiciones, deberá abstenerse de realizar la compra.",
];

const p = (text: string): LegalBlock => ({ type: "p", text });
const list = (...items: string[]): LegalBlock => ({ type: "list", items });

export const TERMS_SECTIONS: LegalSection[] = [
  {
    id: "identificacion",
    title: "Identificación de Aforiq",
    blocks: [
      p("AFORIQ SpA, RUT 78.519.635-K, con domicilio principal en Antonio Bellet 193, Oficina 1210, 12° piso, Providencia, Región Metropolitana, Chile, en adelante “Aforiq”, es una empresa que presta servicios relacionados con la comercialización, gestión y administración de entradas para eventos."),
      p("Aforiq podrá actuar, según corresponda en cada evento y conforme a los contratos celebrados con los respectivos productores u organizadores, como plataforma tecnológica de ticketing, proveedor de servicios de comercialización y gestión de entradas y/o mandatario del productor u organizador del evento."),
      p("Las condiciones particulares de cada evento serán informadas al comprador antes de efectuar la compra."),
    ],
  },
  {
    id: "definiciones",
    title: "Definiciones",
    blocks: [
      p("Para efectos de estos Términos y Condiciones:"),
      list(
        "“Aforiq”: AFORIQ SpA.",
        "“Plataforma”: sitio web, aplicación, sistemas tecnológicos y demás canales digitales operados por Aforiq para la comercialización y gestión de entradas.",
        "“Organizador”: persona natural o jurídica responsable de producir, organizar o realizar el evento correspondiente.",
        "“Evento”: espectáculo, concierto, fiesta, actividad, experiencia o actividad de entretenimiento comercializada mediante Aforiq.",
        "“Entrada”: documento electrónico, código QR, código de barras u otro mecanismo que permita acreditar el derecho de acceso a un evento.",
        "“Comprador”: persona que adquiere una o más entradas a través de Aforiq.",
        "“Cargo por Servicio”: monto cobrado por Aforiq por los servicios asociados a la comercialización, procesamiento, emisión, gestión y administración de la entrada."
      ),
    ],
  },
  {
    id: "rol-de-aforiq",
    title: "Rol de Aforiq y del Organizador",
    blocks: [
      p("Aforiq proporciona la infraestructura tecnológica y los servicios asociados a la comercialización y gestión de entradas a través de su Plataforma."),
      p("El Organizador será responsable de la producción y realización material del Evento, incluyendo, según corresponda:"),
      list(
        "Fecha y horario.",
        "Recinto.",
        "Artistas o participantes.",
        "Aforo.",
        "Sectores y localidades.",
        "Condiciones de acceso.",
        "Restricciones de edad.",
        "Permisos y autorizaciones.",
        "Medidas de seguridad.",
        "Producción.",
        "Reprogramaciones.",
        "Cancelaciones.",
        "Modificaciones del Evento."
      ),
      p("Cuando Aforiq actúe como mandatario del Organizador, la relación entre ambas partes se regirá adicionalmente por el contrato celebrado entre Aforiq y el respectivo Organizador."),
      p("Lo anterior no limita las obligaciones que legalmente correspondan a Aforiq respecto de los servicios que directamente presta al consumidor."),
      p("El modelo de ticketing mediante mandato es contemplado por el Servicio de Impuestos Internos para empresas que comercializan entradas por cuenta de productores u organizadores, incluyendo el tratamiento de la comisión cobrada por el mandatario."),
    ],
  },
  {
    id: "informacion-del-evento",
    title: "Información del Evento",
    blocks: [
      p("Antes de efectuar el pago, el Comprador deberá revisar la información correspondiente al Evento, incluyendo:"),
      list(
        "Nombre del Evento.",
        "Fecha.",
        "Hora.",
        "Recinto.",
        "Sector o localidad.",
        "Cantidad de entradas.",
        "Restricciones de edad.",
        "Precio de la entrada.",
        "Cargo por Servicio.",
        "Precio total."
      ),
      p("Las condiciones particulares informadas para cada Evento formarán parte de las condiciones de compra."),
    ],
  },
  {
    id: "precio",
    title: "Precio y Cargo por Servicio",
    blocks: [
      p("Antes de efectuar el pago, Aforiq informará claramente al Comprador el precio total de la operación."),
      p("Cuando corresponda, la información podrá presentarse de la siguiente manera:"),
      { type: "lines", lines: ["Valor de la entrada: $XX.XXX", "Cargo por Servicio Aforiq: $X.XXX", "Total a pagar: $XX.XXX"] },
      p("El Cargo por Servicio corresponde a la contraprestación asociada a los servicios de ticketing prestados por Aforiq."),
      p("El Cargo por Servicio será informado al Comprador antes de confirmar la compra."),
    ],
  },
  {
    id: "cargo-por-servicio",
    title: "Naturaleza del Cargo por Servicio",
    blocks: [
      p("El Cargo por Servicio corresponde a los servicios prestados por Aforiq relacionados con la comercialización, procesamiento, emisión, administración, gestión y/o validación de la entrada adquirida mediante la Plataforma."),
      p("Cuando la devolución de una entrada derive exclusivamente de circunstancias atribuibles al Comprador, tales como una imposibilidad personal de asistir, error de selección, cambio de opinión u otra circunstancia que no sea imputable a Aforiq ni al Organizador, el Cargo por Servicio podrá no ser reembolsable en la medida en que ello sea permitido por la legislación aplicable y haya sido informado previamente al Comprador."),
      p("Esta disposición no afectará los derechos irrenunciables reconocidos al consumidor por la legislación chilena."),
      p("En particular, ante la cancelación, suspensión, modificación relevante de las condiciones contratadas o incumplimiento del Evento, se respetarán los derechos que correspondan al consumidor, incluyendo la devolución del Cargo por Servicio cuando legalmente proceda. SERNAC señala expresamente que, ante estos casos, corresponde devolver todo lo pagado, incluido el cargo por servicio."),
    ],
  },
  {
    id: "retracto",
    title: "Derecho de retracto",
    blocks: [
      p("Las compras realizadas por medios electrónicos estarán sujetas al régimen de retracto establecido en la legislación chilena, cuando éste resulte aplicable."),
      p("Cuando corresponda informar la existencia o exclusión del derecho de retracto, Aforiq lo hará de manera previa, clara, destacada e inequívoca antes de la contratación."),
      p("La legislación chilena establece reglas específicas para contratos celebrados por medios electrónicos y exige que el consumidor pueda acceder previamente a las condiciones generales y almacenarlas o imprimirlas."),
      p("Cuando el retracto sea legalmente aplicable y ejercido válidamente, las devoluciones se efectuarán conforme a la normativa vigente."),
    ],
  },
  {
    id: "aceptacion-de-las-condiciones",
    title: "Aceptación de las condiciones",
    blocks: [
      p("Antes de realizar el pago, el Comprador deberá tener acceso a estos Términos y Condiciones y a las condiciones particulares del Evento."),
      p("La Plataforma podrá requerir que el Comprador marque expresamente:"),
      { type: "checks", items: ["He leído y acepto los Términos y Condiciones de Aforiq y la Política de Privacidad."] },
      p("Cuando corresponda:"),
      { type: "checks", items: ["He revisado las condiciones particulares del Evento, incluyendo fecha, horario, recinto, sector, precio y restricciones de acceso."] },
      p("El sistema podrá conservar evidencia de la aceptación de dichas condiciones."),
    ],
  },
  {
    id: "perfeccionamiento",
    title: "Perfeccionamiento de la compra",
    blocks: [
      p("La compra se entenderá perfeccionada una vez que:"),
      {
        type: "list",
        ordered: true,
        items: [
          "El Comprador haya seleccionado la Entrada.",
          "Haya aceptado las condiciones correspondientes.",
          "Haya ingresado correctamente los datos requeridos.",
          "El medio de pago haya autorizado la operación.",
          "Aforiq haya confirmado la transacción.",
        ],
      },
      p("Una vez perfeccionada la compra, Aforiq enviará una confirmación electrónica al correo informado por el Comprador."),
      p("La normativa chilena exige que en contrataciones electrónicas el consumidor tenga acceso previo a las condiciones y que, una vez perfeccionado el contrato, reciba confirmación escrita."),
    ],
  },
  {
    id: "entradas-y-codigos-qr",
    title: "Entradas y códigos QR",
    blocks: [
      p("Las Entradas podrán ser emitidas mediante códigos QR, códigos de barras u otros mecanismos electrónicos de validación."),
      p("Cada código corresponde a una Entrada individual y podrá ser utilizado una sola vez, salvo que las condiciones particulares del Evento indiquen expresamente lo contrario."),
      p("El Comprador deberá mantener bajo su control la Entrada y su código de acceso."),
      p("El Comprador será responsable de no divulgar, compartir o entregar voluntariamente el código de su Entrada a terceros."),
      p("Cuando una Entrada haya sido válidamente utilizada para ingresar al Evento, no podrá utilizarse nuevamente."),
    ],
  },
  {
    id: "canales-oficiales",
    title: "Entradas adquiridas fuera de los canales oficiales",
    blocks: [
      p("Aforiq recomienda adquirir Entradas exclusivamente mediante la Plataforma y los canales oficiales informados para cada Evento."),
      p("Aforiq no garantiza la autenticidad, validez o disponibilidad de Entradas adquiridas a terceros o mediante canales no autorizados."),
      p("La adquisición de Entradas fuera de los canales oficiales se realiza bajo responsabilidad del comprador, sin perjuicio de los derechos que legalmente correspondan."),
    ],
  },
  {
    id: "reventa-y-transferencia",
    title: "Reventa y transferencia de entradas",
    blocks: [
      p("Las Entradas podrán estar sujetas a restricciones de transferencia o reventa según las condiciones particulares de cada Evento."),
      p("Cuando una Entrada sea nominativa o exista una restricción específica, ésta será informada previamente al Comprador."),
      p("Aforiq podrá implementar mecanismos razonables de validación de identidad y control de acceso cuando resulten necesarios para la seguridad del Evento."),
    ],
  },
  {
    id: "compras-por-error",
    title: "Compras por error",
    blocks: [
      p("Antes de confirmar una compra, el Comprador deberá verificar:"),
      list("Evento.", "Fecha.", "Horario.", "Recinto.", "Sector.", "Cantidad de Entradas.", "Precio.", "Cargo por Servicio.", "Total a pagar."),
      p("Aforiq no estará obligada a modificar una compra por errores imputables exclusivamente al Comprador cuando ello no sea exigido por la legislación aplicable."),
      p("Lo anterior se entiende sin perjuicio de los derechos que legalmente correspondan al consumidor."),
    ],
  },
  {
    id: "cancelacion",
    title: "Cancelación del Evento",
    blocks: [
      p("En caso de cancelación del Evento, Aforiq y/o el Organizador informarán oportunamente al Comprador las condiciones y procedimiento aplicables."),
      p("Cuando corresponda legalmente efectuar una devolución, ésta comprenderá los montos que la legislación determine, incluido el Cargo por Servicio cuando corresponda."),
      p("Aforiq no podrá utilizar estos Términos y Condiciones para limitar derechos irrenunciables del consumidor."),
      p("SERNAC establece que ante la suspensión o cancelación de un espectáculo, cambios de las condiciones contratadas o incumplimientos, los consumidores tienen derecho a la devolución de todo lo pagado, incluido el Cargo por Servicio."),
    ],
  },
  {
    id: "reprogramacion",
    title: "Reprogramación del Evento",
    blocks: [
      p("En caso de que el Evento sea reprogramado, Aforiq y/o el Organizador informarán la nueva fecha y las condiciones aplicables."),
      p("La Entrada podrá mantenerse válida para la nueva fecha cuando así se informe."),
      p("Cuando el consumidor tenga derecho legal a solicitar la devolución y no pueda o no quiera asistir a la nueva fecha en los términos reconocidos por la normativa aplicable, podrá solicitar la devolución mediante el procedimiento informado por Aforiq."),
      p("SERNAC ha señalado que, ante la reprogramación de un espectáculo, el consumidor puede optar por asistir a la nueva fecha o solicitar la devolución cuando corresponda."),
    ],
  },
  {
    id: "cambios-del-evento",
    title: "Cambio de artistas, participantes o condiciones",
    blocks: [
      p("Los artistas, participantes, horarios y demás elementos anunciados podrán estar sujetos a modificaciones por circunstancias que afecten la realización del Evento."),
      p("Cuando una modificación constituya un cambio relevante de las condiciones originalmente contratadas, se respetarán los derechos que la legislación otorgue al consumidor."),
      p("El Organizador y/o Aforiq informarán las modificaciones relevantes tan pronto como sea razonablemente posible."),
    ],
  },
  {
    id: "devoluciones",
    title: "Devoluciones",
    blocks: [
      p("Las solicitudes de devolución deberán efectuarse a través de los canales oficiales informados por Aforiq."),
      p("La solicitud podrá requerir:"),
      list(
        "Número de orden.",
        "Nombre del Comprador.",
        "Correo utilizado en la compra.",
        "Información de la Entrada.",
        "Medio de pago.",
        "Antecedentes adicionales necesarios para verificar la operación."
      ),
      p("Los plazos y condiciones aplicables dependerán de la causa de la devolución y de la legislación vigente."),
      p("Cuando corresponda efectuar una devolución, Aforiq informará el procedimiento correspondiente."),
    ],
  },
  {
    id: "medios-de-pago",
    title: "Medios de pago",
    blocks: [
      p("Aforiq podrá utilizar proveedores externos de servicios de pago, incluyendo Flow, Mercado Pago u otros proveedores habilitados."),
      p("La aprobación, rechazo, reversa o bloqueo de una operación podrá depender del proveedor del medio de pago utilizado."),
      p("Aforiq adoptará las medidas razonables para facilitar la correcta identificación y conciliación de las operaciones procesadas a través de dichos proveedores."),
    ],
  },
  {
    id: "fraude",
    title: "Fraude y operaciones sospechosas",
    blocks: [
      p("Aforiq podrá implementar mecanismos de seguridad destinados a prevenir:"),
      list(
        "Fraude.",
        "Uso no autorizado de medios de pago.",
        "Compras sospechosas.",
        "Uso indebido de Entradas.",
        "Manipulación de códigos.",
        "Actividades que puedan afectar la seguridad de la Plataforma o del Evento."
      ),
      p("Cuando resulte necesario, Aforiq podrá solicitar antecedentes adicionales para verificar una operación."),
      p("Las medidas adoptadas deberán respetar la legislación aplicable y los derechos del consumidor."),
    ],
  },
  {
    id: "acceso-al-evento",
    title: "Acceso al Evento",
    blocks: [
      p("El ingreso al Evento estará sujeto a:"),
      list(
        "Presentación de una Entrada válida.",
        "Validación del código correspondiente.",
        "Cumplimiento de las condiciones particulares del Evento.",
        "Requisitos de edad.",
        "Normas de seguridad.",
        "Normas del recinto."
      ),
      p("La compra de una Entrada no exime al asistente del cumplimiento de las condiciones de acceso previamente informadas."),
    ],
  },
  {
    id: "edad-y-documentacion",
    title: "Edad y documentación",
    blocks: [
      p("El Comprador será responsable de revisar las restricciones de edad indicadas para cada Evento."),
      p("Cuando el Evento requiera documento de identidad, el asistente deberá presentar el documento correspondiente."),
      p("Cuando corresponda, las restricciones de edad y documentación serán informadas antes de la compra."),
    ],
  },
  {
    id: "seguridad",
    title: "Seguridad y condiciones de acceso",
    blocks: [
      p("El acceso al Evento estará sujeto a las normas de seguridad del recinto y a las condiciones particulares informadas para el Evento."),
      p("Dichas condiciones deberán respetar la legislación vigente y no podrán establecer restricciones discriminatorias o contrarias a derecho."),
    ],
  },
  {
    id: "responsabilidad-del-organizador",
    title: "Responsabilidad del Organizador",
    blocks: [
      p("El Organizador será responsable, según corresponda, de la realización material del Evento, incluyendo:"),
      list(
        "Producción.",
        "Artistas.",
        "Recinto.",
        "Permisos.",
        "Autorizaciones.",
        "Seguridad.",
        "Aforo.",
        "Horarios.",
        "Condiciones del espectáculo.",
        "Cumplimiento de lo ofrecido al consumidor."
      ),
      p("Aforiq podrá exigir contractualmente al Organizador el cumplimiento de dichas obligaciones."),
      p("Lo anterior no excluye las obligaciones legales propias de Aforiq respecto de los servicios que directamente presta."),
    ],
  },
  {
    id: "eventos-de-terceros",
    title: "Eventos producidos por terceros",
    blocks: [
      p("Cuando Aforiq comercialice Entradas para eventos organizados por terceros, el Organizador será identificado en la información particular del Evento cuando corresponda."),
      p("Aforiq podrá actuar como plataforma tecnológica, ticketera y/o mandatario del Organizador, dependiendo de la estructura contractual aplicable."),
      p("La relación entre Aforiq y el Organizador se regirá adicionalmente por el contrato celebrado entre ambas partes."),
    ],
  },
  {
    id: "datos-personales",
    title: "Protección de datos personales",
    blocks: [
      p("Los datos personales proporcionados durante el proceso de compra serán tratados de acuerdo con la legislación chilena vigente y con la Política de Privacidad de Aforiq."),
      p("Los datos podrán ser utilizados para:"),
      list(
        "Procesar la compra.",
        "Emitir y administrar Entradas.",
        "Confirmar operaciones.",
        "Validar accesos.",
        "Gestionar devoluciones.",
        "Prevenir fraude.",
        "Atender solicitudes.",
        "Cumplir obligaciones legales."
      ),
      p("Las comunicaciones comerciales serán gestionadas conforme a las autorizaciones y reglas aplicables."),
    ],
  },
  {
    id: "propiedad-intelectual",
    title: "Propiedad intelectual",
    blocks: [
      p("La Plataforma, marca, logotipo, software, diseño, textos, gráficos, interfaces y demás contenidos propios de Aforiq pertenecen a Aforiq o a sus respectivos titulares."),
      p("Queda prohibida su reproducción, distribución, modificación o explotación comercial sin autorización previa."),
    ],
  },
  {
    id: "disponibilidad",
    title: "Disponibilidad de la Plataforma",
    blocks: [
      p("Aforiq realizará esfuerzos razonables para mantener la Plataforma disponible y funcionando correctamente."),
      p("Podrán producirse interrupciones debido, entre otras causas, a:"),
      list(
        "Mantenimiento.",
        "Actualizaciones.",
        "Fallas de conectividad.",
        "Fallas de proveedores tecnológicos.",
        "Problemas de terceros.",
        "Ciberataques.",
        "Fuerza mayor o caso fortuito."
      ),
      p("Lo anterior no afectará los derechos que legalmente correspondan al consumidor."),
    ],
  },
  {
    id: "responsabilidad-de-aforiq",
    title: "Responsabilidad de Aforiq",
    blocks: [
      p("Aforiq responderá por los servicios que directamente preste y por los incumplimientos que legalmente le sean imputables."),
      p("Ninguna disposición de estos Términos y Condiciones tendrá por objeto excluir o limitar derechos irrenunciables reconocidos al consumidor por la legislación chilena."),
      p("Asimismo, ninguna disposición tendrá por objeto excluir responsabilidades que legalmente no puedan ser excluidas o limitadas."),
    ],
  },
  {
    id: "fuerza-mayor",
    title: "Fuerza mayor o caso fortuito",
    blocks: [
      p("Cuando circunstancias imprevisibles o irresistibles afecten la realización de un Evento o el funcionamiento de la Plataforma, Aforiq y/o el Organizador adoptarán las medidas razonables para informar oportunamente la situación y mitigar sus efectos."),
      p("Las consecuencias respecto de las Entradas y eventuales devoluciones se determinarán conforme a la legislación vigente y a las circunstancias particulares del caso."),
    ],
  },
  {
    id: "condiciones-particulares",
    title: "Condiciones particulares del Evento",
    blocks: [
      p("Cada Evento podrá contar con condiciones particulares adicionales."),
      p("Estas podrán incluir:"),
      list(
        "Edad mínima.",
        "Horarios.",
        "Artistas.",
        "Sectores.",
        "Restricciones de acceso.",
        "Condiciones de transferencia.",
        "Política específica de cambios.",
        "Requisitos de identificación.",
        "Otras condiciones propias del Evento."
      ),
      p("Las condiciones particulares deberán ser informadas antes de la compra."),
      p("En caso de existir diferencias entre estos Términos Generales y una condición particular del Evento, ésta prevalecerá únicamente respecto de la materia específica del Evento y siempre que no contravenga la legislación vigente."),
    ],
  },
  {
    id: "modificaciones",
    title: "Modificación de los Términos y Condiciones",
    blocks: [
      p("Aforiq podrá actualizar estos Términos y Condiciones cuando resulte necesario por cambios legales, regulatorios, tecnológicos o en los servicios ofrecidos."),
      p("La versión aplicable a una compra será aquella que el consumidor haya podido conocer y aceptar antes de perfeccionar la contratación, sin perjuicio de las modificaciones posteriores que correspondan conforme a la legislación."),
    ],
  },
  {
    id: "atencion-al-cliente",
    title: "Atención al cliente y reclamos",
    blocks: [
      p("Para consultas, solicitudes, reclamos y demás comunicaciones relacionadas con compras realizadas a través de Aforiq:"),
      {
        type: "lines",
        lines: [
          "AFORIQ SpA",
          "RUT: 78.519.635-K",
          "Domicilio: Antonio Bellet 193, Oficina 1210, 12° piso, Providencia, Región Metropolitana, Chile.",
          "Sitio web: aforiq.cl",
          "Correo electrónico: contacto@aforiq.cl",
          "Formulario de contacto: aforiq.cl/contacto",
        ],
      },
      p("Aforiq atenderá las solicitudes de los consumidores de conformidad con la legislación chilena vigente."),
      p("El consumidor mantiene las acciones y derechos que le reconoce la legislación aplicable."),
    ],
  },
  {
    id: "aceptacion-final",
    title: "Aceptación final",
    blocks: [p("Antes de realizar el pago, el Comprador deberá aceptar expresamente los presentes Términos y Condiciones.")],
  },
];
