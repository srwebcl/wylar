// Catálogo de perfiles/certificaciones de Wylar.
// Cada perfil tiene un `type` que determina qué plantilla de ficha usa
// (ver src/components/perfil-templates/):
//   - "chilevalora": perfiles ChileValora (electricista, cuidador) — formato institucional.
//   - "soldadura": calificación de soldadores — formato técnico industrial.
//   - "operadores": certificaciones de operadores y Rigger — formato catálogo modular.

export const perfiles = [
    {
        id: "electricista",
        type: "chilevalora",
        title: "Instalador Eléctrico Clase D",
        description: "Evaluación de conocimientos normativos y prácticos para instalaciones de consumo básico. Válido para tramitar licencia SEC.",
        image: "/images/hero_electricista.jpg",
        category: "Construcción",
        sector: "Construcción",
        subsector: "Instalaciones",
        nivel: "Nivel 3",
        target: ['personas', 'empresas'],
        isChileValora: true,
        isFeatured: true,
        link: "/perfil/electricista",

        heroHook: "¿Has aprendido electricidad y sabes desempeñarte como Instalador(a) Eléctrico(a) Clase D?",
        heroParagraphs: [
            "Quizás aprendiste trabajando en una obra, ayudando a un familiar o acompañando a alguien que te enseñó el oficio.",
            "Tal vez comenzaste haciendo trabajos eléctricos por tu cuenta, aprendiste con la experiencia o realizaste un curso de electricidad y luego seguiste desarrollando tus habilidades en la práctica.",
            "Si tienes los conocimientos y habilidades para desempeñarte como Instalador(a) Eléctrico(a) Clase D, puedes acceder a un proceso de evaluación para certificar tus competencias.",
            "No importa cómo aprendiste. Lo importante es que puedas demostrar lo que sabes hacer.",
        ],
        heroCta: "Quiero certificar mis competencias",

        importante: {
            noEsCurso: "La Certificación de Competencias Laborales no corresponde a una capacitación. Es un proceso de evaluación que permite reconocer oficialmente las competencias que una persona ya posee. Si buscas aprender el oficio desde un nivel inicial, primero necesitas una capacitación. Si ya cuentas con los conocimientos y habilidades del perfil, puedes acceder a un proceso de certificación.",
            tituloIntro: "Para acceder al proceso no es requisito contar con un título técnico o profesional. Puedes haber aprendido:",
            tituloBullets: [
                "Trabajando en una empresa o en obras de construcción.",
                "Trabajando de manera independiente.",
                "Realizando trabajos por cuenta propia.",
                "Aprendiendo el oficio junto a un familiar o una persona con experiencia.",
                "Mediante cursos de capacitación.",
                "Combinando experiencia y capacitación.",
            ],
            tituloClosing: "Lo importante es demostrar las competencias requeridas durante la evaluación. El perfil Instalador(a) Eléctrico(a) Clase D no exige requisitos para la evaluación y certificación.",
        },

        queEs: "La Certificación de Competencias Laborales permite reconocer oficialmente que una persona demuestra las competencias definidas por ChileValora para desempeñarse como Instalador(a) Eléctrico(a) Clase D. El proceso es realizado por Wylar como Centro Acreditado por ChileValora, aplicando los estándares establecidos por el Sistema Nacional de Certificación de Competencias Laborales.",

        quienesPueden: {
            intro: "Esta certificación está dirigida a personas que cuentan con conocimientos y competencias en el oficio, por ejemplo:",
            bullets: [
                "Personas que realizan instalaciones eléctricas.",
                "Personas que aprendieron el oficio mediante la experiencia.",
                "Personas que aprendieron trabajando junto a otros electricistas.",
                "Personas que realizan trabajos eléctricos de manera independiente.",
                "Personas que realizaron cursos de electricidad y desean validar oficialmente sus competencias.",
                "Trabajadores dependientes o independientes.",
                "Personas que buscan fortalecer su empleabilidad mediante una certificación oficial.",
            ],
            closing: "Si has aprendido el oficio y sabes hacerlo, puedes dar el siguiente paso y demostrar tus competencias.",
        },

        queSeEvaluaIntro: "Durante el proceso de certificación se evalúan las competencias definidas por ChileValora para el perfil ocupacional Instalador(a) Eléctrico(a) Clase D. Las principales áreas de evaluación son:",
        ucls: [
            { title: "Evaluar las condiciones de seguridad", description: "Evaluar las condiciones de seguridad del entorno de trabajo de acuerdo con la normativa vigente." },
            { title: "Interpretar proyectos eléctricos", description: "Interpretar proyectos eléctricos para instalaciones de consumo." },
            { title: "Instalar conductores y canalizaciones", description: "Instalar conductores y canalizaciones respetando los circuitos diseñados y el código de colores normativo." },
            { title: "Instalar tableros y protecciones", description: "Instalar tableros y protecciones eléctricas, incluyendo termo-magnéticas, diferenciales y puesta a tierra." },
            { title: "Puesta en servicio", description: "Realizar la puesta en servicio de instalaciones eléctricas verificando su correcto funcionamiento y el cumplimiento de la normativa aplicable." },
        ],

        proceso: [
            { title: "Solicita información", description: "Completa el formulario de contacto y uno de nuestros profesionales te orientará." },
            { title: "Revisión y orientación", description: "Conversaremos contigo para conocer tu experiencia y orientarte respecto del proceso de evaluación." },
            { title: "Evaluación de competencias", description: "Un evaluador acreditado aplica los instrumentos establecidos por ChileValora para verificar que demuestras las competencias del perfil." },
            { title: "Revisión de resultados", description: "Se analizan las evidencias obtenidas durante el proceso de evaluación." },
            { title: "Certificación", description: "Si demuestras las competencias del perfil, obtendrás tu Certificación de Competencias Laborales." },
        ],

        porQueCertificar: {
            bullets: [
                "Obtienes un reconocimiento oficial de tus competencias.",
                "Respaldas formalmente los conocimientos adquiridos a lo largo de tu experiencia.",
                "Formalizas y haces visible lo que sabes hacer.",
                "Fortaleces tu perfil y tu posición en el mercado laboral.",
                "Mejoras tus oportunidades de empleabilidad.",
                "Puedes acceder a nuevas oportunidades laborales acordes con tus competencias.",
            ],
            closing: "Reconocer y acreditar formalmente tus competencias puede ayudarte a mejorar tus oportunidades laborales y tus posibilidades de desarrollo e ingresos.",
        },

        faq: [
            { q: "¿Necesito tener un título técnico o profesional?", a: "No. Para este perfil no se exige un título. Lo importante es demostrar las competencias requeridas durante el proceso de evaluación." },
            { q: "¿Puedo certificarme si hice un curso de electricidad?", a: "Sí. Haber realizado un curso puede respaldar tus conocimientos, pero la certificación se obtiene demostrando las competencias del perfil durante la evaluación." },
            { q: "¿Puedo certificarme si aprendí trabajando o de manera independiente?", a: "Sí. ChileValora reconoce las competencias independientemente de cómo fueron adquiridas, siempre que puedas demostrarlas durante el proceso de evaluación." },
            { q: "¿La certificación es un curso?", a: "No. Es un proceso de evaluación de competencias laborales que permite reconocer oficialmente las competencias que ya posees." },
            { q: "¿Qué antecedentes puedo presentar?", a: "Puedes presentar, entre otros, tu currículum, certificados de cursos, cartas de jefatura u otros documentos que respalden tu experiencia o conocimientos." },
            { q: "¿Qué modalidades de pago tienen?", a: "En Wylar contamos con distintos medios de pago para facilitar tu proceso de certificación: pago en efectivo, tarjeta de débito, tarjeta de crédito, transferencia bancaria y convenios de pago con empresas." },
        ],

        cierre: {
            title: "Da el siguiente paso",
            paragraphs: [
                "¿Tienes los conocimientos y sabes desempeñarte como Instalador(a) Eléctrico(a) Clase D?",
                "No importa si aprendiste trabajando, de manera independiente, junto a alguien con experiencia o mediante un curso. Si sabes hacerlo, puedes dar el siguiente paso y demostrar tus competencias.",
                "En Wylar te acompañamos durante el proceso de evaluación para que puedas acceder a la Certificación de Competencias Laborales de Instalador(a) Eléctrico(a) Clase D.",
            ],
            cta: "Solicitar evaluación",
        },

        alert: {
            title: "Consideración importante (Licencia SEC)",
            description: "La certificación de competencias laborales de ChileValora es un mecanismo oficial reconocido por la SEC que facilita el proceso para tramitar la Licencia de Instalador Eléctrico Clase D; sin embargo, el trámite final de obtención de la licencia debe ser realizado por el candidato directamente en la Superintendencia de Electricidad y Combustibles.",
        },
    },

    {
        id: "cuidador",
        type: "chilevalora",
        title: "Cuidador/a de Personas Mayores",
        description: "Asistencia integral y cuidados primarios para adultos mayores. Fundamental para el sector salud y asistencia domiciliaria.",
        image: "/images/hero_cuidador.png",
        category: "Salud",
        sector: "Asistencia y Servicios",
        subsector: "Cuidados",
        nivel: "Nivel 2",
        target: ['personas', 'empresas'],
        isChileValora: true,
        isFeatured: true,
        link: "/perfil/cuidador",

        heroHook: "¿Has cuidado a una persona mayor y sientes que sabes hacerlo?",
        heroParagraphs: [
            "Tal vez aprendiste cuidando a tu mamá, a tu papá, a un familiar o a una persona cercana.",
            "Tal vez trabajaste cuidando personas mayores y aprendiste con la experiencia.",
            "O quizás realizaste un curso de cuidado de personas mayores y quieres demostrar formalmente lo que sabes hacer.",
            "Si tienes los conocimientos y habilidades para desempeñarte como cuidador(a) de personas mayores, puedes acceder a un proceso de evaluación para certificar tus competencias.",
            "No importa dónde aprendiste. Lo importante es que puedas demostrar lo que sabes hacer.",
        ],
        heroCta: "Quiero certificar mis competencias",

        importante: {
            noEsCurso: "La Certificación de Competencias Laborales no es una capacitación. Es un proceso que permite evaluar y reconocer oficialmente las competencias que ya posees para desempeñarte como Cuidador(a) de Personas Mayores. Puedes haber aprendido trabajando, cuidando a un familiar, mediante un curso o a través de distintas experiencias de vida. Si sabes hacerlo, puedes demostrarlo.",
            tituloIntro: "Muchas personas aprenden a cuidar porque la vida las llevó a hacerlo. Quizás comenzaste cuidando a un familiar que necesitaba apoyo, y con el tiempo desarrollaste conocimientos y habilidades relacionadas con el cuidado. También puedes haber adquirido experiencia:",
            tituloBullets: [
                "Trabajando con personas mayores.",
                "Mediante capacitación.",
                "Cuidando a un familiar cercano.",
            ],
            tituloClosing: "Tu experiencia también es una forma de aprendizaje. Para este perfil, ChileValora establece que no existen requisitos para acceder a la evaluación y certificación.",
        },

        queEs: "La Certificación de Competencias Laborales permite reconocer oficialmente que una persona demuestra las competencias necesarias para desempeñarse como Cuidador(a) de Personas Mayores. El perfil contempla servicios de apoyo, acompañamiento y cuidados a personas mayores, considerando sus necesidades, autonomía, independencia, dignidad y bienestar, de acuerdo con las orientaciones del equipo profesional o técnico de salud y la normativa vigente. El proceso es realizado por Wylar como Centro Acreditado por ChileValora.",

        quienesPueden: {
            intro: "Esta certificación está dirigida a personas que han desarrollado competencias y experiencia en el cuidado de personas mayores, independientemente de cómo las hayan adquirido. Por ejemplo:",
            bullets: [
                "Personas que trabajan o han trabajado cuidando a personas mayores.",
                "Personas que han cuidado a sus padres, abuelos, familiares u otras personas cercanas.",
                "Personas que aprendieron el cuidado a través de su propia experiencia de vida.",
                "Personas que realizaron cursos de cuidado de personas mayores.",
                "Personas que actualmente se desempeñan como cuidadoras y quieren reconocer formalmente sus competencias.",
                "Personas que desean fortalecer su perfil y mejorar sus oportunidades laborales.",
            ],
            closing: "Si has cuidado, has aprendido. Y si tienes las competencias, puedes demostrarlo y certificarlas.",
        },

        queSeEvaluaIntro: "Durante el proceso de certificación se evalúan las competencias definidas por ChileValora para el perfil Cuidador(a) de Personas Mayores:",
        ucls: [
            { title: "Actividades de la vida diaria", description: "Colaborar en actividades básicas e instrumentales de la vida diaria de la persona mayor." },
            { title: "Área de salud", description: "Realizar acciones básicas vinculadas al área de salud de la persona mayor." },
            { title: "Vinculación y desarrollo personal", description: "Promover el desarrollo personal y la vinculación con el entorno socioafectivo." },
            { title: "Prevención de riesgos", description: "Prever riesgos de accidentes, desregulación emocional y conductual, y presunción de maltrato hacia la persona mayor." },
        ],

        proceso: [
            { title: "Solicita información", description: "Completa el formulario de contacto y uno de nuestros profesionales te orientará sobre el proceso." },
            { title: "Revisión y orientación", description: "Conversaremos contigo para conocer tu experiencia y orientarte respecto del proceso de evaluación." },
            { title: "Evaluación de competencias", description: "Un evaluador acreditado aplica los instrumentos establecidos por ChileValora para verificar que demuestras las competencias correspondientes al perfil." },
            { title: "Revisión de resultados", description: "Se analizan las evidencias obtenidas durante el proceso de evaluación." },
            { title: "Certificación", description: "Si demuestras las competencias requeridas, obtendrás tu Certificación de Competencias Laborales." },
        ],

        porQueCertificar: {
            bullets: [
                "Obtienes un reconocimiento oficial de tus competencias.",
                "Respaldas formalmente los conocimientos y habilidades que has adquirido.",
                "Haces visible tu experiencia y lo que sabes hacer.",
                "Fortaleces tu perfil laboral.",
                "Mejoras tu posición en el mercado laboral.",
                "Aumentas tus oportunidades de empleabilidad.",
                "Puedes acceder a nuevas oportunidades laborales acordes con tus competencias.",
            ],
            closing: "Reconocer y acreditar formalmente tus competencias puede ayudarte a mejorar tus oportunidades laborales y tus posibilidades de desarrollo e ingresos.",
        },

        faq: [
            { q: "¿Debo realizar un curso antes de certificarme?", a: "No. La certificación evalúa las competencias que ya posees. Puedes haberlas adquirido mediante experiencia laboral, cuidado de familiares, capacitación u otras formas de aprendizaje." },
            { q: "¿Necesito experiencia como cuidador(a)?", a: "Para acceder a la evaluación y certificación de este perfil no existen requisitos de acceso establecidos por ChileValora. La evaluación permitirá determinar si demuestras las competencias definidas para el perfil." },
            { q: "¿Puedo certificarme si aprendí cuidando a un familiar?", a: "Sí. Haber adquirido conocimientos y habilidades cuidando a un familiar es una forma de aprendizaje. Lo importante es que puedas demostrar las competencias correspondientes durante el proceso de evaluación." },
            { q: "¿Puedo certificarme si hice un curso de cuidador(a)?", a: "Sí. Un curso puede haber contribuido a desarrollar tus competencias, pero la certificación se obtiene mediante la demostración de las competencias definidas para el perfil." },
            { q: "¿Necesito tener un título de cuidador(a)?", a: "No. Para acceder a la evaluación y certificación de este perfil, ChileValora establece que no existen requisitos de acceso." },
            { q: "¿Qué modalidades de pago tienen?", a: "En Wylar contamos con distintos medios de pago para facilitar tu proceso de certificación: pago en efectivo, tarjeta de débito, tarjeta de crédito, transferencia bancaria y convenios de pago con empresas." },
        ],

        cierre: {
            title: "Da el siguiente paso",
            paragraphs: [
                "¿Sientes que tienes experiencia y sabes cómo cuidar a una persona mayor?",
                "No importa si aprendiste trabajando, cuidando a un familiar, mediante un curso o a través de tu propia experiencia. Si tienes las competencias, puedes dar el siguiente paso y demostrar lo que sabes hacer.",
                "En Wylar te acompañamos durante el proceso de evaluación para que puedas acceder a la Certificación de Competencias Laborales de Cuidador(a) de Personas Mayores.",
            ],
            cta: "Quiero certificar mis competencias",
        },
    },

    {
        id: "soldador",
        type: "soldadura",
        title: "Calificación de Soldadores",
        description: "Evaluación práctica de habilidades de soldadura estructural bajo parámetros y estándares del código AWS D1.1.",
        image: "/images/catalog_soldador.png",
        category: "Industrial",
        sector: "Metalmecánica",
        subsector: "Soldadura",
        nivel: "Nivel 4",
        vigencia: "2 años",
        target: ['personas', 'empresas'],
        isChileValora: false,
        isFeatured: true,
        link: "/perfil/soldador",

        heroHook: "¿Eres soldador y quieres acreditar lo que sabes hacer?",
        heroParagraphs: [
            "Quizás aprendiste trabajando en un taller, en una empresa o en una obra. Tal vez comenzaste como ayudante y con la práctica fuiste desarrollando tu técnica.",
            "O quizás realizaste un curso de soldadura y ahora quieres respaldar tus competencias mediante una calificación.",
            "No importa cómo aprendiste. Si tienes experiencia práctica y sabes hacerlo, puedes demostrar tus competencias mediante un proceso de calificación.",
            "En Wylar realizamos calificaciones de soldadores de acuerdo con el proceso, posición, material y norma o especificación técnica requerida.",
        ],

        queEs: [
            "La calificación de un soldador es un proceso mediante el cual se verifica que una persona posee las competencias necesarias para ejecutar soldaduras conforme a los requisitos establecidos por una norma técnica.",
            "Durante la evaluación, el soldador demuestra, mediante una prueba práctica, que es capaz de ejecutar uniones soldadas con la calidad exigida para el proceso correspondiente.",
            "La calificación no depende de cómo la persona adquirió sus conocimientos. Las competencias pueden haberse desarrollado mediante experiencia laboral, formación técnica, capacitación o aprendizaje práctico. Lo importante es demostrar dichas competencias durante el proceso de evaluación.",
        ],

        procesos: [
            { code: "SMAW", name: "Electrodo revestido" },
            { code: "GMAW", name: "MIG / MAG" },
            { code: "GTAW", name: "TIG" },
            { code: "FCAW", name: "Alambre tubular" },
        ],
        necesitasOtroProceso: "En Wylar realizamos calificaciones a la medida de los requerimientos de cada empresa, proyecto o mandante. Contáctanos y evaluaremos tu requerimiento.",

        posiciones: {
            placa: ["1G", "2G", "3G", "4G"],
            tuberia: ["1G", "2G", "5G", "6G"],
            note: "La posición a evaluar se define de acuerdo con los requerimientos del cliente, el proceso de soldadura y el alcance de la calificación.",
        },

        materiales: {
            items: ["Acero al carbono", "Aceros de baja aleación", "Acero inoxidable", "Aluminio", "Otros materiales, previa evaluación técnica"],
            note: "La norma de calificación se define de acuerdo con el material, proceso y alcance requerido.",
        },

        normas: {
            title: "AWS D1.1 — Structural Welding Code — Steel",
            text: "Nuestros procesos de calificación se desarrollan principalmente conforme a AWS D1.1, norma de referencia para soldadura estructural en acero. Si el cliente requiere otra norma o especificación técnica, Wylar evaluará la factibilidad del proceso y la normativa aplicable.",
        },

        aMedida: {
            title: "Calificaciones a la medida de tu requerimiento",
            text: "En Wylar realizamos procesos de calificación adaptados a las necesidades de cada empresa, proyecto o mandante. Podemos definir el proceso de calificación considerando, entre otros aspectos:",
            items: ["Proceso de soldadura", "Material", "Posición", "Alcance de la calificación", "Norma o especificación técnica aplicable"],
            closing: "¿Tienes un requerimiento específico? Contáctanos y lo revisamos.",
        },

        incluye: [
            "Evaluación práctica del soldador.",
            "Supervisión técnica durante la ejecución.",
            "Inspección visual de la probeta.",
            "Evaluación del cupón de soldadura mediante los métodos de inspección y ensayo definidos para el proceso de calificación conforme a la norma aplicable.",
            "Registro de resultados.",
            "Emisión del Certificado de Calificación.",
            "Emisión de Credencial de Soldador Calificado con código QR.",
        ],

        quienesPueden: [
            { title: "Personas", text: "Soldadores que desean acreditar sus competencias para acceder a nuevas oportunidades laborales o respaldar su experiencia." },
            { title: "Empresas", text: "Organizaciones que requieren calificar a sus soldadores para proyectos, licitaciones, contratos o procesos internos." },
            { title: "OTEC", text: "Organismos Técnicos de Capacitación que desean complementar sus cursos de soldadura mediante procesos formales de calificación para sus participantes." },
        ],

        proceso: [
            { title: "Solicitud de la calificación", description: "Nos indicas qué necesitas calificar y nuestro equipo te orientará." },
            { title: "Definición del proceso y alcance", description: "Definimos el proceso de soldadura, material, posición, alcance y norma o especificación técnica aplicable." },
            { title: "Programación de la evaluación", description: "Coordinamos fecha, lugar y condiciones necesarias para realizar el proceso." },
            { title: "Ejecución de la prueba práctica", description: "El soldador ejecuta la probeta de acuerdo con los requisitos establecidos para la calificación." },
            { title: "Evaluación del cupón de soldadura", description: "Se realizan la inspección y los ensayos definidos para el proceso de calificación conforme a la norma aplicable." },
            { title: "Emisión de documentos", description: "Una vez finalizado el proceso, se emite el Certificado de Calificación y la Credencial de Soldador Calificado." },
        ],

        trazabilidad: {
            title: "Certificados verificables en línea",
            text: "En Wylar creemos que una calificación debe entregar confianza tanto al soldador como a la empresa que contrata sus servicios. Por ello, cada Certificado de Calificación y cada Credencial de Soldador Calificado cuentan con un código único de validación y un código QR, permitiendo verificar en línea:",
            items: ["Datos del titular", "Autenticidad del certificado", "Vigencia de la calificación", "Proceso de soldadura calificado"],
            closing: "La validación se realiza directamente desde www.wylar.cl, entregando mayor transparencia, seguridad y trazabilidad para trabajadores, empresas y mandantes.",
        },

        faq: [
            { q: "¿Debo realizar un curso antes de calificarme?", a: "No. La calificación evalúa las competencias que posee como soldador, independientemente de cómo las haya adquirido. Puede haber aprendido mediante experiencia laboral, formación técnica, capacitación o aprendizaje práctico. Lo importante es demostrar sus competencias durante el proceso de evaluación." },
            { q: "¿Necesito experiencia práctica?", a: "Sí. La calificación está dirigida a personas que ya poseen experiencia práctica en el proceso de soldadura que desean evaluar, independientemente de cómo hayan adquirido esa experiencia." },
            { q: "¿Qué procesos de soldadura puedo calificar?", a: "Wylar realiza calificaciones en distintos procesos: SMAW (electrodo revestido), GMAW (MIG/MAG), GTAW (TIG) y FCAW (alambre tubular). Si requiere otro proceso, contáctenos para evaluar su requerimiento." },
            { q: "¿Puedo elegir la posición en la que quiero calificarme?", a: "Sí. La posición se define de acuerdo con sus necesidades, el proceso de soldadura y el alcance de la calificación." },
            { q: "¿Puedo calificarme en más de un proceso de soldadura?", a: "Sí. Un mismo soldador puede realizar calificaciones en uno o más procesos de soldadura, según sus necesidades o requerimientos laborales." },
            { q: "¿Puedo solicitar una calificación específica para mi empresa?", a: "Sí. En Wylar realizamos calificaciones a la medida de los requerimientos de cada empresa, proyecto o mandante, considerando el proceso, material, posición, alcance y norma o especificación técnica aplicable." },
            { q: "¿Las empresas pueden calificar varios soldadores al mismo tiempo?", a: "Sí. Wylar desarrolla procesos de calificación individuales o grupales, adaptándose a la cantidad de trabajadores y a la planificación de cada empresa." },
            { q: "¿Realizan evaluaciones en las instalaciones de la empresa?", a: "Sí. Podemos realizar procesos de calificación en las instalaciones del cliente, siempre que estas cuenten con las condiciones técnicas, de seguridad y de infraestructura necesarias para desarrollar adecuadamente la evaluación." },
            { q: "¿Qué sucede si no apruebo la evaluación?", a: "Si no aprueba la evaluación, podrá presentarse nuevamente a un nuevo proceso de calificación una vez que haya reforzado las competencias necesarias para el proceso de soldadura correspondiente." },
            { q: "¿Qué vigencia tiene la calificación?", a: "Los Certificados de Calificación emitidos por Wylar tienen una vigencia de dos años. Finalizado este período, el soldador podrá renovar su calificación mediante un nuevo proceso de evaluación." },
            { q: "¿Qué documentos recibo al aprobar?", a: "Al aprobar el proceso de calificación recibirá el Certificado de Calificación (con código único de validación) y la Credencial de Soldador Calificado (con código QR para verificación inmediata). Ambos documentos pueden verificarse en línea a través de www.wylar.cl." },
            { q: "¿Qué modalidades de pago tienen?", a: "En Wylar contamos con distintos medios de pago para facilitar la contratación del servicio: pago en efectivo, tarjeta de débito, tarjeta de crédito, transferencia bancaria y convenios de pago con empresas." },
        ],

        cierre: {
            title: "¿Listo para iniciar tu proceso de calificación?",
            items: [
                "Calificarte como soldador para acreditar tus competencias.",
                "Calificar a los trabajadores de tu empresa para proyectos, licitaciones o procesos internos.",
                "Calificar a los participantes que han finalizado un curso de soldadura, complementando su proceso formativo con una evaluación práctica.",
            ],
            closing: "En Wylar te acompañamos durante el proceso y te orientamos para definir el proceso de soldadura, material, posición, alcance y norma o especificación técnica que corresponda a tu requerimiento.",
        },
    },

    {
        id: "rigger",
        type: "operadores",
        title: "Operador Rigger",
        description: "Certificación de maniobras y estiba segura de cargas pesadas mediante grúas. Vital para la seguridad en obras.",
        image: "/images/catalog_rigger.jpg",
        category: "Construcción",
        sector: "Construcción",
        subsector: "Montaje Industrial",
        nivel: "Nivel 3",
        vigencia: "2 años",
        target: ['personas', 'empresas'],
        isChileValora: false,
        isFeatured: true,
        link: "/perfil/rigger",

        heroHook: "¿Tienes experiencia operando maquinaria o realizando labores de izaje y sabes hacerlo?",
        heroParagraphs: [
            "Quizás aprendiste trabajando en una obra, en una faena o en una empresa. Tal vez comenzaste como ayudante y, con la práctica y la experiencia, aprendiste a operar una máquina.",
            "O quizás un familiar, compañero de trabajo o alguien con experiencia te enseñó y, con el tiempo, fuiste desarrollando tus conocimientos y habilidades.",
            "No importa cómo aprendiste. Lo importante es que tengas los conocimientos y habilidades para demostrar lo que sabes hacer.",
            "En Wylar realizamos certificaciones privadas de competencias para distintos equipos y funciones, adaptadas a los requerimientos de cada persona, empresa, proyecto o mandante.",
        ],

        intro: {
            title: "Certificación privada Wylar",
            text: "En Wylar desarrollamos procesos de evaluación y certificación que permiten acreditar y respaldar las competencias demostradas por cada participante. Las certificaciones emitidas por Wylar tienen una vigencia de dos años y son verificables en línea.",
        },

        necesitasOtro: "Contáctanos. Incorporamos nuevos perfiles y podemos evaluar requerimientos específicos de empresas y organizaciones.",

        aMedida: {
            title: "¿Necesitas certificar un equipo o función específica?",
            text: "No todas las empresas necesitan certificar lo mismo. En Wylar realizamos procesos de certificación adaptados a las necesidades de cada persona, empresa, proyecto o mandante, considerando el equipo o función que se requiere acreditar. Si el perfil que necesitas no aparece en nuestro catálogo, contáctanos y evaluaremos tu requerimiento.",
        },

        quienesPueden: [
            { title: "Personas", text: "Operadores y trabajadores que desean acreditar sus competencias, respaldar su experiencia y fortalecer su perfil laboral." },
            { title: "Empresas", text: "Organizaciones que necesitan acreditar las competencias de sus trabajadores para proyectos, faenas, contratos, procesos internos o requerimientos de sus mandantes." },
            { title: "OTEC", text: "Organismos Técnicos de Capacitación que desean complementar sus cursos mediante procesos de evaluación y certificación para sus participantes." },
        ],

        proceso: [
            { title: "Solicita información", description: "Indícanos qué equipo o función necesitas certificar y uno de nuestros profesionales te orientará." },
            { title: "Definición del alcance", description: "Revisamos el equipo, función y requerimientos de la certificación." },
            { title: "Programación de la evaluación", description: "Coordinamos la fecha, lugar y condiciones necesarias para realizar el proceso." },
            { title: "Evaluación", description: "Se aplican las evaluaciones correspondientes al perfil o equipo que se desea certificar." },
            { title: "Revisión de resultados", description: "Se analizan las evidencias obtenidas durante el proceso de evaluación." },
            { title: "Certificación", description: "Si el participante demuestra las competencias requeridas, se emite su certificación correspondiente." },
        ],

        incluye: {
            intro: "Cada proceso se define de acuerdo con el equipo o perfil que se desea certificar y puede considerar:",
            items: ["Evaluación de conocimientos", "Evaluación práctica", "Evaluación de las competencias requeridas para el equipo o función", "Registro de resultados", "Emisión del certificado correspondiente"],
            note: "El alcance específico de la evaluación se informa antes de iniciar el proceso.",
        },

        verificables: {
            title: "Certificaciones verificables en línea",
            text: "Las certificaciones emitidas por Wylar cuentan con verificación en línea, permitiendo comprobar su autenticidad y vigencia mediante el código de validación y/o código QR. Esto facilita la validación de las certificaciones por parte de empresas, contratistas y mandantes.",
        },

        porQueCertificar: {
            intro: "Una certificación Wylar permite respaldar formalmente las competencias demostradas durante el proceso de evaluación y contar con un documento que puedes presentar ante empresas, contratistas y potenciales empleadores.",
            items: [
                "Acreditas formalmente tus conocimientos y habilidades.",
                "Respaldas tu experiencia como operador o trabajador especializado.",
                "Haces visible lo que sabes hacer frente a potenciales empleadores.",
                "Fortaleces tu perfil laboral.",
                "Mejoras tu posición en el mercado.",
                "Amplías tus oportunidades de empleabilidad.",
                "Puedes acceder a oportunidades laborales en distintos sectores productivos.",
                "Cuentas con un respaldo documental de las competencias evaluadas.",
            ],
        },

        oportunidades: [
            {
                title: "Una certificación puede abrirte nuevas oportunidades",
                text: "En sectores como la minería, construcción e industria, muchas empresas establecen requisitos o solicitan acreditaciones para trabajadores que ingresan a determinados proyectos o faenas. Esto es especialmente relevante en la industria minera de la zona norte, donde las empresas y sus contratistas pueden requerir determinadas certificaciones o acreditaciones para sus trabajadores. Contar con una certificación que respalde tus competencias puede ampliar tus posibilidades de ser considerado en procesos de selección y reclutamiento, y ayudarte a acceder a nuevas oportunidades laborales.",
            },
            {
                title: "Certificación y oportunidades laborales",
                text: "Quizás llevas años operando una máquina, realizando labores de apoyo en una faena o trabajando en actividades de izaje, pero no cuentas con un documento que respalde formalmente lo que sabes hacer. Certificar tus competencias permite transformar esa experiencia en un respaldo que puedes presentar ante empresas y potenciales empleadores. Una certificación no reemplaza los requisitos específicos que pueda establecer cada empresa, faena o mandante, pero puede fortalecer tu perfil y ayudarte a estar mejor preparado para nuevas oportunidades.",
            },
        ],

        faq: [
            { q: "¿Necesito haber realizado un curso para certificarme?", a: "No necesariamente. La certificación busca evaluar las competencias que ya posees. Puedes haber adquirido tus conocimientos mediante experiencia laboral, práctica, capacitación u otras formas de aprendizaje." },
            { q: "¿Necesito experiencia previa?", a: "La certificación está dirigida a personas que cuentan con conocimientos y experiencia práctica relacionados con el equipo o función que desean certificar." },
            { q: "¿Puedo certificarme si aprendí trabajando?", a: "Sí. Puedes haber desarrollado tus competencias trabajando en una empresa, faena, obra o de manera práctica junto a personas con experiencia. Lo importante es demostrar las competencias requeridas durante el proceso de evaluación." },
            { q: "¿Puedo certificar más de un equipo?", a: "Sí. Puedes realizar procesos de certificación para distintos equipos, de acuerdo con tus necesidades y las condiciones de evaluación correspondientes a cada perfil." },
            { q: "¿Las empresas pueden certificar a varios trabajadores?", a: "Sí. Wylar puede organizar procesos individuales o grupales para empresas que necesiten certificar a varios trabajadores." },
            { q: "¿Las OTEC pueden certificar a sus participantes?", a: "Sí. Wylar trabaja con OTEC que requieren complementar sus procesos formativos mediante la evaluación y certificación de sus participantes." },
            { q: "¿Pueden realizar la evaluación en las instalaciones de mi empresa?", a: "Sí. Podemos evaluar en las instalaciones del cliente, siempre que existan las condiciones técnicas, de seguridad, infraestructura y equipamiento necesarias para realizar adecuadamente el proceso." },
            { q: "¿Puedo solicitar la certificación de un equipo que no aparece en la página?", a: "Sí. Realizamos certificaciones a la medida de los requerimientos de cada cliente. Si necesitas certificar otro equipo o función, contáctanos para revisar tu requerimiento." },
            { q: "¿La certificación sirve para ingresar a una faena minera?", a: "La certificación puede ser solicitada o valorada por empresas, contratistas o mandantes como parte de sus requisitos para determinados cargos, proyectos o faenas. Los requisitos de ingreso dependen de cada empresa, proyecto o mandante." },
            { q: "¿Cómo pueden las empresas verificar mi certificación?", a: "Las certificaciones emitidas por Wylar pueden ser verificadas en línea mediante el código de validación y/o código QR incorporado en la documentación entregada." },
            { q: "¿Cuánto tiempo dura la certificación?", a: "Las certificaciones emitidas por Wylar tienen una vigencia de dos años. Una vez finalizado este período, la persona podrá realizar un nuevo proceso de evaluación para renovar su certificación." },
            { q: "¿Cuánto demora el proceso de certificación?", a: "El tiempo puede variar según el equipo o función que se desea certificar, la modalidad de evaluación, la cantidad de participantes y la coordinación necesaria para realizar el proceso. Al solicitar información, Wylar te orientará sobre los tiempos estimados para tu proceso específico." },
            { q: "¿Qué modalidades de pago tienen?", a: "En Wylar contamos con distintos medios de pago para facilitar tu proceso de certificación: pago en efectivo, tarjeta de débito, tarjeta de crédito, transferencia bancaria y convenios de pago con empresas." },
        ],

        cierre: {
            title: "¿Tienes experiencia y quieres acreditar lo que sabes hacer?",
            items: [
                "Certificarte como operador de maquinaria.",
                "Certificarte como Rigger.",
                "Certificar a los trabajadores de tu empresa.",
                "Complementar un curso de capacitación mediante una certificación.",
                "Solicitar la certificación de otro equipo o función.",
            ],
            closing: "En Wylar te orientamos para definir el proceso de certificación que mejor se ajuste a tus necesidades. Tu experiencia tiene valor. Da el siguiente paso y acredita tus competencias.",
        },
    },
];
