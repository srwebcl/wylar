import { Document, Page, StyleSheet, Text, View, Image } from '@react-pdf/renderer';
import path from 'path';

const NAVY = '#0B1E40';
const CYAN = '#0891b2';
const AMBER = '#f59e0b';
const INK = '#1e293b';
const MUTED = '#64748b';

const styles = StyleSheet.create({
    page: { padding: 28, fontFamily: 'Helvetica', backgroundColor: '#fdfcf9' },
    frame: { flex: 1, borderWidth: 2, borderColor: NAVY, padding: 32, position: 'relative' },
    frameInner: { position: 'absolute', top: 6, left: 6, right: 6, bottom: 6, borderWidth: 0.75, borderColor: AMBER },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    logo: { width: 130 },
    codeBox: { alignItems: 'flex-end' },
    codeLabel: { fontSize: 10, color: MUTED },
    codeValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: NAVY, marginTop: 2 },

    body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
    eyebrow: { fontSize: 12, letterSpacing: 3, color: CYAN, fontFamily: 'Helvetica-Bold' },
    holderName: { fontSize: 30, fontFamily: 'Times-Bold', color: NAVY, marginTop: 10, textAlign: 'center' },
    rut: { fontSize: 11, color: MUTED, marginTop: 4 },

    leadIn: { fontSize: 10.5, color: INK, marginTop: 18, textAlign: 'center' },
    certTitle: { fontSize: 16, fontFamily: 'Times-Bold', color: NAVY, marginTop: 8, textAlign: 'center' },
    categoryLabel: { fontSize: 9.5, color: AMBER, fontFamily: 'Helvetica-Bold', marginTop: 4, letterSpacing: 1 },

    detailText: { fontSize: 9.5, color: INK, marginTop: 14, textAlign: 'justify', lineHeight: 1.5, maxWidth: 480 },
    validityLine: { fontSize: 9, color: MUTED, marginTop: 8 },
    placeDate: { fontSize: 10, color: INK, marginTop: 10, fontFamily: 'Helvetica-Bold' },

    footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },

    signatureBlock: { width: 190, alignItems: 'center', position: 'relative' },
    signatureImage: { width: 140, height: 44, objectFit: 'contain' },
    stampOverSignature: { width: 90, height: 90, position: 'absolute', top: -46, left: 95, opacity: 0.92 },
    signatureLine: { borderTopWidth: 1, borderTopColor: INK, width: 170, marginTop: 2 },
    signerName: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: NAVY, marginTop: 5 },
    signerRole: { fontSize: 8.5, color: MUTED, marginTop: 1 },

    qrBlock: { alignItems: 'center', width: 110 },
    qr: { width: 68, height: 68 },
    qrHint: { fontSize: 7, color: MUTED, marginTop: 4, textAlign: 'center' },

    footer: { borderTopWidth: 0.75, borderTopColor: '#e2e8f0', marginTop: 16, paddingTop: 8 },
    footerText: { fontSize: 7.5, color: MUTED, textAlign: 'center' },
});

function formatIssueDate(date: Date): string {
    const label = date.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
    return `Chile, ${label}`;
}

function formatExpiry(date: Date | null): string {
    if (!date) return 'Sin fecha de vencimiento.';
    return `Vigente hasta ${date.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}.`;
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

                    <View style={styles.header}>
                        <Image src={logoPath} style={styles.logo} />
                        <View style={styles.codeBox}>
                            <Text style={styles.codeLabel}>Certificado N°</Text>
                            <Text style={styles.codeValue}>{code}</Text>
                        </View>
                    </View>

                    <View style={styles.body}>
                        <Text style={styles.eyebrow}>CERTIFICADO DE COMPETENCIA LABORAL</Text>
                        <Text style={styles.holderName}>{holderName}</Text>
                        <Text style={styles.rut}>RUT {holderRut}</Text>

                        <Text style={styles.leadIn}>Por haber cumplido satisfactoriamente los requisitos de:</Text>
                        <Text style={styles.certTitle}>&ldquo;{certificationTitle}&rdquo;</Text>
                        <Text style={styles.categoryLabel}>{categoryLabel.toUpperCase()}</Text>

                        {detailText ? <Text style={styles.detailText}>{detailText}</Text> : null}
                        <Text style={styles.validityLine}>{formatExpiry(expiryDate)}</Text>

                        <Text style={styles.placeDate}>{formatIssueDate(issueDate)}</Text>
                    </View>

                    <View style={styles.footerRow}>
                        <View style={styles.signatureBlock}>
                            <Image src={signaturePath} style={styles.signatureImage} />
                            <Image src={stampPath} style={styles.stampOverSignature} />
                            <View style={styles.signatureLine} />
                            <Text style={styles.signerName}>Gustavo Soto Antihual</Text>
                            <Text style={styles.signerRole}>Representante Legal · Wylar</Text>
                        </View>

                        <View style={styles.qrBlock}>
                            <Image src={qrDataUrl} style={styles.qr} />
                            <Text style={styles.qrHint}>Verifica este certificado en wylar.cl/validador</Text>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>contacto@wylar.cl · www.wylar.cl · Código de verificación: {code}</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
}
