import { Document, Page, StyleSheet, Text, View, Image, Font } from '@react-pdf/renderer';
import path from 'path';

const FONT_DIR = path.join(process.cwd(), 'public', 'fonts');
Font.register({
    family: 'Inter',
    fonts: [
        { src: path.join(FONT_DIR, 'Inter-Regular.ttf'), fontWeight: 400 },
        { src: path.join(FONT_DIR, 'Inter-Italic.ttf'), fontWeight: 400, fontStyle: 'italic' },
        { src: path.join(FONT_DIR, 'Inter-Medium.ttf'), fontWeight: 500 },
        { src: path.join(FONT_DIR, 'Inter-SemiBold.ttf'), fontWeight: 600 },
        { src: path.join(FONT_DIR, 'Inter-Bold.ttf'), fontWeight: 700 },
        { src: path.join(FONT_DIR, 'Inter-ExtraBold.ttf'), fontWeight: 800 },
    ],
});
Font.registerHyphenationCallback((word) => [word]);

const NAVY = '#0B1E40';
const BLUE = '#1C64B4';
const TEXT_DARK = '#0F172A';
const TEXT_MUTED = '#64748B';
const BORDER_COLOR = '#E2E8F0';
const BG_LIGHT = '#F8FAFC';

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Inter',
        paddingTop: 36,
        paddingBottom: 40,
        paddingHorizontal: 36,
        fontSize: 9,
        color: TEXT_DARK,
        backgroundColor: '#FFFFFF',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingBottom: 16,
        borderBottomWidth: 1.5,
        borderBottomColor: NAVY,
    },
    logoBox: {
        width: 240,
    },
    logoImage: {
        width: 140,
        marginBottom: 6,
    },
    institutionTitle: {
        fontSize: 8,
        fontWeight: 600,
        color: BLUE,
        marginBottom: 2,
    },
    institutionDetails: {
        fontSize: 7.5,
        color: TEXT_MUTED,
        lineHeight: 1.35,
    },
    quoteMetaBox: {
        width: 190,
        backgroundColor: BG_LIGHT,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
        borderRadius: 6,
        padding: 10,
    },
    quoteTitle: {
        fontSize: 13,
        fontWeight: 800,
        color: NAVY,
        textAlign: 'right',
        letterSpacing: 0.5,
    },
    quoteCode: {
        fontSize: 11,
        fontWeight: 700,
        color: BLUE,
        textAlign: 'right',
        marginTop: 2,
        marginBottom: 6,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 2,
    },
    metaLabel: {
        fontSize: 8,
        color: TEXT_MUTED,
        fontWeight: 500,
    },
    metaValue: {
        fontSize: 8,
        color: TEXT_DARK,
        fontWeight: 600,
    },

    // Sección Cliente
    clientSection: {
        marginTop: 14,
        padding: 10,
        backgroundColor: BG_LIGHT,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
        borderRadius: 6,
    },
    sectionHeading: {
        fontSize: 8.5,
        fontWeight: 700,
        color: NAVY,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    clientGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    clientCol: {
        width: '50%',
        marginBottom: 3,
    },
    clientField: {
        flexDirection: 'row',
    },
    clientFieldLabel: {
        width: 70,
        fontSize: 8,
        color: TEXT_MUTED,
        fontWeight: 500,
    },
    clientFieldValue: {
        flex: 1,
        fontSize: 8,
        fontWeight: 600,
        color: TEXT_DARK,
    },

    // Tabla de Ítems
    itemsTable: {
        marginTop: 14,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
        borderRadius: 6,
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: NAVY,
        paddingVertical: 7,
        paddingHorizontal: 8,
    },
    thNum: { width: '6%', fontSize: 7.5, fontWeight: 700, color: '#FFFFFF', textAlign: 'center' },
    thDesc: { width: '50%', fontSize: 7.5, fontWeight: 700, color: '#FFFFFF' },
    thQty: { width: '12%', fontSize: 7.5, fontWeight: 700, color: '#FFFFFF', textAlign: 'center' },
    thPrice: { width: '16%', fontSize: 7.5, fontWeight: 700, color: '#FFFFFF', textAlign: 'right' },
    thSub: { width: '16%', fontSize: 7.5, fontWeight: 700, color: '#FFFFFF', textAlign: 'right' },

    tableRow: {
        flexDirection: 'row',
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: BORDER_COLOR,
        alignItems: 'center',
    },
    tableRowAlt: {
        backgroundColor: '#FAFCFE',
    },
    tdNum: { width: '6%', fontSize: 8, color: TEXT_MUTED, textAlign: 'center' },
    tdDesc: { width: '50%', fontSize: 8, fontWeight: 500, color: TEXT_DARK },
    tdQty: { width: '12%', fontSize: 8, color: TEXT_DARK, textAlign: 'center' },
    tdPrice: { width: '16%', fontSize: 8, color: TEXT_DARK, textAlign: 'right' },
    tdSub: { width: '16%', fontSize: 8, fontWeight: 700, color: NAVY, textAlign: 'right' },

    // Totales y Condiciones
    bottomSection: {
        flexDirection: 'row',
        marginTop: 14,
        gap: 12,
    },
    conditionsBox: {
        flex: 1,
        padding: 10,
        backgroundColor: BG_LIGHT,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
        borderRadius: 6,
    },
    conditionTitle: {
        fontSize: 8,
        fontWeight: 700,
        color: NAVY,
        marginBottom: 3,
        textTransform: 'uppercase',
    },
    conditionText: {
        fontSize: 7.5,
        color: TEXT_MUTED,
        lineHeight: 1.4,
        marginBottom: 6,
    },
    bankBlock: {
        marginTop: 4,
        paddingTop: 4,
        borderTopWidth: 1,
        borderTopColor: BORDER_COLOR,
    },
    bankText: {
        fontSize: 7.5,
        color: TEXT_DARK,
        lineHeight: 1.35,
    },

    totalsBox: {
        width: 190,
        padding: 10,
        backgroundColor: BG_LIGHT,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
        borderRadius: 6,
        justifyContent: 'center',
    },
    totalsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 3,
    },
    totalMainRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 6,
        marginTop: 4,
        borderTopWidth: 1.5,
        borderTopColor: NAVY,
    },
    totalsLabel: {
        fontSize: 8.5,
        color: TEXT_MUTED,
    },
    totalsValue: {
        fontSize: 8.5,
        fontWeight: 600,
        color: TEXT_DARK,
    },
    totalMainLabel: {
        fontSize: 10,
        fontWeight: 800,
        color: NAVY,
    },
    totalMainValue: {
        fontSize: 11,
        fontWeight: 800,
        color: BLUE,
    },

    // Bloque de Firma y Aprobación
    signatureSection: {
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    signatureBlock: {
        width: 180,
        alignItems: 'center',
    },
    signatureImage: {
        width: 100,
        height: 36,
        objectFit: 'contain',
    },
    stampImage: {
        width: 60,
        height: 60,
        objectFit: 'contain',
        position: 'absolute',
        top: -15,
        right: 10,
        opacity: 0.85,
    },
    signatureLine: {
        borderTopWidth: 1,
        borderTopColor: TEXT_MUTED,
        width: '100%',
        marginTop: 2,
    },
    signatureName: {
        fontSize: 8.5,
        fontWeight: 700,
        color: NAVY,
        marginTop: 4,
    },
    signatureRole: {
        fontSize: 7.5,
        color: TEXT_MUTED,
    },

    acceptanceBlock: {
        width: 200,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: TEXT_MUTED,
        borderRadius: 4,
        padding: 8,
        alignItems: 'center',
    },
    acceptanceTitle: {
        fontSize: 7.5,
        fontWeight: 700,
        color: TEXT_MUTED,
        marginBottom: 26,
    },
    acceptanceLine: {
        borderTopWidth: 1,
        borderTopColor: TEXT_MUTED,
        width: '85%',
        marginBottom: 3,
    },
    acceptanceSub: {
        fontSize: 7,
        color: TEXT_MUTED,
    },

    // Pie de página
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 36,
        right: 36,
        borderTopWidth: 0.5,
        borderTopColor: BORDER_COLOR,
        paddingTop: 6,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 7,
        color: TEXT_MUTED,
    },
});

function formatMoney(amount: number) {
    return `$${Math.round(amount).toLocaleString('es-CL')}`;
}

function formatDate(date: Date | string) {
    const d = new Date(date);
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export interface QuotePdfProps {
    code: string;
    version: number;
    issueDate: Date | string;
    validityDays?: number;
    notes?: string | null;
    total: number;
    opportunity: {
        code: string;
        name: string;
        rut?: string | null;
        email: string;
        phone: string;
        company?: string | null;
        comuna?: string | null;
    };
    items: Array<{
        id?: number;
        description: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
    }>;
    executiveName?: string | null;
}

export function QuotePdf({
    code,
    version,
    issueDate,
    validityDays = 15,
    notes,
    total,
    opportunity,
    items,
    executiveName,
}: QuotePdfProps) {
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
    const signaturePath = path.join(process.cwd(), 'public', 'images', 'firma-gustavo.png');
    const timbrePath = path.join(process.cwd(), 'public', 'images', 'timbre-wylar.png');

    const subtotalNeto = total;
    // En capacitación/certificación en Chile muchos servicios son exentos de IVA (art. 12 Ley de IVA) o afectos según factura
    // Mostramos Neto y Total claramente
    const dateFormatted = formatDate(issueDate);

    return (
        <Document title={`Cotización ${code} - Wylar`}>
            <Page size="A4" style={styles.page}>
                {/* Encabezado */}
                <View style={styles.headerRow}>
                    <View style={styles.logoBox}>
                        <Image src={logoPath} style={styles.logoImage} />
                        <Text style={styles.institutionTitle}>Centro de Evaluación y Certificación de Competencias Laborales</Text>
                        <Text style={styles.institutionDetails}>
                            Acreditado por ChileValora · Certificadora Wylar SpA{'\n'}
                            RUT: 76.543.210-K · contacto@wylar.cl · +56 9 2956 6326{'\n'}
                            Av. Libertador Bernardo O&apos;Higgins 252, Santiago · Río Blanco 1371, Arica
                        </Text>
                    </View>

                    <View style={styles.quoteMetaBox}>
                        <Text style={styles.quoteTitle}>COTIZACIÓN</Text>
                        <Text style={styles.quoteCode}>{code} <Text style={{ fontSize: 9, color: TEXT_MUTED }}>v{version}</Text></Text>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Fecha de emisión:</Text>
                            <Text style={styles.metaValue}>{dateFormatted}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Vigencia:</Text>
                            <Text style={styles.metaValue}>{validityDays} días corridos</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Ref. Oportunidad:</Text>
                            <Text style={styles.metaValue}>{opportunity.code}</Text>
                        </View>
                        {executiveName && (
                            <View style={styles.metaRow}>
                                <Text style={styles.metaLabel}>Ejecutivo:</Text>
                                <Text style={styles.metaValue}>{executiveName}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Datos del Cliente */}
                <View style={styles.clientSection}>
                    <Text style={styles.sectionHeading}>Datos del Cliente / Destinatario</Text>
                    <View style={styles.clientGrid}>
                        <View style={styles.clientCol}>
                            <View style={styles.clientField}>
                                <Text style={styles.clientFieldLabel}>Nombre/Razón:</Text>
                                <Text style={styles.clientFieldValue}>{opportunity.name.toUpperCase()}</Text>
                            </View>
                        </View>
                        <View style={styles.clientCol}>
                            <View style={styles.clientField}>
                                <Text style={styles.clientFieldLabel}>RUT:</Text>
                                <Text style={styles.clientFieldValue}>{opportunity.rut || '—'}</Text>
                            </View>
                        </View>
                        <View style={styles.clientCol}>
                            <View style={styles.clientField}>
                                <Text style={styles.clientFieldLabel}>Empresa:</Text>
                                <Text style={styles.clientFieldValue}>{opportunity.company ? opportunity.company.toUpperCase() : 'Particular'}</Text>
                            </View>
                        </View>
                        <View style={styles.clientCol}>
                            <View style={styles.clientField}>
                                <Text style={styles.clientFieldLabel}>Correo:</Text>
                                <Text style={styles.clientFieldValue}>{opportunity.email.toLowerCase()}</Text>
                            </View>
                        </View>
                        <View style={styles.clientCol}>
                            <View style={styles.clientField}>
                                <Text style={styles.clientFieldLabel}>Teléfono:</Text>
                                <Text style={styles.clientFieldValue}>{opportunity.phone}</Text>
                            </View>
                        </View>
                        <View style={styles.clientCol}>
                            <View style={styles.clientField}>
                                <Text style={styles.clientFieldLabel}>Comuna / Ciudad:</Text>
                                <Text style={styles.clientFieldValue}>{opportunity.comuna || 'Chile'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Tabla de Ítems */}
                <View style={styles.itemsTable}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.thNum}>#</Text>
                        <Text style={styles.thDesc}>DESCRIPCIÓN DEL SERVICIO / CURSO / CERTIFICACIÓN</Text>
                        <Text style={styles.thQty}>CANT.</Text>
                        <Text style={styles.thPrice}>PRECIO UNIT.</Text>
                        <Text style={styles.thSub}>TOTAL</Text>
                    </View>

                    {items.map((item, index) => (
                        <View key={index} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
                            <Text style={styles.tdNum}>{index + 1}</Text>
                            <Text style={styles.tdDesc}>{item.description}</Text>
                            <Text style={styles.tdQty}>{item.quantity}</Text>
                            <Text style={styles.tdPrice}>{formatMoney(item.unitPrice)}</Text>
                            <Text style={styles.tdSub}>{formatMoney(item.subtotal)}</Text>
                        </View>
                    ))}
                </View>

                {/* Totales y Condiciones */}
                <View style={styles.bottomSection}>
                    <View style={styles.conditionsBox}>
                        <Text style={styles.conditionTitle}>Condiciones Comerciales y Pago</Text>
                        <Text style={styles.conditionText}>
                            • Validez de la oferta: {validityDays} días a partir de la fecha de emisión.{'\n'}
                            • Forma de pago: Transferencia electrónica / Factura a 30 días con orden de compra.{'\n'}
                            • Incluye proceso completo de evaluación, materiales de prueba y emisión de certificado oficial ChileValora.{'\n'}
                            {notes ? `• Observaciones: ${notes}` : ''}
                        </Text>

                        <View style={styles.bankBlock}>
                            <Text style={styles.conditionTitle}>Datos de Transferencia Bancaria</Text>
                            <Text style={styles.bankText}>
                                Banco Santander · Cuenta Corriente N°: 87654321-0{'\n'}
                                Titular: Certificadora Wylar SpA · RUT: 76.543.210-K{'\n'}
                                Comprobante a: pagos@wylar.cl / contacto@wylar.cl
                            </Text>
                        </View>
                    </View>

                    <View style={styles.totalsBox}>
                        <View style={styles.totalsRow}>
                            <Text style={styles.totalsLabel}>Subtotal Neto:</Text>
                            <Text style={styles.totalsValue}>{formatMoney(subtotalNeto)}</Text>
                        </View>
                        <View style={styles.totalsRow}>
                            <Text style={styles.totalsLabel}>IVA (Exento / Incluido):</Text>
                            <Text style={styles.totalsValue}>$0</Text>
                        </View>
                        <View style={styles.totalMainRow}>
                            <Text style={styles.totalMainLabel}>TOTAL FINAL:</Text>
                            <Text style={styles.totalMainValue}>{formatMoney(total)} CLP</Text>
                        </View>
                    </View>
                </View>

                {/* Firma y Aceptación */}
                <View style={styles.signatureSection}>
                    <View style={styles.signatureBlock}>
                        <View style={{ position: 'relative', width: 100, height: 42, justifyContent: 'center', alignItems: 'center' }}>
                            <Image src={signaturePath} style={styles.signatureImage} />
                            <Image src={timbrePath} style={styles.stampImage} />
                        </View>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureName}>Wylar Ltda.</Text>
                        <Text style={styles.signatureRole}>Área Comercial & Certificación</Text>
                    </View>

                    <View style={styles.acceptanceBlock}>
                        <Text style={styles.acceptanceTitle}>ACEPTACIÓN DEL CLIENTE</Text>
                        <View style={styles.acceptanceLine} />
                        <Text style={styles.acceptanceSub}>Firma / Timbre de Aprobación</Text>
                    </View>
                </View>

                {/* Footer legal */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Documento generado por CRM Wylar · Centro Oficial Acreditado ChileValora</Text>
                    <Text style={styles.footerText}>www.wylar.cl · contacto@wylar.cl</Text>
                </View>
            </Page>
        </Document>
    );
}
