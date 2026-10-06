import { Document, Page, StyleSheet, Text, View, Image, Font } from '@react-pdf/renderer';
import path from 'path';

// --- Tipografía ---
// Bitter (slab serif): usada solo en los momentos ceremoniales (título,
// nombre del titular, nombre del curso) — una serif de trazo grueso y
// estructural, con el carácter de una placa grabada, acorde a un
// documento de competencia laboral de oficios técnicos.
// Inter: la tipografía de marca que ya usa todo el CRM, para etiquetas,
// cuerpo y metadatos — no se inventa una segunda familia sin relación
// con el resto del producto.
const FONT_DIR = path.join(process.cwd(), 'public', 'fonts');
Font.register({
    family: 'Bitter',
    fonts: [
        { src: path.join(FONT_DIR, 'Bitter-Medium.ttf'), fontWeight: 500 },
        { src: path.join(FONT_DIR, 'Bitter-Bold.ttf'), fontWeight: 700 },
        { src: path.join(FONT_DIR, 'Bitter-BoldItalic.ttf'), fontWeight: 700, fontStyle: 'italic' },
        { src: path.join(FONT_DIR, 'Bitter-Black.ttf'), fontWeight: 900 },
    ],
});
Font.register({
    family: 'Inter',
    fonts: [
        { src: path.join(FONT_DIR, 'Inter-Regular.ttf'), fontWeight: 400 },
        { src: path.join(FONT_DIR, 'Inter-Italic.ttf'), fontWeight: 400, fontStyle: 'italic' },
        { src: path.join(FONT_DIR, 'Inter-Medium.ttf'), fontWeight: 500 },
        { src: path.join(FONT_DIR, 'Inter-SemiBold.ttf'), fontWeight: 600 },
        { src: path.join(FONT_DIR, 'Inter-Bold.ttf'), fontWeight: 700 },
    ],
});
Font.registerHyphenationCallback((word) => [word]);

// --- Paleta ---
// Los tres tokens de marca de Wylar (navy/cian/ámbar), sin inventar un
// cuarto color: el papel es un gris-azulado frío (no el crema cálido
// genérico) para quedar en la misma familia cromática que la franja navy.
const NAVY = '#0B1E40';
const CYAN = '#0891b2';
const AMBER = '#f59e0b';
const PAPER = '#F7F8FA';
const INK = '#26354A';
const MUTED = '#64748B';

const BAND_WIDTH = 158;

const styles = StyleSheet.create({
    page: { padding: 16, fontFamily: 'Inter', backgroundColor: '#E7EAEF' },
    card: { flex: 1, flexDirection: 'row', borderWidth: 1, borderColor: NAVY },

    // --- Franja de identidad (izquierda) ---
    band: { width: BAND_WIDTH, backgroundColor: NAVY, alignItems: 'center', paddingVertical: 30, position: 'relative' },
    bandRule: { position: 'absolute', top: 0, right: 0, bottom: 0, width: 3, backgroundColor: AMBER },
    seal: { width: 76, height: 76 },
    bandWordmark: { fontFamily: 'Bitter', fontWeight: 700, fontSize: 15, color: '#FFFFFF', letterSpacing: 3, marginTop: 16 },
    bandSpine: {
        fontFamily: 'Inter',
        fontWeight: 600,
        fontSize: 7.5,
        color: '#8FD3E8',
        letterSpacing: 2.2,
        textAlign: 'center',
        transform: 'rotate(-90deg)',
        width: 220,
    },

    // --- Contenido (derecha) ---
    content: { flex: 1, backgroundColor: PAPER, padding: 34, flexDirection: 'column' },

    topRow: { flexDirection: 'row', justifyContent: 'flex-end' },
    codeTag: { fontSize: 8.5, color: MUTED, fontFamily: 'Inter' },
    codeValue: { fontSize: 10.5, fontFamily: 'Inter', fontWeight: 700, color: NAVY, marginTop: 1 },

    main: { flex: 1, justifyContent: 'center' },

    kicker: { fontSize: 9.5, fontFamily: 'Inter', fontWeight: 500, color: CYAN },
    title: { fontSize: 33, fontFamily: 'Bitter', fontWeight: 900, color: NAVY, marginTop: 2, lineHeight: 1.05 },
    titleSub: { fontSize: 14, fontFamily: 'Bitter', fontWeight: 500, fontStyle: 'italic', color: NAVY, marginTop: 1 },

    extiende: { fontSize: 10, fontFamily: 'Inter', fontStyle: 'italic', color: MUTED, marginTop: 20 },
    holderName: { fontSize: 25, fontFamily: 'Bitter', fontWeight: 700, color: NAVY, marginTop: 4 },

    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 7, gap: 12 },
    rut: { fontSize: 10, fontFamily: 'Inter', fontWeight: 500, color: MUTED },
    tag: { borderWidth: 1, borderColor: AMBER, paddingVertical: 2.5, paddingHorizontal: 8 },
    tagText: { fontSize: 8, fontFamily: 'Inter', fontWeight: 600, color: NAVY },

    divider: { width: 280, height: 1.5, backgroundColor: NAVY, opacity: 0.12, marginTop: 16, marginBottom: 16 },

    leadIn: { fontSize: 10, fontFamily: 'Inter', color: MUTED },
    quoteBlock: { flexDirection: 'row', marginTop: 7, alignItems: 'flex-start' },
    quoteBar: { width: 2.5, backgroundColor: AMBER, marginRight: 10, alignSelf: 'stretch' },
    courseTitle: { fontSize: 16.5, fontFamily: 'Bitter', fontWeight: 700, fontStyle: 'italic', color: NAVY, maxWidth: 400 },

    detailText: { fontSize: 9.5, fontFamily: 'Inter', color: INK, marginTop: 14, lineHeight: 1.55, maxWidth: 420 },

    bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: 20 },

    qrBlock: { flexDirection: 'row', alignItems: 'center' },
    qr: { width: 52, height: 52 },
    qrTextBlock: { marginLeft: 10 },
    qrHint: { fontSize: 8, fontFamily: 'Inter', color: MUTED, maxWidth: 140, lineHeight: 1.4 },
    qrCode: { fontSize: 8, fontFamily: 'Inter', fontWeight: 700, color: NAVY, letterSpacing: 0.5, marginTop: 2 },

    signatureBlock: { alignItems: 'center', position: 'relative' },
    signatureImage: { width: 118, height: 38, objectFit: 'contain' },
    stampOverSignature: { width: 70, height: 70, position: 'absolute', top: -38, left: 62, opacity: 0.9 },
    signatureLine: { borderTopWidth: 1, borderTopColor: INK, width: 150, marginTop: 1 },
    signerName: { fontSize: 9.5, fontFamily: 'Inter', fontWeight: 700, color: NAVY, marginTop: 5 },
    signerRole: { fontSize: 8, fontFamily: 'Inter', color: MUTED, marginTop: 1 },
});

function formatIssueDate(date: Date): string {
    return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function expiryClause(date: Date | null): string {
    if (!date) return 'Esta certificación no tiene fecha de vencimiento.';
    return `Vigente hasta el ${date.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}.`;
}

export interface CertificatePdfProps {
    code: string;
    holderName: string;
    holderRut: string;
    certificationTitle: string;
    categoryLabel: string;
    detailText: string | null;
    issueDate: Date;
    expiryDate: Date | null;
    statusLabel: string;
    /** QR ya generado (data URL): el PDF no depende de ningún servicio externo. */
    qrDataUrl: string;
}

export function CertificatePdf({
    code,
    holderName,
    holderRut,
    certificationTitle,
    categoryLabel,
    detailText,
    issueDate,
    expiryDate,
    statusLabel: _statusLabel,
    qrDataUrl,
}: CertificatePdfProps) {
    const sealPath = path.join(process.cwd(), 'public', 'images', 'isotipo-wylar.png');
    const stampPath = path.join(process.cwd(), 'public', 'images', 'timbre-wylar.png');
    const signaturePath = path.join(process.cwd(), 'public', 'images', 'firma-gustavo.png');

    return (
        <Document title={`Certificado ${code}`}>
            <Page size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.card}>
                    <View style={styles.band}>
                        <View style={styles.bandRule} />
                        <Image src={sealPath} style={styles.seal} />
                        <Text style={styles.bandWordmark}>WYLAR</Text>
                        <View style={{ flex: 1 }} />
                        <Text style={styles.bandSpine}>CERTIFICADORA DE COMPETENCIAS LABORALES</Text>
                        <View style={{ flex: 1 }} />
                    </View>

                    <View style={styles.content}>
                        <View style={styles.topRow}>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.codeTag}>Certificado N°</Text>
                                <Text style={styles.codeValue}>{code}</Text>
                            </View>
                        </View>

                        <View style={styles.main}>
                            <Text style={styles.kicker}>Diploma de certificación</Text>
                            <Text style={styles.title}>Certificado</Text>
                            <Text style={styles.titleSub}>de Competencia Laboral</Text>

                            <Text style={styles.extiende}>Extiende el presente certificado a</Text>
                            <Text style={styles.holderName}>{holderName}</Text>
                            <View style={styles.metaRow}>
                                <Text style={styles.rut}>RUT {holderRut}</Text>
                                <View style={styles.tag}>
                                    <Text style={styles.tagText}>{categoryLabel}</Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <Text style={styles.leadIn}>Ha completado satisfactoriamente el curso de</Text>
                            <View style={styles.quoteBlock}>
                                <View style={styles.quoteBar} />
                                <Text style={styles.courseTitle}>{certificationTitle}</Text>
                            </View>

                            {detailText ? <Text style={styles.detailText}>{detailText}</Text> : null}
                            <Text style={styles.detailText}>
                                {expiryClause(expiryDate)} Emitido en Chile, el {formatIssueDate(issueDate)}.
                            </Text>
                        </View>

                        <View style={styles.bottomRow}>
                            <View style={styles.qrBlock}>
                                <Image src={qrDataUrl} style={styles.qr} />
                                <View style={styles.qrTextBlock}>
                                    <Text style={styles.qrHint}>Verifica la autenticidad de este certificado en wylar.cl/validador</Text>
                                    <Text style={styles.qrCode}>{code}</Text>
                                </View>
                            </View>

                            <View style={styles.signatureBlock}>
                                <Image src={signaturePath} style={styles.signatureImage} />
                                <Image src={stampPath} style={styles.stampOverSignature} />
                                <View style={styles.signatureLine} />
                                <Text style={styles.signerName}>Gustavo Soto Antihual</Text>
                                <Text style={styles.signerRole}>Representante Legal</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
}
