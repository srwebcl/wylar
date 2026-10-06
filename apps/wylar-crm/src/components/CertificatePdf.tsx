import { Document, Page, StyleSheet, Text, View, Image, Svg, Polygon } from '@react-pdf/renderer';
import path from 'path';

const NAVY = '#0B1E40';
const CYAN = '#0891b2';
const AMBER = '#f59e0b';
const INK = '#1e293b';
const MUTED = '#64748b';

// Dimensiones del marco (frame) en puntos: A4 apaisado (841.89 x 595.28) menos
// el padding de la página (28 por lado). Las esquinas decorativas se calculan
// sobre esta caja para que calcen exactamente con el borde.
const CORNER = 72;

const styles = StyleSheet.create({
    page: { padding: 28, fontFamily: 'Helvetica', backgroundColor: '#fdfcf9' },
    frame: { flex: 1, borderWidth: 2, borderColor: NAVY, padding: 32, position: 'relative' },
    frameInner: { position: 'absolute', top: 6, left: 6, right: 6, bottom: 6, borderWidth: 0.75, borderColor: AMBER },

    cornerTL: { position: 'absolute', top: -32, left: -32, width: CORNER, height: CORNER },
    cornerTR: { position: 'absolute', top: -32, right: -32, width: CORNER, height: CORNER },
    cornerBL: { position: 'absolute', bottom: -32, left: -32, width: CORNER, height: CORNER },
    cornerBR: { position: 'absolute', bottom: -32, right: -32, width: CORNER, height: CORNER },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    logo: { width: 130 },
    codeBox: { alignItems: 'flex-end' },
    codeLabel: { fontSize: 10, color: MUTED },
    codeValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: NAVY, marginTop: 2 },

    body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
    bigTitle: { fontSize: 32, fontFamily: 'Helvetica-Bold', color: NAVY, letterSpacing: 2 },
    institutionLine: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: CYAN, letterSpacing: 1.3, marginTop: 4 },

    extiendeLine: { fontSize: 10, fontFamily: 'Helvetica-Oblique', color: MUTED, marginTop: 20 },
    holderName: { fontSize: 28, fontFamily: 'Times-Bold', color: NAVY, marginTop: 6, textAlign: 'center' },
    rut: { fontSize: 11, color: MUTED, marginTop: 4 },
    divider: { width: 260, height: 1, backgroundColor: AMBER, marginTop: 10 },

    leadIn: { fontSize: 10.5, fontFamily: 'Helvetica-Oblique', color: INK, marginTop: 16, textAlign: 'center' },
    certTitle: { fontSize: 16, fontFamily: 'Times-BoldItalic', color: NAVY, marginTop: 8, textAlign: 'center' },
    categoryLabel: { fontSize: 9.5, color: AMBER, fontFamily: 'Helvetica-Bold', marginTop: 4, letterSpacing: 1 },

    detailText: { fontSize: 9.5, fontFamily: 'Helvetica-Oblique', color: INK, marginTop: 14, textAlign: 'center', lineHeight: 1.5, maxWidth: 480 },
    validityLine: { fontSize: 9, color: MUTED, marginTop: 8 },
    placeDate: { fontSize: 10, color: INK, marginTop: 10, fontFamily: 'Helvetica-Bold' },

    footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },

    qrBlock: { alignItems: 'center', width: 150 },
    qr: { width: 64, height: 64 },
    qrHint: { fontSize: 7, color: MUTED, marginTop: 4, textAlign: 'center', width: 150 },

    codeBlock: { alignItems: 'center', width: 190 },
    codeBlockLabel: { fontSize: 8, color: INK, fontFamily: 'Helvetica-Bold' },
    codeBlockValue: { fontSize: 8, color: MUTED, marginTop: 2 },

    signatureBlock: { width: 150, alignItems: 'center', position: 'relative' },
    signatureImage: { width: 140, height: 44, objectFit: 'contain' },
    stampOverSignature: { width: 90, height: 90, position: 'absolute', top: -46, left: 55, opacity: 0.92 },
    signatureLine: { borderTopWidth: 1, borderTopColor: INK, width: 150, marginTop: 2 },
    signerName: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: NAVY, marginTop: 5 },
    signerRole: { fontSize: 8.5, color: MUTED, marginTop: 1 },
});

function formatIssueDate(date: Date): string {
    const label = date.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
    return `Chile, ${label}`;
}

function formatExpiry(date: Date | null): string {
    if (!date) return 'Sin fecha de vencimiento.';
    return `Vigente hasta ${date.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}.`;
}

/** Esquina decorativa tipo "cinta doblada", en los colores de marca (navy +
 * cian). `corner` define en qué vértice de la caja va el ángulo recto. */
function DecorativeCorner({ corner }: { corner: 'tl' | 'tr' | 'bl' | 'br' }) {
    const n = CORNER;
    const inset = 24;
    const points: Record<typeof corner, { navy: string; cyan: string }> = {
        tl: { navy: `0,0 ${n},0 0,${n}`, cyan: `0,0 ${n - inset},0 0,${n - inset}` },
        tr: { navy: `${n},0 0,0 ${n},${n}`, cyan: `${n},0 ${inset},0 ${n},${n - inset}` },
        bl: { navy: `0,${n} ${n},${n} 0,0`, cyan: `0,${n} ${n - inset},${n} 0,${inset}` },
        br: { navy: `${n},${n} 0,${n} ${n},0`, cyan: `${n},${n} ${inset},${n} ${n},${inset}` },
    };
    const p = points[corner];
    return (
        <Svg viewBox={`0 0 ${n} ${n}`} width={n} height={n}>
            <Polygon points={p.navy} fill={NAVY} />
            <Polygon points={p.cyan} fill={CYAN} />
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
    categoryLabel,
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
                    <View style={styles.frameInner} fixed />

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

                    <View style={styles.header}>
                        <Image src={logoPath} style={styles.logo} />
                        <View style={styles.codeBox}>
                            <Text style={styles.codeLabel}>Certificado N°</Text>
                            <Text style={styles.codeValue}>{code}</Text>
                        </View>
                    </View>

                    <View style={styles.body}>
                        <Text style={styles.bigTitle}>CERTIFICADO</Text>
                        <Text style={styles.institutionLine}>CERTIFICADORA DE COMPETENCIAS LABORALES · WYLAR LTDA.</Text>

                        <Text style={styles.extiendeLine}>Extiende el presente certificado a:</Text>
                        <Text style={styles.holderName}>{holderName}</Text>
                        <Text style={styles.rut}>RUT {holderRut}</Text>
                        <View style={styles.divider} />

                        <Text style={styles.leadIn}>Ha completado satisfactoriamente el curso de:</Text>
                        <Text style={styles.certTitle}>&ldquo;{certificationTitle}&rdquo;</Text>
                        <Text style={styles.categoryLabel}>{categoryLabel.toUpperCase()}</Text>

                        {detailText ? <Text style={styles.detailText}>{detailText}</Text> : null}
                        <Text style={styles.validityLine}>{formatExpiry(expiryDate)}</Text>

                        <Text style={styles.placeDate}>{formatIssueDate(issueDate)}</Text>
                    </View>

                    <View style={styles.footerRow}>
                        <View style={styles.qrBlock}>
                            <Image src={qrDataUrl} style={styles.qr} />
                            <Text style={styles.qrHint}>Verifica en wylar.cl/validador</Text>
                        </View>

                        <View style={styles.codeBlock}>
                            <Text style={styles.codeBlockLabel}>Código de Certificado: {code}</Text>
                            <Text style={styles.codeBlockValue}>Verificable en: www.wylar.cl</Text>
                        </View>

                        <View style={styles.signatureBlock}>
                            <Image src={signaturePath} style={styles.signatureImage} />
                            <Image src={stampPath} style={styles.stampOverSignature} />
                            <View style={styles.signatureLine} />
                            <Text style={styles.signerName}>Gustavo Soto Antihual</Text>
                            <Text style={styles.signerRole}>Representante Legal · Wylar</Text>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
}
