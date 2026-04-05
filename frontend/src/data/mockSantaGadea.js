// Mock Data para Demo Santa Gadea del Cid

export const TENANTS = {
  santagadea: {
    id: "550e8400-e29b-41d4-a716-446655440000",
    subdomain: "santagadea",
    nombre: "Ayuntamiento de Santa Gadea del Cid",
    logo_url: null,
    config: {
      llamadas_ia_enabled: true,
      onyx_workspace_id: "ws_santagadea_001",
      n8n_webhook_url: "https://n8n.centralitaia.com/webhook/santagadea"
    },
    primaryColor: "#1e3a5f",
    created_at: "2024-01-01T00:00:00Z"
  },
  demo: {
    id: "demo-tenant-id",
    subdomain: "demo",
    nombre: "Demo Centralita IA",
    logo_url: null,
    config: {
      llamadas_ia_enabled: true,
      onyx_workspace_id: "ws_demo_001",
      n8n_webhook_url: null
    },
    primaryColor: "#6366f1",
    created_at: "2024-01-01T00:00:00Z"
  }
};

// Generar 24 llamadas para hoy
const generarLlamadas = (tenantId) => {
  const descripciones = [
    "Reserva piscina municipal",
    "Información fiestas patronales",
    "Consulta horario biblioteca",
    "Reserva pabellón deportivo",
    "Queja ruidos nocturnos",
    "Información recogida basura",
    "Consulta padrón municipal",
    "Reserva salón actos",
    "Información licencias obras",
    "Consulta tributos locales",
    "Reserva frontón municipal",
    "Información ayudas sociales",
    "Consulta certificado empadronamiento",
    "Queja aparcamiento indebido",
    "Información mercadillo semanal",
    "Reserva consultorio médico",
    "Consulta bodas civiles",
    "Información transporte escolar",
    "Queja contenedores llenos",
    "Consulta subvenciones",
    "Reserva casa cultura",
    "Información censo electoral",
    "Consulta ordenanzas municipales",
    "Queja farola fundida"
  ];

  const hoy = new Date();
  const llamadas = [];

  for (let i = 0; i < 24; i++) {
    const hora = 8 + Math.floor(i / 3);
    const minuto = (i % 3) * 20 + Math.floor(Math.random() * 15);
    const fecha = new Date(hoy);
    fecha.setHours(hora, minuto, 0, 0);

    llamadas.push({
      id: `call-${String(i + 1).padStart(3, '0')}`,
      tenant_id: tenantId,
      fecha: fecha.toISOString(),
      duracion_segundos: 30 + Math.floor(Math.random() * 270),
      descripcion: descripciones[i],
      proveedor: 'llamadas_ia',
      estado: i === 4 || i === 13 ? 'revision' : 'completada',
      telefono_origen: `+34 6${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
      transcripcion: i === 0 ? `IA: Buenos días, Ayuntamiento de Santa Gadea, ¿en qué puedo ayudarle?
Usuario: Hola, quería reservar la piscina municipal para el sábado.
IA: Por supuesto. ¿Para cuántas personas sería la reserva?
Usuario: Somos 4 adultos y 2 niños.
IA: Perfecto. Le confirmo reserva para 6 personas el sábado 11 de enero. ¿Le envío confirmación por WhatsApp?
Usuario: Sí, gracias.
IA: Listo, reserva confirmada. ¿Necesita algo más?
Usuario: No, muchas gracias.
IA: A usted, que tenga buen día.` : null,
      created_at: fecha.toISOString()
    });
  }

  // Añadir llamadas de días anteriores para el gráfico semanal
  for (let dia = 1; dia <= 6; dia++) {
    const numLlamadas = 15 + Math.floor(Math.random() * 15);
    for (let j = 0; j < numLlamadas; j++) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - dia);
      fecha.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0, 0);
      
      llamadas.push({
        id: `call-prev-${dia}-${j}`,
        tenant_id: tenantId,
        fecha: fecha.toISOString(),
        duracion_segundos: 30 + Math.floor(Math.random() * 270),
        descripcion: descripciones[Math.floor(Math.random() * descripciones.length)],
        proveedor: 'llamadas_ia',
        estado: Math.random() > 0.9 ? 'revision' : 'completada',
        telefono_origen: `+34 6${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
        transcripcion: null,
        created_at: fecha.toISOString()
      });
    }
  }

  return llamadas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
};

export const LLAMADAS_MOCK = {
  santagadea: generarLlamadas(TENANTS.santagadea.id),
  demo: generarLlamadas(TENANTS.demo.id)
};

export const INCIDENCIAS_MOCK = {
  santagadea: [
    {
      id: "inc-001",
      tenant_id: TENANTS.santagadea.id,
      titulo: "Farola fundida Plaza Mayor",
      descripcion: "La farola situada junto al banco de la Plaza Mayor está fundida desde hace 3 días. Zona muy transitada por las noches.",
      ubicacion: "Plaza Mayor, junto al banco",
      prioridad: "alta",
      estado: "abierta",
      categoria: "alumbrado",
      reportado_por: "Vecino anónimo",
      asignado_a: null,
      notas: [],
      created_at: "2026-01-04T08:00:00Z",
      updated_at: "2026-01-04T08:00:00Z",
      closed_at: null
    },
    {
      id: "inc-002",
      tenant_id: TENANTS.santagadea.id,
      titulo: "Fuga de agua en C/ Iglesia",
      descripcion: "Se observa charco constante en la acera del número 5 de la Calle Iglesia. Posible fuga en tubería.",
      ubicacion: "C/ Iglesia, 5",
      prioridad: "alta",
      estado: "abierta",
      categoria: "agua",
      reportado_por: "María García",
      asignado_a: null,
      notas: [],
      created_at: "2026-01-04T09:30:00Z",
      updated_at: "2026-01-04T09:30:00Z",
      closed_at: null
    },
    {
      id: "inc-003",
      tenant_id: TENANTS.santagadea.id,
      titulo: "Bache en Avenida Principal",
      descripcion: "Bache de tamaño medio en la calzada, puede dañar vehículos.",
      ubicacion: "Av. Principal, altura nº 23",
      prioridad: "media",
      estado: "en_progreso",
      categoria: "vias_publicas",
      reportado_por: "Pedro López",
      asignado_a: "Brigada Municipal",
      notas: [
        {
          id: "note-001",
          texto: "Material solicitado para reparación",
          autor: "Brigada Municipal",
          fecha: "2026-01-03T14:00:00Z"
        }
      ],
      created_at: "2026-01-02T10:00:00Z",
      updated_at: "2026-01-03T14:00:00Z",
      closed_at: null
    },
    {
      id: "inc-004",
      tenant_id: TENANTS.santagadea.id,
      titulo: "Contenedor desbordado",
      descripcion: "El contenedor de residuos orgánicos de la calle Real lleva 2 días sin vaciarse.",
      ubicacion: "C/ Real, 12",
      prioridad: "baja",
      estado: "cerrada",
      categoria: "limpieza",
      reportado_por: "Ana Martínez",
      asignado_a: "Servicios Limpieza",
      notas: [
        {
          id: "note-002",
          texto: "Contenedor vaciado y limpiado",
          autor: "Servicios Limpieza",
          fecha: "2026-01-03T11:00:00Z"
        }
      ],
      created_at: "2026-01-02T16:00:00Z",
      updated_at: "2026-01-03T11:00:00Z",
      closed_at: "2026-01-03T11:00:00Z"
    }
  ],
  demo: []
};

export const COMUNICADOS_MOCK = {
  santagadea: [
    {
      id: "com-001",
      tenant_id: TENANTS.santagadea.id,
      titulo: "Corte de agua programado",
      mensaje: "Se informa a los vecinos que el día 05/01 de 09:00 a 14:00 se realizarán trabajos de mantenimiento en la red de agua. Se recomienda aprovisionarse de agua para ese período.",
      canal: "whatsapp",
      destinatarios_count: 234,
      estado: "enviado",
      enviado_at: "2026-01-03T08:00:00Z",
      created_at: "2026-01-02T16:00:00Z"
    },
    {
      id: "com-002",
      tenant_id: TENANTS.santagadea.id,
      titulo: "Fiestas Patronales 2026",
      mensaje: "El Ayuntamiento de Santa Gadea del Cid tiene el placer de anunciar las Fiestas Patronales 2026, que se celebrarán del 15 al 20 de agosto. Programa de actividades disponible en el Ayuntamiento.",
      canal: "ambos",
      destinatarios_count: 456,
      estado: "enviado",
      enviado_at: "2026-01-02T10:00:00Z",
      created_at: "2026-01-02T09:00:00Z"
    },
    {
      id: "com-003",
      tenant_id: TENANTS.santagadea.id,
      titulo: "Nuevo horario biblioteca",
      mensaje: "A partir del 7 de enero, la Biblioteca Municipal amplía su horario de apertura: Lunes a Viernes de 10:00 a 14:00 y de 17:00 a 20:00.",
      canal: "email",
      destinatarios_count: 189,
      estado: "enviado",
      enviado_at: "2025-12-28T09:00:00Z",
      created_at: "2025-12-27T15:00:00Z"
    }
  ],
  demo: []
};

export const calcularKPIs = (tenantSubdomain) => {
  const llamadas = LLAMADAS_MOCK[tenantSubdomain] || [];
  const incidencias = INCIDENCIAS_MOCK[tenantSubdomain] || [];
  const comunicados = COMUNICADOS_MOCK[tenantSubdomain] || [];

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const hace7Dias = new Date(hoy);
  hace7Dias.setDate(hace7Dias.getDate() - 7);

  const llamadasHoy = llamadas.filter(l => new Date(l.fecha) >= hoy).length;
  const llamadasSemana = llamadas.filter(l => new Date(l.fecha) >= hace7Dias).length;
  const incidenciasAbiertas = incidencias.filter(i => i.estado !== 'cerrada').length;
  const incidenciasCerradasSemana = incidencias.filter(i => 
    i.closed_at && new Date(i.closed_at) >= hace7Dias
  ).length;
  const comunicadosEnviadosSemana = comunicados.filter(c => 
    c.enviado_at && new Date(c.enviado_at) >= hace7Dias
  ).length;

  return {
    llamadas_hoy: llamadasHoy,
    llamadas_semana: llamadasSemana,
    incidencias_abiertas: incidenciasAbiertas,
    incidencias_cerradas_semana: incidenciasCerradasSemana,
    comunicados_enviados_semana: comunicadosEnviadosSemana,
    satisfaccion_ia: 98
  };
};

export const obtenerDatosGraficoSemanal = (tenantSubdomain) => {
  const llamadas = LLAMADAS_MOCK[tenantSubdomain] || [];
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const hoy = new Date();
  
  const datosGrafico = [];
  
  for (let i = 6; i >= 0; i--) {
    const fecha = new Date(hoy);
    fecha.setDate(fecha.getDate() - i);
    fecha.setHours(0, 0, 0, 0);
    
    const siguienteDia = new Date(fecha);
    siguienteDia.setDate(siguienteDia.getDate() + 1);
    
    const llamadasDia = llamadas.filter(l => {
      const fechaLlamada = new Date(l.fecha);
      return fechaLlamada >= fecha && fechaLlamada < siguienteDia;
    }).length;
    
    datosGrafico.push({
      dia: dias[fecha.getDay()],
      fecha: fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
      llamadas: llamadasDia,
      llamadasIA: llamadasDia
    });
  }
  
  return datosGrafico;
};
