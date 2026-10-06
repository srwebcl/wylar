import { Document, Page, StyleSheet, Text, View, Image, Font, Svg, Polygon } from '@react-pdf/renderer';
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

const CORNER = 92;

const styles = StyleSheet.create({
    page: { fontFamily: 'Inter', backgroundColor: '#FFFFFF' },

    frame: { flex: 1, margin: 20, borderWidth: 1, borderColor: NAVY, padding: 34, position: 'relative' },

    cornerTL: { position: 'absolute', top: -20, left: -20, width: CORNER, height: CORNER },
    cornerTR: { position: 'absolute', top: -20, right: -20, width: CORNER, height: CORNER },
    cornerBL: { position: 'absolute', bottom: -20, left: -20, width: CORNER, height: CORNER },
    cornerBR: { position: 'absolute', bottom: -20, right: -20, width: CORNER, height: CORNER },

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

/** Esquina decorativa tipo cinta doblada en tres tonos, calcados del
 * propio degradé del isotipo de Wylar (navy → azul medio → cian). */
function DecorativeCorner({ corner }: { corner: 'tl' | 'tr' | 'bl' | 'br' }) {
    const n = CORNER;
    const step = 22;
    const points: Record<typeof corner, { a: string; b: string; c: string }> = {
        tl: {
            a: `0,0 ${n},0 0,${n}`,
            b: `0,0 ${n - step},0 0,${n - step}`,
            c: `0,0 ${n - step * 2},0 0,${n - step * 2}`,
        },
        tr: {
            a: `${n},0 0,0 ${n},${n}`,
            b: `${n},0 ${step},0 ${n},${n - step}`,
            c: `${n},0 ${step * 2},0 ${n},${n - step * 2}`,
        },
        bl: {
            a: `0,${n} ${n},${n} 0,0`,
            b: `0,${n} ${n - step},${n} 0,${step}`,
            c: `0,${n} ${n - step * 2},${n} 0,${step * 2}`,
        },
        br: {
            a: `${n},${n} 0,${n} ${n},0`,
            b: `${n},${n} ${step},${n} ${n},${step}`,
            c: `${n},${n} ${step * 2},${n} ${n},${step * 2}`,
        },
    };
    const p = points[corner];
    return (
        <Svg viewBox={`0 0 ${n} ${n}`} width={n} height={n}>
            <Polygon points={p.a} fill={NAVY} />
            <Polygon points={p.b} fill={BLUE} />
            <Polygon points={p.c} fill={CYAN} />
        </Svg>
    );
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
                <View style={styles.frame}>
                    <View style={styles.cornerTL}>
                        <DecorativeCorner corner="tl" />
                    </View>
                    <View style={styles.cornerTR}>
                        <DecorativeCorner corner="tr" />
                    </View>
                    <View style={styles.cornerBL}>
                        <DecorativeCorner corner="bl" />
                    </View>
                    <View style={styles.cornerBR}>
                        <DecorativeCorner corner="br" />
                    </View>

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
