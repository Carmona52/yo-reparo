/**
 * styles/global-styles.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Estilos globales para toda la app (cliente, worker, owner).
 * Basado en constants/theme.ts — soporta dark/light mode.
 *
 * EXPORTS:
 *   COLORS  → tokens de color centralizados
 *   shadow  → sombras cross-platform (iOS + Android)
 *   G       → StyleSheet con clases reutilizables
 *
 * USO BÁSICO:
 *   import { G, COLORS, shadow } from '@/styles/global-styles';
 *
 *   // Estilo estático:
 *   <View style={G.card} />
 *
 *   // Combinado con sombra:
 *   <View style={[G.card, shadow.sm]} />
 *
 *   // Con color dinámico dark/light:
 *   const isDark = useColorScheme() === 'dark';
 *   <View style={[G.card, shadow.sm, { backgroundColor: isDark ? COLORS.cardDark : COLORS.cardLight }]} />
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {Platform, StyleSheet} from 'react-native';

// ── Tokens de color ───────────────────────────────────────────────────────────

export const COLORS = {
// Primario (tintColorLight de theme.ts)
    primary: '#0a7ea4',
    primaryLight: 'rgba(10, 126, 164, 0.1)',
    primaryMedium: 'rgba(10, 126, 164, 0.15)',
    primaryBorder: 'rgba(10, 126, 164, 0.1)',
    primaryBg: 'rgba(10, 126, 164, 0.03)',
    primaryBgMedium: 'rgba(10, 126, 164, 0.08)',

// Estados
    success: '#10b981',
    successLight: 'rgba(16, 185, 129, 0.1)',
    warning: '#f59e0b',
    warningLight: 'rgba(245, 158, 11, 0.1)',
    danger: '#ff4444',
    dangerLight: 'rgba(255, 68, 68, 0.08)',
    dangerBorder: 'rgba(255, 68, 68, 0.15)',

// Externos
    whatsapp: '#25D366',

// Neutros / superficies
    border: 'rgba(150, 150, 150, 0.15)',
    borderSubtle: 'rgba(150, 150, 150, 0.08)',
    borderDashed: 'rgba(150, 150, 150, 0.05)',
    surfaceLight: 'rgba(150, 150, 150, 0.05)',
    surfaceMedium: 'rgba(150, 150, 150, 0.08)',
    surfaceStrong: 'rgba(150, 150, 150, 0.1)',
    placeholder: 'rgba(150, 150, 150, 0.5)',
    muted: '#8e8e93',
    mutedIcon: '#ccc',

// Fondos dependientes de esquema (usar con isDark)
    cardLight: '#ffffff',
    cardDark: 'rgba(255, 255, 255, 0.05)',
    inputLight: '#f0f2f5',
    inputDark: '#1c1c1e',
    inputAltLight: '#f9f9f9',
    inputAltDark: '#2c2c2e',

// Texto sobre fondos de color
    onPrimary: '#ffffff',
} as const;

// ── Sombras cross-platform ────────────────────────────────────────────────────

export const shadow = {
    none: {},
    sm: Platform.select({
        ios: {shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 5},
        android: {elevation: 2},
    }),
    md: Platform.select({
        ios: {shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.08, shadowRadius: 10},
        android: {elevation: 4},
    }),
    lg: Platform.select({
        ios: {shadowColor: '#000', shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.12, shadowRadius: 16},
        android: {elevation: 6},
    }),
    primary: Platform.select({
        ios: {shadowColor: '#0a7ea4', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.2, shadowRadius: 8},
        android: {elevation: 5},
    }),
    primaryLg: Platform.select({
        ios: {shadowColor: '#0a7ea4', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 6},
        android: {elevation: 5},
    }),
    success: Platform.select({
        ios: {shadowColor: '#10b981', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2, shadowRadius: 4},
        android: {elevation: 3},
    }),
} as const;

// ── Estilos globales ──────────────────────────────────────────────────────────

export const G = StyleSheet.create({

// ── Layout base ───────────────────────────────────────────────────────────
    flex1: {flex: 1},
    center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
    row: {flexDirection: 'row', alignItems: 'center'},
    rowBetween: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
    scrollContent: {paddingHorizontal: 20, paddingBottom: 40},
    pageContent: {padding: 20, paddingBottom: 40},
    pageContentLg: {padding: 24, paddingBottom: 60},

// ── Encabezados de pantalla ───────────────────────────────────────────────
    pageHeader: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    pageHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 25,
        paddingVertical: 20,
    },
    pageTitle: {fontSize: 28, fontWeight: '800', marginBottom: 15},
    pageTitleSm: {fontSize: 24, fontWeight: 'bold'},
    pageSubtitle: {fontSize: 14, opacity: 0.5, marginTop: -2},

// Header con botón de regreso (pantallas de detalle)
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    topBarSafeArea: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 10,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.surfaceStrong,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backBtnPlain: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    backBtnCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.surfaceStrong,
        justifyContent: 'center',
        alignItems: 'center',
    },

// ── Cards ─────────────────────────────────────────────────────────────────
// backgroundColor dinámico con isDark
    card: {
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cardLg: {
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
// Semitransparente — funciona sin isDark
    cardSurface: {
        borderRadius: 20,
        padding: 16,
        backgroundColor: COLORS.surfaceLight,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cardSurfaceLg: {
        borderRadius: 24,
        padding: 20,
        backgroundColor: COLORS.surfaceLight,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cardSurfaceMd: {
        borderRadius: 20,
        padding: 16,
        backgroundColor: COLORS.surfaceMedium,
    },

// ── Separadores ───────────────────────────────────────────────────────────
    divider: {height: 1, backgroundColor: COLORS.borderSubtle, marginVertical: 15},
    dividerH: {height: 1, backgroundColor: COLORS.borderSubtle},

// ── Títulos de sección ────────────────────────────────────────────────────
    sectionTitle: {fontSize: 16, fontWeight: '700', marginBottom: 10},
    sectionLabel: {
        fontSize: 12,
        fontWeight: '800',
        marginTop: 20,
        marginBottom: 8,
        opacity: 0.6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardLabel: {
        fontSize: 13,
        opacity: 0.4,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 15,
        letterSpacing: 1,
    },

// ── Buscador ──────────────────────────────────────────────────────────────
// backgroundColor dinámico con isDark
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        paddingHorizontal: 12,
        height: 48,
        marginBottom: 10,
        gap: 8,
    },
    searchInput: {flex: 1, fontSize: 15},

// ── Filtros horizontales ──────────────────────────────────────────────────
    filterWrapper: {paddingVertical: 10},
    filterContainer: {paddingHorizontal: 20, gap: 8},
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: COLORS.surfaceStrong,
    },
    filterChipActive: {backgroundColor: COLORS.primary},
    filterText: {fontSize: 13, fontWeight: '600', opacity: 0.6},
    filterTextActive: {color: COLORS.onPrimary, opacity: 1},

// ── Inputs y formularios ──────────────────────────────────────────────────
    input: {
        backgroundColor: COLORS.surfaceStrong,
        borderRadius: 14,
        padding: 15,
        fontSize: 16,
        marginBottom: 15,
    },
    inputBordered: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        marginBottom: 16,
        backgroundColor: COLORS.surfaceStrong,
    },
// Para modales con fondo claro — usar backgroundColor dinámico con isDark
    inputModal: {
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#eee',
    },
// Input con ícono — backgroundColor dinámico con isDark
    inputWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 50,
    },
    inputText: {flex: 1, fontSize: 16},
    textArea: {
        backgroundColor: COLORS.surfaceStrong,
        borderRadius: 14,
        padding: 15,
        fontSize: 16,
        height: 110,
        textAlignVertical: 'top',
        marginBottom: 15,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        marginBottom: 16,
        backgroundColor: COLORS.surfaceStrong,
    },
    passwordInput: {flex: 1, padding: 14, fontSize: 16},
    eyeIcon: {paddingHorizontal: 14},

// ── Botones ───────────────────────────────────────────────────────────────
    btnPrimary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 16,
        gap: 8,
    },
    btnPrimaryLg: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        padding: 18,
        borderRadius: 20,
        gap: 12,
    },
    btnSuccess: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.success,
        padding: 18,
        borderRadius: 20,
        gap: 12,
    },
    btnDanger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.dangerLight,
        borderWidth: 1,
        borderColor: COLORS.dangerBorder,
        padding: 16,
        borderRadius: 16,
        gap: 8,
    },
    btnOutlinePrimary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
        borderStyle: 'dashed',
        padding: 20,
        borderRadius: 20,
        gap: 8,
    },
    btnModal: {
        backgroundColor: COLORS.primary,
        height: 55,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        marginTop: 10,
    },
    btnDisabled: {opacity: 0.5},
    btnText: {color: COLORS.onPrimary, fontWeight: 'bold', fontSize: 16},
    btnTextDanger: {color: COLORS.danger, fontWeight: 'bold', fontSize: 15},

// Botón circular en header
    btnCircle: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },

// FAB (Floating Action Button)
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 25,
        width: 60,
        height: 60,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },

// Botón de acción grande (llamar, whatsapp, etc.)
    actionBtnLg: {
        flex: 1,
        height: 55,
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    actionBtnText: {color: COLORS.onPrimary, fontWeight: 'bold', fontSize: 16},
    quickActions: {flexDirection: 'row', gap: 15, marginBottom: 30},

// Cerrar sesión
    signOutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        backgroundColor: COLORS.dangerLight,
        borderWidth: 1,
        borderColor: COLORS.dangerBorder,
        marginTop: 10,
        gap: 10,
    },
    signOutText: {color: COLORS.danger, fontWeight: 'bold', fontSize: 15},

// ── Badges y chips de estado ──────────────────────────────────────────────
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeLg: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    badgeTextWhite: {color: COLORS.onPrimary, fontSize: 9, fontWeight: '900', textTransform: 'uppercase'},
    statusDot: {width: 6, height: 6, borderRadius: 3},
    statusDotLg: {width: 8, height: 8, borderRadius: 4},
    statusRow: {flexDirection: 'row', alignItems: 'center', gap: 6},

// ── Íconos con fondo ──────────────────────────────────────────────────────
    iconBadgeSm: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconBadge: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconBadgeLg: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconBadgeXl: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconCirclePrimary: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconBgPrimary: {backgroundColor: COLORS.primaryBgMedium},

// ── Perfil / Avatar ───────────────────────────────────────────────────────
    avatarSquircle: {
        width: 100,
        height: 100,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    avatarPrimary: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    avatarSm: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarMd: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: {color: COLORS.onPrimary, fontWeight: 'bold', fontSize: 18},
    avatarTextLg: {color: COLORS.onPrimary, fontSize: 40, fontWeight: 'bold'},
    avatarTextSm: {color: COLORS.primary, fontWeight: 'bold', fontSize: 16},

    onlineBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.success,
        borderWidth: 3,
        borderColor: '#fff',
    },
    roleBadge: {
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 12,
        marginTop: 10,
        alignSelf: 'center',
    },
    roleBadgeText: {
        color: COLORS.primary,
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

// Header de perfil centrado
    profileHeader: {
        alignItems: 'center',
        marginVertical: 20,
        marginBottom: 10,
    },
    profileName: {fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 8},

// ── Fila de info (ícono + label + value) ──────────────────────────────────
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderSubtle,
        marginLeft:10
    },
    infoTextGroup: {marginLeft: 15, flex: 1},
    infoLabel: {
        fontSize: 11,
        opacity: 0.5,
        textTransform: 'uppercase',
        fontWeight: 'bold',
        marginBottom: 2,
    },
    infoValue: {fontSize: 16, fontWeight: '600'},
    infoValueSm: {fontSize: 15, fontWeight: '500'},

// ── Items de menú / navegación ────────────────────────────────────────────
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        borderRadius: 20,
        marginBottom: 10,
        gap: 12,
    },
    menuItemText: {flex: 1, fontSize: 16, fontWeight: '500'},

// ── Imágenes ──────────────────────────────────────────────────────────────
    imageContainer: {
        width: '100%',
        height: 200,
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: COLORS.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    imageContainerLg: {
        width: '100%',
        height: 220,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: COLORS.surfaceMedium,
    },
    imageFull: {width: '100%', height: '100%', resizeMode: 'cover'},
    imageButtonsRow: {
        position: 'absolute',
        bottom: 15,
        flexDirection: 'row',
        gap: 10,
    },
    imageActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 22,
        gap: 6,
    },
    imageActionBtnText: {color: COLORS.onPrimary, fontSize: 12, fontWeight: '700'},
    loaderOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },

// ── Grid de info (fecha + hora) ───────────────────────────────────────────
    infoGrid: {flexDirection: 'row', gap: 12, marginBottom: 15},
    infoGridCard: {
        flex: 1,
        backgroundColor: COLORS.surfaceLight,
        padding: 14,
        borderRadius: 18,
    },
    infoGridLabel: {
        fontSize: 10,
        opacity: 0.4,
        textTransform: 'uppercase',
        marginTop: 4,
        fontWeight: 'bold',
    },
    infoGridValue: {fontSize: 13, marginTop: 2, textTransform: 'capitalize'},

// ── Location card ─────────────────────────────────────────────────────────
    locationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        backgroundColor: COLORS.primaryBg,
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
        marginBottom: 20,
    },

// ── Date/Time picker buttons ──────────────────────────────────────────────
    pickerRow: {flexDirection: 'row', gap: 12},
    pickerBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.surfaceStrong,
        padding: 16,
        borderRadius: 14,
    },
    pickerBtnText: {fontSize: 15, fontWeight: '600'},

// ── Dropdown / Selector ───────────────────────────────────────────────────
    dropdownBox: {
        backgroundColor: COLORS.surfaceLight,
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    dropdownTrigger: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownContent: {
        marginTop: 15,
        borderTopWidth: 1,
        borderColor: COLORS.border,
        paddingTop: 10,
    },
    dropdownOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        alignItems: 'center',
    },
    dropdownOptionActive: {color: COLORS.primary, fontWeight: 'bold'},

// ── Roles (botones de selección) ──────────────────────────────────────────
    roleContainer: {marginBottom: 20},
    roleLabel: {fontWeight: '600', marginBottom: 8},
    roleButtons: {flexDirection: 'row', gap: 8},
    roleButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        backgroundColor: COLORS.surfaceLight,
    },
    roleButtonActive: {backgroundColor: COLORS.primary, borderColor: COLORS.primary},
    roleButtonText: {fontWeight: '500'},
    roleButtonTextActive: {color: COLORS.onPrimary, fontWeight: 'bold'},

// ── Calendario ────────────────────────────────────────────────────────────
    calendarCard: {
        padding: 12,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 5,
    },
    calendarMonthTitle: {textTransform: 'capitalize', fontSize: 16},
    calendarNavButtons: {flexDirection: 'row', gap: 15},
    calendarNavBtn: {padding: 2},
    weekDaysRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 8,
    },
    weekDayText: {
        fontWeight: 'bold',
        width: 35,
        textAlign: 'center',
        opacity: 0.3,
        fontSize: 11,
    },
    daysGrid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start'},
    dayCell: {
        width: `${100 / 7}%`,
        height: 38,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
    dayCellSelected: {backgroundColor: COLORS.primary, borderRadius: 10},
    dayCellToday: {borderBottomWidth: 2, borderBottomColor: COLORS.primary},
    dayText: {fontSize: 14},
    dayTextSelected: {color: COLORS.onPrimary, fontWeight: 'bold'},
    dotIndicator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        position: 'absolute',
        bottom: 4,
    },

// ── Task card (dashboard home) ────────────────────────────────────────────
    tasksWrapper: {gap: 10},
    taskCard: {
        flexDirection: 'row',
        padding: 14,
        borderRadius: 15,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
        alignItems: 'center',
        backgroundColor: COLORS.surfaceMedium,
    },
    taskTimeColumn: {width: 60},
    taskTimeText: {fontSize: 12, fontWeight: 'bold', opacity: 0.8},
    taskDivider: {
        width: 1,
        height: '60%',
        backgroundColor: COLORS.border,
        marginHorizontal: 12,
    },
    taskDetailsColumn: {flex: 1},
    taskTitle: {fontSize: 15, fontWeight: '600', marginBottom: 2},
    taskStatus: {
        fontSize: 11,
        color: COLORS.primary,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },

// ── Empty states ──────────────────────────────────────────────────────────
    emptyContainer: {
        alignItems: 'center',
        marginTop: 80,
        paddingHorizontal: 40,
    },
    emptyIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 15,
        opacity: 0.5,
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 30,
    },
    emptyStateDashed: {
        padding: 25,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 15,
        backgroundColor: 'rgba(150, 150, 150, 0.02)',
        borderWidth: 1,
        borderColor: COLORS.borderDashed,
        borderStyle: 'dashed',
    },
    emptyBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 18,
    },

// ── Modales ───────────────────────────────────────────────────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalOverlayCentered: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: 20,
    },
    modalSheet: {
        height: '85%',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
    },
    modalCard: {
        borderRadius: 24,
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalHeaderInner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    modalForm: {padding: 20},
    modalCloseBtn: {
        padding: 5,
        backgroundColor: COLORS.surfaceStrong,
        borderRadius: 20,
    },
    closeModalBtn: {
        position: 'absolute',
        top: 50,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
        borderRadius: 25,
    },

// ── Completado ────────────────────────────────────────────────────────────
    completedBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.successLight,
        padding: 20,
        borderRadius: 20,
        gap: 12,
    },
    completedText: {
        color: COLORS.success,
        fontWeight: 'bold',
        fontSize: 14,
        textAlign: 'center',
    },

// ── Herramientas (tools list) ─────────────────────────────────────────────
    toolItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(150,150,150,0.05)',
    },
    toolDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.primary,
        marginRight: 12,
    },
    toolName: {fontSize: 15, fontWeight: '500'},
    toolDate: {fontSize: 12, color: COLORS.muted, marginTop: 2},

// ── Stats (worker detail) ─────────────────────────────────────────────────
    statsGrid: {flexDirection: 'row', justifyContent: 'space-between'},
    statBox: {alignItems: 'center', flex: 1},
    statNumber: {fontSize: 18, fontWeight: 'bold', color: COLORS.primary},
    statLabel: {fontSize: 12, opacity: 0.5},

// ── Greeting (home screens) ───────────────────────────────────────────────
    greetingContainer: {marginBottom: 20},
    greetingText: {opacity: 0.6, fontSize: 15, marginBottom: 2},
    todayTitle: {fontSize: 22, fontWeight: 'bold', textTransform: 'capitalize'},

// ── Versión ───────────────────────────────────────────────────────────────
    versionText: {textAlign: 'center', marginTop: 40, opacity: 0.3, fontSize: 12},
});