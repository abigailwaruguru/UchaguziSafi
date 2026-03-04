/**
 * UCHAGUZI SAFI — Kenya Constituencies Reference Data
 * ======================================================
 * All 290 constituencies of Kenya mapped to their parent counties,
 * as established by the Constitution of Kenya 2010, Article 89,
 * and delineated by IEBC in March 2012.
 *
 * Source: IEBC Registered Voters Per Constituency (2022 General Election)
 * URL: https://www.iebc.or.ke/docs/rov_per_constituency.pdf
 *
 * Keys match the county `value` field in kenyaCounties.js.
 * Constituency names use IEBC official spelling.
 *
 * Used in:
 *   - LocationPicker constituency dropdown (M3 Ripoti)
 *   - Candidate registration (M6 Usimamizi)
 *   - Incident location detail (M3 Ripoti)
 *
 * Total: 47 counties, 290 constituencies
 */

const KENYA_CONSTITUENCIES = {
  // ─── 001 MOMBASA ────────────────────────────────────────────
  Mombasa: [
    "Changamwe", "Jomvu", "Kisauni", "Nyali", "Likoni", "Mvita",
  ],
  // ─── 002 KWALE ──────────────────────────────────────────────
  Kwale: [
    "Msambweni", "Lunga Lunga", "Matuga", "Kinango",
  ],
  // ─── 003 KILIFI ─────────────────────────────────────────────
  Kilifi: [
    "Kilifi North", "Kilifi South", "Kaloleni", "Rabai",
    "Ganze", "Malindi", "Magarini",
  ],
  // ─── 004 TANA RIVER ─────────────────────────────────────────
  "Tana River": [
    "Garsen", "Galole", "Bura",
  ],
  // ─── 005 LAMU ───────────────────────────────────────────────
  Lamu: [
    "Lamu East", "Lamu West",
  ],
  // ─── 006 TAITA-TAVETA ───────────────────────────────────────
  "Taita-Taveta": [
    "Taveta", "Wundanyi", "Mwatate", "Voi",
  ],
  // ─── 007 GARISSA ────────────────────────────────────────────
  Garissa: [
    "Garissa Township", "Balambala", "Lagdera",
    "Dadaab", "Fafi", "Ijara",
  ],
  // ─── 008 WAJIR ──────────────────────────────────────────────
  Wajir: [
    "Wajir North", "Wajir East", "Tarbaj",
    "Wajir West", "Eldas", "Wajir South",
  ],
  // ─── 009 MANDERA ────────────────────────────────────────────
  Mandera: [
    "Mandera West", "Banissa", "Mandera North",
    "Mandera South", "Mandera East", "Lafey",
  ],
  // ─── 010 MARSABIT ───────────────────────────────────────────
  Marsabit: [
    "Moyale", "North Horr", "Saku", "Laisamis",
  ],
  // ─── 011 ISIOLO ─────────────────────────────────────────────
  Isiolo: [
    "Isiolo North", "Isiolo South",
  ],
  // ─── 012 MERU ───────────────────────────────────────────────
  Meru: [
    "Igembe South", "Igembe Central", "Igembe North",
    "Tigania West", "Tigania East", "North Imenti",
    "Buuri", "Central Imenti", "South Imenti",
  ],
  // ─── 013 THARAKA-NITHI ──────────────────────────────────────
  "Tharaka-Nithi": [
    "Maara", "Chuka/Igambang'ombe", "Tharaka",
  ],
  // ─── 014 EMBU ───────────────────────────────────────────────
  Embu: [
    "Manyatta", "Runyenjes", "Mbeere South", "Mbeere North",
  ],
  // ─── 015 KITUI ──────────────────────────────────────────────
  Kitui: [
    "Mwingi North", "Mwingi West", "Mwingi Central",
    "Kitui West", "Kitui Rural", "Kitui Central",
    "Kitui East", "Kitui South",
  ],
  // ─── 016 MACHAKOS ───────────────────────────────────────────
  Machakos: [
    "Masinga", "Yatta", "Kangundo", "Matungulu",
    "Kathiani", "Mavoko", "Machakos Town", "Mwala",
  ],
  // ─── 017 MAKUENI ────────────────────────────────────────────
  Makueni: [
    "Mbooni", "Kilome", "Kaiti",
    "Makueni", "Kibwezi West", "Kibwezi East",
  ],
  // ─── 018 NYANDARUA ──────────────────────────────────────────
  Nyandarua: [
    "Kinangop", "Kipipiri", "Ol Kalou", "Ol Jorok", "Ndaragwa",
  ],
  // ─── 019 NYERI ──────────────────────────────────────────────
  Nyeri: [
    "Tetu", "Kieni", "Mathira",
    "Othaya", "Mukurweini", "Nyeri Town",
  ],
  // ─── 020 KIRINYAGA ──────────────────────────────────────────
  Kirinyaga: [
    "Mwea", "Gichugu", "Ndia", "Kirinyaga Central",
  ],
  // ─── 021 MURANG'A ───────────────────────────────────────────
  "Murang'a": [
    "Kangema", "Mathioya", "Kiharu", "Kigumo",
    "Maragwa", "Kandara", "Gatanga",
  ],
  // ─── 022 KIAMBU ─────────────────────────────────────────────
  Kiambu: [
    "Gatundu South", "Gatundu North", "Juja", "Thika Town",
    "Ruiru", "Githunguri", "Kiambu", "Kiambaa",
    "Kabete", "Kikuyu", "Limuru", "Lari",
  ],
  // ─── 023 TURKANA ────────────────────────────────────────────
  Turkana: [
    "Turkana North", "Turkana West", "Turkana Central",
    "Loima", "Turkana South", "Turkana East",
  ],
  // ─── 024 WEST POKOT ─────────────────────────────────────────
  "West Pokot": [
    "Kapenguria", "Sigor", "Kacheliba", "Pokot South",
  ],
  // ─── 025 SAMBURU ────────────────────────────────────────────
  Samburu: [
    "Samburu West", "Samburu North", "Samburu East",
  ],
  // ─── 026 TRANS-NZOIA ────────────────────────────────────────
  "Trans-Nzoia": [
    "Kwanza", "Endebess", "Saboti", "Kiminini", "Cherangany",
  ],
  // ─── 027 UASIN GISHU ───────────────────────────────────────
  "Uasin Gishu": [
    "Soy", "Turbo", "Moiben", "Ainabkoi",
    "Kapseret", "Kesses",
  ],
  // ─── 028 ELGEYO-MARAKWET ────────────────────────────────────
  "Elgeyo-Marakwet": [
    "Marakwet East", "Marakwet West", "Keiyo North", "Keiyo South",
  ],
  // ─── 029 NANDI ──────────────────────────────────────────────
  Nandi: [
    "Tinderet", "Aldai", "Nandi Hills",
    "Chesumei", "Emgwen", "Mosop",
  ],
  // ─── 030 BARINGO ────────────────────────────────────────────
  Baringo: [
    "Tiaty", "Baringo North", "Baringo Central",
    "Baringo South", "Mogotio", "Eldama Ravine",
  ],
  // ─── 031 LAIKIPIA ───────────────────────────────────────────
  Laikipia: [
    "Laikipia West", "Laikipia East", "Laikipia North",
  ],
  // ─── 032 NAKURU ─────────────────────────────────────────────
  Nakuru: [
    "Molo", "Njoro", "Naivasha", "Gilgil",
    "Kuresoi South", "Kuresoi North", "Subukia",
    "Rongai", "Bahati", "Nakuru Town West", "Nakuru Town East",
  ],
  // ─── 033 NAROK ──────────────────────────────────────────────
  Narok: [
    "Kilgoris", "Emurua Dikirr", "Narok North",
    "Narok East", "Narok South", "Narok West",
  ],
  // ─── 034 KAJIADO ────────────────────────────────────────────
  Kajiado: [
    "Kajiado North", "Kajiado Central", "Kajiado East",
    "Kajiado West", "Kajiado South",
  ],
  // ─── 035 KERICHO ────────────────────────────────────────────
  Kericho: [
    "Kipkelion East", "Kipkelion West", "Ainamoi",
    "Bureti", "Belgut", "Sigowet/Soin",
  ],
  // ─── 036 BOMET ──────────────────────────────────────────────
  Bomet: [
    "Sotik", "Chepalungu", "Bomet East",
    "Bomet Central", "Konoin",
  ],
  // ─── 037 KAKAMEGA ───────────────────────────────────────────
  Kakamega: [
    "Lugari", "Likuyani", "Malava", "Lurambi",
    "Navakholo", "Mumias West", "Mumias East",
    "Matungu", "Butere", "Khwisero", "Shinyalu", "Ikolomani",
  ],
  // ─── 038 VIHIGA ─────────────────────────────────────────────
  Vihiga: [
    "Vihiga", "Sabatia", "Hamisi", "Luanda", "Emuhaya",
  ],
  // ─── 039 BUNGOMA ────────────────────────────────────────────
  Bungoma: [
    "Mount Elgon", "Sirisia", "Kabuchai", "Bumula",
    "Kanduyi", "Webuye East", "Webuye West",
    "Kimilili", "Tongaren",
  ],
  // ─── 040 BUSIA ──────────────────────────────────────────────
  Busia: [
    "Teso North", "Teso South", "Nambale",
    "Matayos", "Butula", "Funyula", "Budalangi",
  ],
  // ─── 041 SIAYA ──────────────────────────────────────────────
  Siaya: [
    "Ugenya", "Ugunja", "Alego Usonga",
    "Gem", "Bondo", "Rarieda",
  ],
  // ─── 042 KISUMU ─────────────────────────────────────────────
  Kisumu: [
    "Kisumu East", "Kisumu West", "Kisumu Central",
    "Seme", "Nyando", "Muhoroni", "Nyakach",
  ],
  // ─── 043 HOMA BAY ───────────────────────────────────────────
  "Homa Bay": [
    "Kasipul", "Kabondo Kasipul", "Karachuonyo",
    "Rangwe", "Homa Bay Town", "Ndhiwa",
    "Suba North", "Suba South",
  ],
  // ─── 044 MIGORI ─────────────────────────────────────────────
  Migori: [
    "Rongo", "Awendo", "Suna East", "Suna West",
    "Uriri", "Nyatike", "Kuria West", "Kuria East",
  ],
  // ─── 045 KISII ──────────────────────────────────────────────
  Kisii: [
    "Bonchari", "South Mugirango", "Bomachoge Borabu",
    "Bobasi", "Bomachoge Chache", "Nyaribari Masaba",
    "Nyaribari Chache", "Kitutu Chache North", "Kitutu Chache South",
  ],
  // ─── 046 NYAMIRA ────────────────────────────────────────────
  Nyamira: [
    "Kitutu Masaba", "West Mugirango",
    "North Mugirango", "Borabu",
  ],
  // ─── 047 NAIROBI ────────────────────────────────────────────
  Nairobi: [
    "Westlands", "Dagoretti North", "Dagoretti South",
    "Langata", "Kibra", "Roysambu", "Kasarani",
    "Ruaraka", "Embakasi South", "Embakasi North",
    "Embakasi Central", "Embakasi East", "Embakasi West",
    "Makadara", "Kamukunji", "Starehe", "Mathare",
  ],
};

export default KENYA_CONSTITUENCIES;

/**
 * Helper: Get constituencies for a given county name.
 * Returns empty array if county not found.
 */
export function getConstituencies(county) {
  return KENYA_CONSTITUENCIES[county] || [];
}

/**
 * Helper: Total constituency count for verification.
 * Should return 290.
 */
export function getTotalConstituencies() {
  return Object.values(KENYA_CONSTITUENCIES).reduce(
    (sum, arr) => sum + arr.length, 0
  );
}
