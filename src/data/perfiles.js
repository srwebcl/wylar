export const perfiles = [
    {
        id: "electricista",
        title: "Instalador Eléctrico Clase D",
        description: "Evaluación de conocimientos normativos y prácticos para instalaciones de consumo básico. Válido para tramitar licencia SEC.",
        proposito: "Realizar la instalación, mantenimiento y reparación de sistemas eléctricos de consumo en baja tensión (Clase D), interpretando planos, seleccionando materiales adecuados y aplicando rigurosamente los protocolos de seguridad y normativas establecidas por la Superintendencia de Electricidad y Combustibles (SEC).",
        image: "/images/hero_electricista.jpg",
        category: "Construcción",
        sector: "Construcción",
        subsector: "Instalaciones",
        nivel: "Nivel 3",
        target: ['personas', 'empresas'],
        isChileValora: true,
        isFeatured: true,
        link: "/perfil/electricista",
        ucls: [
            {
                title: "Preparación de las condiciones de trabajo",
                description: "Organizar herramientas, materiales y elementos de protección personal (EPP) de acuerdo con los requerimientos del proyecto y normas de seguridad."
            },
            {
                title: "Ejecución de canalizaciones y cableado",
                description: "Instalar ductos, cajas y conductores eléctricos respetando los circuitos diseñados, secciones de conductores y código de colores normativo."
            },
            {
                title: "Montaje de tableros y equipos",
                description: "Instalar tableros de distribución, protecciones termo-magnéticas, diferenciales y sistemas de puesta a tierra garantizando la selectividad y operatividad segura."
            }
        ],
        alert: {
            title: "Consideración Importante (Licencia SEC)",
            description: "La certificación de competencias laborales de ChileValora es un mecanismo oficial reconocido por la SEC que facilita el proceso para tramitar la Licencia de Instalador Eléctrico Clase D, sin embargo, el trámite final de obtención de la licencia debe ser realizado por el candidato directamente en la Superintendencia de Electricidad y Combustibles."
        }
    },
    {
        id: "cuidador",
        title: "Cuidador/a de Personas Mayores",
        description: "Asistencia integral y cuidados primarios para adultos mayores. Fundamental para el sector salud y asistencia domiciliaria.",
        proposito: "Asistir y cuidar a personas mayores en sus actividades de la vida diaria, considerando sus necesidades bio-psico-sociales, promoviendo su autonomía y bienestar según los protocolos establecidos y principios bioéticos.",
        image: "/images/hero_cuidador.png",
        category: "Salud",
        sector: "Asistencia y Servicios",
        subsector: "Cuidados",
        nivel: "Nivel 2",
        target: ['personas', 'empresas'],
        isChileValora: true,
        isFeatured: true,
        link: "/perfil/cuidador",
        ucls: [
            {
                title: "Asistencia en actividades de la vida diaria",
                description: "Apoyar en la alimentación, higiene, vestuario y movilidad de la persona mayor, respetando su autonomía y privacidad."
            },
            {
                title: "Prevención y manejo de riesgos",
                description: "Identificar y mitigar factores de riesgo en el entorno, aplicando técnicas de primeros auxilios y manejo de emergencias básicas."
            }
        ]
    },
    {
        id: "soldador",
        title: "Soldador Calificado AWS D1.1",
        description: "Evaluación práctica de habilidades de soldadura estructural bajo parámetros y estándares del código AWS D1.1.",
        proposito: "Ejecutar uniones soldadas en estructuras metálicas de acero al carbono, utilizando procesos específicos (SMAW, GMAW, FCAW) en diversas posiciones, cumpliendo estrictamente con los criterios de aceptación del código estructural AWS D1.1.",
        image: "/images/catalog_soldador.png",
        category: "Industrial",
        sector: "Metalmecánica",
        subsector: "Soldadura",
        nivel: "Nivel 4",
        target: ['personas', 'empresas'],
        isChileValora: false,
        isFeatured: true,
        link: "/perfil/soldador",
        ucls: [
            {
                title: "Preparación de juntas y equipos",
                description: "Acondicionar los bordes a soldar, ensamblar las piezas y calibrar la máquina de soldar según el procedimiento especificado (WPS)."
            },
            {
                title: "Ejecución de pases de soldadura",
                description: "Depositar cordones de raíz, relleno y presentación en las posiciones requeridas (1G, 2G, 3G, 4G), controlando variables térmicas."
            }
        ]
    },
    {
        id: "rigger",
        title: "Operador Rigger",
        description: "Certificación de maniobras y estiba segura de cargas pesadas mediante grúas. Vital para la seguridad en obras.",
        proposito: "Dirigir y coordinar maniobras de izaje y movimiento de cargas suspendidas utilizando equipos de levante, seleccionando los elementos de estrobaje adecuados y comunicándose efectivamente con el operador de la grúa mediante señales estandarizadas.",
        image: "/images/catalog_rigger.jpg",
        category: "Construcción",
        sector: "Construcción",
        subsector: "Montaje Industrial",
        nivel: "Nivel 3",
        target: ['personas', 'empresas'],
        isChileValora: false,
        isFeatured: true,
        link: "/perfil/rigger",
        ucls: [
            {
                title: "Aparejo y estrobaje de carga",
                description: "Calcular pesos, seleccionar eslingas, estrobos y grilletes adecuados según la capacidad de carga y centro de gravedad."
            },
            {
                title: "Dirección de la maniobra",
                description: "Guiar al operador de la grúa mediante código de señales manuales y radiales, asegurando trayectorias libres de obstáculos y personas."
            }
        ]
    }
];
