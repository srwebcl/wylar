import { Document, Page, StyleSheet, Text, View, Image, Font, Svg, Rect, Defs, LinearGradient, Stop } from '@react-pdf/renderer';
import path from 'path';

// --- Tipografía ---
// Inter: la misma familia que ya usa el CRM (ver app/layout.tsx y
// globals.css) — el certificado se tipografía igual que el resto del
// producto, no con una letra inventada para la ocasión.
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

// --- Paleta ---
// Los tres tonos del degradé del isotipo de Wylar (navy → azul medio →
// cian), muestreados del propio logo.png — nada de colores inventados.
const NAVY = '#0B1E40';
const BLUE = '#1C64B4';
const CYAN = '#0891b2';
const INK = '#1E293B';
const MUTED = '#64748B';

// A4 apaisado en puntos.
const PAGE_W = 841.89;
const PAGE_H = 595.28;
// Grosor del marco degradado que rodea la tarjeta blanca interior.
const FRAME = 30;

const styles = StyleSheet.create({
    page: { fontFamily: 'Inter' },
    gradientLayer: { position: 'absolute', top: 0, left: 0 },

    card: {
        position: 'absolute',
        top: FRAME,
        left: FRAME,
        right: FRAME,
        bottom: FRAME,
        backgroundColor: '#FFFFFF',
        padding: 34,
    },

    // --- Esquinas ---
    cornerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    logo: { width: 176 },
    codeBox: { alignItems: 'flex-end' },
    codeLabel: { fontSize: 9, color: MUTED },
    codeValue: { fontSize: 12, fontWeight: 700, color: NAVY, marginTop: 2 },

    bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },

    qrBlock: { flexDirection: 'row', alignItems: 'center' },
    qr: { width: 54, height: 54 },
    qrTextBlock: { marginLeft: 10, maxWidth: 150 },
    qrHint: { fontSize: 8, color: MUTED, lineHeight: 1.4 },
    qrCode: { fontSize: 8, fontWeight: 700, color: NAVY, marginTop: 2 },
    qrDate: { fontSize: 8, color: MUTED, marginTop: 2 },

    signatureBlock: { alignItems: 'center', position: 'relative' },
    signatureImage: { width: 118, height: 38, objectFit: 'contain' },
    stampOverSignature: { width: 72, height: 72, position: 'absolute', top: -40, left: 60, opacity: 0.9 },
    signatureLine: { borderTopWidth: 1, borderTopColor: INK, width: 150, marginTop: 1 },
    signerName: { fontSize: 9.5, fontWeight: 700, color: NAVY, marginTop: 5 },
    signerRole: { fontSize: 8, color: MUTED, marginTop: 1 },

    // --- Centro ---
    main: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },

    title: { fontSize: 32, fontWeight: 800, color: NAVY, marginTop: 4 },
    titleRule: { width: 54, height: 3, backgroundColor: CYAN, marginTop: 8 },
    institution: { fontSize: 11, fontWeight: 600, color: BLUE, marginTop: 10, textAlign: 'center' },

    extiende: { fontSize: 10, fontStyle: 'italic', color: MUTED, marginTop: 20 },
    holderName: { fontSize: 25, fontWeight: 700, color: NAVY, marginTop: 4, textAlign: 'center' },
    rut: { fontSize: 10, fontWeight: 500, color: MUTED, marginTop: 6 },

    divider: { width: 240, height: 1, backgroundColor: NAVY, opacity: 0.18, marginTop: 16, marginBottom: 16 },

    leadIn: { fontSize: 10, color: MUTED, textAlign: 'center' },
    courseTitle: { fontSize: 17, fontWeight: 700, fontStyle: 'italic', color: NAVY, marginTop: 7, textAlign: 'center', maxWidth: 440 },

    detailText: { fontSize: 9.5, color: INK, marginTop: 14, textAlign: 'center', lineHeight: 1.55, maxWidth: 440 },
    validityText: { fontSize: 9.5, fontWeight: 600, color: NAVY, marginTop: 10, textAlign: 'center' },
});

// Las fechas se guardan sin hora (medianoche UTC) — hay que forzar
// timeZone: 'UTC' al formatear o el resultado puede correrse un día
// según la zona horaria del entorno donde corra el servidor.
function formatIssueDate(date: Date): string {
    return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function formatVigenciaMonthYear(date: Date): string {
    const label = date.toLocaleDateString('es-CL', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    return label.charAt(0).toUpperCase() + label.slice(1);
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
    categoryLabel: _categoryLabel,
    detailText,
    issueDate,
    expiryDate,
    statusLabel: _statusLabel,
    qrDataUrl,
}: CertificatePdfProps) {
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
    const stampPath = path.join(process.cwd(), 'public', 'images', 'timbre-wylar.png');
    const signaturePath = path.join(process.cwd(), 'public', 'images', 'firma-gustavo.png');

    return (
        <Document title={`Certificado ${code}`}>
            <Page size="A4" orientation="landscape" style={styles.page}>
                {/* Marco exterior: degradado navy → cian característico de Wylar.
                    Todo lo que queda fuera de la tarjeta blanca interior toma este color. */}
                <Svg viewBox={`0 0 ${PAGE_W} ${PAGE_H}`} width={PAGE_W} height={PAGE_H} style={styles.gradientLayer} fixed>
                    <Defs>
                        <LinearGradient id="wylarFrame" x1="0" y1="0" x2="1" y2="1">
                            <Stop offset="0" stopColor={NAVY} />
                            <Stop offset="1" stopColor={CYAN} />
                        </LinearGradient>
                    </Defs>
                    <Rect x={0} y={0} width={PAGE_W} height={PAGE_H} fill="url(#wylarFrame)" />
                </Svg>

                <View style={styles.card}>
                    <View style={styles.cornerRow}>
                        <Image src={logoPath} style={styles.logo} />
                        <View style={styles.codeBox}>
                            <Text style={styles.codeLabel}>Certificado N°</Text>
                            <Text style={styles.codeValue}>{code}</Text>
                        </View>
                    </View>

                    <View style={styles.main}>
                        <Text style={styles.title}>Certificado</Text>
                        <View style={styles.titleRule} />
                        <Text style={styles.institution}>Certificadora de Competencias Laborales Wylar Ltda.</Text>

                        <Text style={styles.extiende}>Extiende el presente certificado a</Text>
                        <Text style={styles.holderName}>{holderName}</Text>
                        <Text style={styles.rut}>RUT {holderRut}</Text>

                        <View style={styles.divider} />

                        <Text style={styles.leadIn}>Ha completado satisfactoriamente el curso de</Text>
                        <Text style={styles.courseTitle}>&ldquo;{certificationTitle}&rdquo;</Text>

                        {detailText ? <Text style={styles.detailText}>{detailText}</Text> : null}
                        {expiryDate ? <Text style={styles.validityText}>Fecha de Vigencia: {formatVigenciaMonthYear(expiryDate)}</Text> : null}
                    </View>

                    <View style={styles.bottomRow}>
                        <View style={styles.qrBlock}>
                            <Image src={qrDataUrl} style={styles.qr} />
                            <View style={styles.qrTextBlock}>
                                <Text style={styles.qrHint}>Verifica la autenticidad de este certificado en wylar.cl/validador</Text>
                                <Text style={styles.qrCode}>{code}</Text>
                                <Text style={styles.qrDate}>Emitido el {formatIssueDate(issueDate)}</Text>
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
            </Page>
        </Document>
    );
}
