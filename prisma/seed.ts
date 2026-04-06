import { PrismaClient } from "@prisma/client";
import { OCUPATII_EXPANDED } from "./data/ocupatii";
import { GRUPE_DE_BAZA_EXTRA } from "./data/grupe-extra";

const prisma = new PrismaClient();

// ─── Diacritics normalization ────────────────────────────────────
const DIAC: Record<string, string> = {
  ă:"a",â:"a",î:"i",ș:"s",ț:"t",Ă:"a",Â:"a",Î:"i",Ș:"s",Ț:"t",ş:"s",ţ:"t",Ş:"s",Ţ:"t",
};
function norm(t: string): string {
  return t.replace(/[ăâîșțĂÂÎȘȚşţŞŢ]/g, m => DIAC[m] ?? m).toLowerCase().trim();
}

// ═══════════════════════════════════════════════════════════════════
// COR 2026 DATA — Based on official Romanian nomenclature
// Source: Clasificarea Ocupațiilor din România (COR), actualizat 2026
// Structure: ISCO-08 based, via HG 1352/2010 + subsequent amendments
// Latest: ORD. MMFTSS/INS 2207/1607/2026 (MOR 1220/31.12.2025)
// ═══════════════════════════════════════════════════════════════════

const GRUPE_MAJORE = [
  { code: "1", name: "Membrii corpului legislativ, ai executivului, înalți conducători ai administrației publice, conducători și funcționari superiori" },
  { code: "2", name: "Specialiști în diverse domenii de activitate" },
  { code: "3", name: "Tehnicieni și alți specialiști din domeniul tehnic" },
  { code: "4", name: "Funcționari administrativi" },
  { code: "5", name: "Lucrători în domeniul serviciilor și comerțului" },
  { code: "6", name: "Lucrători calificați în agricultură, silvicultură și pescuit" },
  { code: "7", name: "Muncitori calificați și asimilați" },
  { code: "8", name: "Operatori la instalații și mașini; asamblori de echipamente" },
  { code: "9", name: "Muncitori necalificați din agricultură, silvicultură, pescuit și alte domenii" },
];

const SUBGRUPE_MAJORE = [
  { code: "11", name: "Legislatori și înalți funcționari", grupaMajora: "1" },
  { code: "12", name: "Conducători ai unor întreprinderi și companii", grupaMajora: "1" },
  { code: "13", name: "Conducători în domeniul producției și serviciilor", grupaMajora: "1" },
  { code: "14", name: "Conducători în domeniul hotelier, comerț și alte servicii", grupaMajora: "1" },
  { code: "21", name: "Specialiști în științe fizice, matematice și inginerești", grupaMajora: "2" },
  { code: "22", name: "Specialiști în domeniul sănătății", grupaMajora: "2" },
  { code: "23", name: "Specialiști în învățământ", grupaMajora: "2" },
  { code: "24", name: "Specialiști în domeniul afacerilor și administrației", grupaMajora: "2" },
  { code: "25", name: "Specialiști în tehnologia informației și comunicațiilor", grupaMajora: "2" },
  { code: "26", name: "Specialiști în domeniul juridic, social și cultural", grupaMajora: "2" },
  { code: "31", name: "Tehnicieni în domeniul științei și ingineriei", grupaMajora: "3" },
  { code: "32", name: "Tehnicieni și asistenți medicali", grupaMajora: "3" },
  { code: "33", name: "Tehnicieni în domeniul afacerilor și administrației", grupaMajora: "3" },
  { code: "34", name: "Tehnicieni în domeniul juridic, social, cultural și asimilați", grupaMajora: "3" },
  { code: "35", name: "Tehnicieni în tehnologia informației și comunicațiilor", grupaMajora: "3" },
  { code: "41", name: "Funcționari în servicii generale de birou", grupaMajora: "4" },
  { code: "42", name: "Funcționari care lucrează cu clienții", grupaMajora: "4" },
  { code: "43", name: "Funcționari la evidența contabilă, financiară și a stocurilor", grupaMajora: "4" },
  { code: "44", name: "Alți funcționari administrativi", grupaMajora: "4" },
  { code: "51", name: "Lucrători în domeniul serviciilor personale", grupaMajora: "5" },
  { code: "52", name: "Lucrători în domeniul vânzărilor", grupaMajora: "5" },
  { code: "53", name: "Lucrători în domeniul serviciilor de îngrijire personală", grupaMajora: "5" },
  { code: "54", name: "Lucrători în domeniul serviciilor de protecție", grupaMajora: "5" },
  { code: "61", name: "Agricultori și lucrători calificați în agricultură", grupaMajora: "6" },
  { code: "62", name: "Lucrători calificați în silvicultură, pescuit și vânătoare", grupaMajora: "6" },
  { code: "71", name: "Muncitori în construcții și asimilați", grupaMajora: "7" },
  { code: "72", name: "Muncitori în prelucrarea metalelor, construcții mecanice și asimilați", grupaMajora: "7" },
  { code: "73", name: "Muncitori meșteșugari și tipografi", grupaMajora: "7" },
  { code: "74", name: "Tehnicieni la echipamente electrice și electronice", grupaMajora: "7" },
  { code: "75", name: "Muncitori în industria alimentară, prelucrarea lemnului, confecții", grupaMajora: "7" },
  { code: "81", name: "Operatori la instalații fixe și mașini", grupaMajora: "8" },
  { code: "82", name: "Asamblori", grupaMajora: "8" },
  { code: "83", name: "Conducători de vehicule și operatori la instalații mobile", grupaMajora: "8" },
  { code: "91", name: "Personal de curățenie și ajutor", grupaMajora: "9" },
  { code: "92", name: "Muncitori necalificați în agricultură, silvicultură și pescuit", grupaMajora: "9" },
  { code: "93", name: "Muncitori necalificați în minerit, construcții, industrie și transporturi", grupaMajora: "9" },
  { code: "94", name: "Ajutori în prepararea alimentelor", grupaMajora: "9" },
  { code: "95", name: "Vânzători stradali și asimilați", grupaMajora: "9" },
  { code: "96", name: "Muncitori necalificați în alte domenii", grupaMajora: "9" },
];

const GRUPE_MINORE = [
  { code: "111", name: "Legislatori și înalți funcționari ai administrației publice", subgrupaMajora: "11" },
  { code: "112", name: "Conducători executivi și înalți funcționari ai administrației publice", subgrupaMajora: "11" },
  { code: "121", name: "Directori generali, executivi și asimilați", subgrupaMajora: "12" },
  { code: "122", name: "Conducători în domeniul vânzărilor, marketingului și dezvoltării", subgrupaMajora: "12" },
  { code: "131", name: "Conducători în producția din agricultură, silvicultură și pescuit", subgrupaMajora: "13" },
  { code: "132", name: "Conducători în industria prelucrătoare, minerit, construcții și distribuție", subgrupaMajora: "13" },
  { code: "133", name: "Conducători în domeniul TIC", subgrupaMajora: "13" },
  { code: "134", name: "Conducători în domeniul serviciilor profesionale", subgrupaMajora: "13" },
  { code: "141", name: "Conducători de hoteluri și restaurante", subgrupaMajora: "14" },
  { code: "142", name: "Conducători în comerțul cu amănuntul și ridicata", subgrupaMajora: "14" },
  { code: "211", name: "Fizicieni, chimisti, geologi și asimilați", subgrupaMajora: "21" },
  { code: "212", name: "Matematicieni, actuari și statisticieni", subgrupaMajora: "21" },
  { code: "213", name: "Specialiști în științele vieții", subgrupaMajora: "21" },
  { code: "214", name: "Ingineri (exclusiv ingineri electroniști)", subgrupaMajora: "21" },
  { code: "215", name: "Ingineri electroniști și în telecomunicații", subgrupaMajora: "21" },
  { code: "216", name: "Arhitecți, proiectanți, topografi și designeri", subgrupaMajora: "21" },
  { code: "221", name: "Medici", subgrupaMajora: "22" },
  { code: "222", name: "Specialiști în nursing și moșe", subgrupaMajora: "22" },
  { code: "223", name: "Medici veterinari", subgrupaMajora: "22" },
  { code: "224", name: "Medici stomatologi", subgrupaMajora: "22" },
  { code: "225", name: "Farmaciști", subgrupaMajora: "22" },
  { code: "226", name: "Alți specialiști în domeniul sănătății", subgrupaMajora: "22" },
  { code: "231", name: "Profesori universitari și de învățământ superior", subgrupaMajora: "23" },
  { code: "232", name: "Profesori în învățământul primar și preșcolar", subgrupaMajora: "23" },
  { code: "233", name: "Profesori în învățământul secundar", subgrupaMajora: "23" },
  { code: "234", name: "Profesori în învățământul special", subgrupaMajora: "23" },
  { code: "235", name: "Alți specialiști în învățământ", subgrupaMajora: "23" },
  { code: "241", name: "Specialiști în finanțe", subgrupaMajora: "24" },
  { code: "242", name: "Specialiști în administrație", subgrupaMajora: "24" },
  { code: "243", name: "Specialiști în marketing și relații publice", subgrupaMajora: "24" },
  { code: "251", name: "Analiști și dezvoltatori de software și aplicații", subgrupaMajora: "25" },
  { code: "252", name: "Specialiști în baze de date și rețele", subgrupaMajora: "25" },
  { code: "261", name: "Specialiști în domeniul juridic", subgrupaMajora: "26" },
  { code: "262", name: "Bibliotecari, arhiviști și conservatori", subgrupaMajora: "26" },
  { code: "263", name: "Specialiști în domeniul social și religios", subgrupaMajora: "26" },
  { code: "264", name: "Autori, jurnaliști și lingviști", subgrupaMajora: "26" },
  { code: "265", name: "Artiști creativi și de spectacol", subgrupaMajora: "26" },
  { code: "311", name: "Tehnicieni în științe fizice și inginerești", subgrupaMajora: "31" },
  { code: "312", name: "Tehnicieni în minerit, industria prelucrătoare și construcții", subgrupaMajora: "31" },
  { code: "313", name: "Tehnicieni în controlul proceselor", subgrupaMajora: "31" },
  { code: "314", name: "Tehnicieni în științele biologice, agronomie și asimilați", subgrupaMajora: "31" },
  { code: "315", name: "Comandanți de nave și piloți de avioane", subgrupaMajora: "31" },
  { code: "321", name: "Tehnicieni în domeniul medical și farmaceutic", subgrupaMajora: "32" },
  { code: "322", name: "Asistenți medicali și moașe, nivel mediu", subgrupaMajora: "32" },
  { code: "325", name: "Alți tehnicieni în domeniul sănătății", subgrupaMajora: "32" },
  { code: "331", name: "Specialiști în finanțe și matematici, nivel mediu", subgrupaMajora: "33" },
  { code: "332", name: "Agenți de vânzări, brokeri și asimilați", subgrupaMajora: "33" },
  { code: "333", name: "Agenți comerciali", subgrupaMajora: "33" },
  { code: "334", name: "Secretari administrativi și asimilați", subgrupaMajora: "33" },
  { code: "335", name: "Agenți guvernamentali", subgrupaMajora: "33" },
  { code: "341", name: "Tehnicieni în domeniul juridic și social, asimilați", subgrupaMajora: "34" },
  { code: "342", name: "Lucrători în domeniul sportului și fitness-ului", subgrupaMajora: "34" },
  { code: "343", name: "Tehnicieni în domeniul artistic, cultural și culinar", subgrupaMajora: "34" },
  { code: "351", name: "Tehnicieni IT operaționali și de asistență", subgrupaMajora: "35" },
  { code: "352", name: "Tehnicieni în telecomunicații și transmisiuni", subgrupaMajora: "35" },
  { code: "411", name: "Funcționari de birou cu atribuții generale", subgrupaMajora: "41" },
  { code: "412", name: "Secretari", subgrupaMajora: "41" },
  { code: "413", name: "Operatori de echipamente de birou", subgrupaMajora: "41" },
  { code: "421", name: "Casieri și asimilați", subgrupaMajora: "42" },
  { code: "422", name: "Funcționari de la ghișeu", subgrupaMajora: "42" },
  { code: "431", name: "Funcționari la evidența contabilă și financiară", subgrupaMajora: "43" },
  { code: "432", name: "Funcționari la evidența stocurilor și transporturilor", subgrupaMajora: "43" },
  { code: "441", name: "Alți funcționari administrativi", subgrupaMajora: "44" },
  { code: "511", name: "Însoțitori de zbor și stewarzi", subgrupaMajora: "51" },
  { code: "512", name: "Bucătari", subgrupaMajora: "51" },
  { code: "513", name: "Ospătari și barmani", subgrupaMajora: "51" },
  { code: "514", name: "Frizeri, cosmeticieni și asimilați", subgrupaMajora: "51" },
  { code: "515", name: "Supraveghetori clădiri și menajere", subgrupaMajora: "51" },
  { code: "516", name: "Alți lucrători în domeniul serviciilor personale", subgrupaMajora: "51" },
  { code: "521", name: "Vânzători în magazine", subgrupaMajora: "52" },
  { code: "522", name: "Vânzători la tarabe și piețe", subgrupaMajora: "52" },
  { code: "524", name: "Alți vânzători", subgrupaMajora: "52" },
  { code: "531", name: "Bone și îngrijitori de copii", subgrupaMajora: "53" },
  { code: "532", name: "Îngrijitori de sănătate personală", subgrupaMajora: "53" },
  { code: "541", name: "Personal de protecție și pază", subgrupaMajora: "54" },
  { code: "611", name: "Agricultori și crescători de animale", subgrupaMajora: "61" },
  { code: "612", name: "Crescători de animale", subgrupaMajora: "61" },
  { code: "613", name: "Agricultori și crescători de animale, pentru subzistență", subgrupaMajora: "61" },
  { code: "621", name: "Lucrători calificați în silvicultură", subgrupaMajora: "62" },
  { code: "622", name: "Pescari și vânători", subgrupaMajora: "62" },
  { code: "711", name: "Constructori de clădiri și asimilați", subgrupaMajora: "71" },
  { code: "712", name: "Constructori la finisaje și asimilați", subgrupaMajora: "71" },
  { code: "713", name: "Zugravi, vopsitori, lăcuitori și asimilați", subgrupaMajora: "71" },
  { code: "721", name: "Turnători, sudori, tinichigii și asimilați", subgrupaMajora: "72" },
  { code: "722", name: "Fierari, lăcătuși și asimilați", subgrupaMajora: "72" },
  { code: "723", name: "Mecanici și reparatori de mașini", subgrupaMajora: "72" },
  { code: "731", name: "Meșteșugari și tipografi", subgrupaMajora: "73" },
  { code: "741", name: "Instalatori și reparatori de echipamente electrice", subgrupaMajora: "74" },
  { code: "742", name: "Montatori de echipamente electronice și de telecomunicații", subgrupaMajora: "74" },
  { code: "751", name: "Muncitori în industria alimentară", subgrupaMajora: "75" },
  { code: "752", name: "Muncitori în prelucrarea lemnului și mobilierului", subgrupaMajora: "75" },
  { code: "753", name: "Muncitori în industria confecțiilor", subgrupaMajora: "75" },
  { code: "811", name: "Operatori la instalații miniere și de extracție", subgrupaMajora: "81" },
  { code: "812", name: "Operatori la instalații de prelucrare a metalelor", subgrupaMajora: "81" },
  { code: "813", name: "Operatori la instalații chimice și de producție", subgrupaMajora: "81" },
  { code: "814", name: "Operatori la mașini de fabricat produse din cauciuc, plastic și hârtie", subgrupaMajora: "81" },
  { code: "815", name: "Operatori la mașini de fabricat produse textile", subgrupaMajora: "81" },
  { code: "816", name: "Operatori la mașini de preparat alimente", subgrupaMajora: "81" },
  { code: "821", name: "Asamblori", subgrupaMajora: "82" },
  { code: "831", name: "Conducători de locomotive", subgrupaMajora: "83" },
  { code: "832", name: "Conducători de vehicule auto", subgrupaMajora: "83" },
  { code: "833", name: "Conducători de vehicule grele", subgrupaMajora: "83" },
  { code: "834", name: "Conducători de nave și asimilați", subgrupaMajora: "83" },
  { code: "911", name: "Menajere și personal de curățenie", subgrupaMajora: "91" },
  { code: "912", name: "Spălători de vehicule, geamuri și asimilați", subgrupaMajora: "91" },
  { code: "921", name: "Muncitori necalificați în agricultură", subgrupaMajora: "92" },
  { code: "931", name: "Muncitori necalificați în minerit și construcții", subgrupaMajora: "93" },
  { code: "932", name: "Muncitori necalificați în industria prelucrătoare", subgrupaMajora: "93" },
  { code: "933", name: "Muncitori necalificați în transporturi", subgrupaMajora: "93" },
  { code: "941", name: "Ajutori de bucătărie", subgrupaMajora: "94" },
  { code: "951", name: "Lucrători stradali", subgrupaMajora: "95" },
  { code: "952", name: "Vânzători stradali (exclusiv alimente)", subgrupaMajora: "95" },
  { code: "961", name: "Muncitori necalificați la colectarea deșeurilor", subgrupaMajora: "96" },
  { code: "962", name: "Alte ocupații elementare", subgrupaMajora: "96" },
];

// Grupe de bază (4-digit) — representative set
const GRUPE_DE_BAZA = [
  { code: "1112", name: "Înalți funcționari ai administrației publice", grupaMinora: "111" },
  { code: "1120", name: "Conducători executivi și directori generali", grupaMinora: "112" },
  { code: "1211", name: "Directori financiari", grupaMinora: "121" },
  { code: "1212", name: "Directori de resurse umane", grupaMinora: "121" },
  { code: "1213", name: "Directori de politici și planificare", grupaMinora: "121" },
  { code: "1221", name: "Directori de vânzări și marketing", grupaMinora: "122" },
  { code: "1311", name: "Conducători în agricultură și silvicultură", grupaMinora: "131" },
  { code: "1321", name: "Conducători în industria prelucrătoare", grupaMinora: "132" },
  { code: "1330", name: "Conducători în domeniul TIC", grupaMinora: "133" },
  { code: "1341", name: "Conducători în servicii de îngrijire a copiilor", grupaMinora: "134" },
  { code: "1342", name: "Conducători în servicii de sănătate", grupaMinora: "134" },
  { code: "1411", name: "Conducători de hoteluri", grupaMinora: "141" },
  { code: "1412", name: "Conducători de restaurante", grupaMinora: "141" },
  { code: "1420", name: "Conducători în comerț", grupaMinora: "142" },
  { code: "2111", name: "Fizicieni și astronomi", grupaMinora: "211" },
  { code: "2112", name: "Meteorologi", grupaMinora: "211" },
  { code: "2113", name: "Chimiști", grupaMinora: "211" },
  { code: "2114", name: "Geologi și geofizicieni", grupaMinora: "211" },
  { code: "2120", name: "Matematicieni, actuari și statisticieni", grupaMinora: "212" },
  { code: "2131", name: "Biologi, botanici, zoologi și asimilați", grupaMinora: "213" },
  { code: "2141", name: "Ingineri industriali și de producție", grupaMinora: "214" },
  { code: "2142", name: "Ingineri constructori", grupaMinora: "214" },
  { code: "2143", name: "Ingineri de mediu", grupaMinora: "214" },
  { code: "2144", name: "Ingineri mecanici", grupaMinora: "214" },
  { code: "2145", name: "Ingineri chimiști", grupaMinora: "214" },
  { code: "2146", name: "Ingineri de mine", grupaMinora: "214" },
  { code: "2149", name: "Alți ingineri", grupaMinora: "214" },
  { code: "2151", name: "Ingineri electroniști", grupaMinora: "215" },
  { code: "2152", name: "Ingineri în telecomunicații", grupaMinora: "215" },
  { code: "2161", name: "Arhitecți", grupaMinora: "216" },
  { code: "2162", name: "Arhitecți peisagiști", grupaMinora: "216" },
  { code: "2163", name: "Designeri de produs și de îmbrăcăminte", grupaMinora: "216" },
  { code: "2164", name: "Urbaniști și ingineri de trafic", grupaMinora: "216" },
  { code: "2165", name: "Cartografi și topografi", grupaMinora: "216" },
  { code: "2166", name: "Designeri grafici și multimedia", grupaMinora: "216" },
  { code: "2211", name: "Medici generaliști", grupaMinora: "221" },
  { code: "2212", name: "Medici specialiști", grupaMinora: "221" },
  { code: "2221", name: "Specialiști în nursing", grupaMinora: "222" },
  { code: "2222", name: "Moașe", grupaMinora: "222" },
  { code: "2230", name: "Medici veterinari", grupaMinora: "223" },
  { code: "2240", name: "Medici stomatologi", grupaMinora: "224" },
  { code: "2250", name: "Farmaciști", grupaMinora: "225" },
  { code: "2261", name: "Medici stomatologi", grupaMinora: "226" },
  { code: "2262", name: "Farmaciști", grupaMinora: "226" },
  { code: "2263", name: "Specialiști în domeniul mediului și igienei", grupaMinora: "226" },
  { code: "2264", name: "Fizioterapeuți", grupaMinora: "226" },
  { code: "2265", name: "Dieteticieni și nutriționiști", grupaMinora: "226" },
  { code: "2266", name: "Audiologi și logopezi", grupaMinora: "226" },
  { code: "2267", name: "Optometriști", grupaMinora: "226" },
  { code: "2269", name: "Alți specialiști în sănătate", grupaMinora: "226" },
  { code: "2310", name: "Profesori universitari", grupaMinora: "231" },
  { code: "2320", name: "Profesori în învățământul primar și preșcolar", grupaMinora: "232" },
  { code: "2330", name: "Profesori în învățământul secundar", grupaMinora: "233" },
  { code: "2341", name: "Profesori în învățământul primar", grupaMinora: "234" },
  { code: "2342", name: "Educatoare în învățământul preșcolar", grupaMinora: "234" },
  { code: "2351", name: "Specialiști în metode de predare", grupaMinora: "235" },
  { code: "2352", name: "Profesori în învățământul special", grupaMinora: "235" },
  { code: "2411", name: "Contabili", grupaMinora: "241" },
  { code: "2412", name: "Auditori financiari și consultanți fiscali", grupaMinora: "241" },
  { code: "2413", name: "Analiști financiari", grupaMinora: "241" },
  { code: "2421", name: "Analiști de management și organizare", grupaMinora: "242" },
  { code: "2422", name: "Specialiști în administrație publică", grupaMinora: "242" },
  { code: "2423", name: "Specialiști în resurse umane", grupaMinora: "242" },
  { code: "2424", name: "Specialiști în formarea personalului", grupaMinora: "242" },
  { code: "2431", name: "Specialiști în publicitate și marketing", grupaMinora: "243" },
  { code: "2432", name: "Specialiști în relații publice", grupaMinora: "243" },
  { code: "2511", name: "Analiști de sistem", grupaMinora: "251" },
  { code: "2512", name: "Dezvoltatori de software", grupaMinora: "251" },
  { code: "2513", name: "Dezvoltatori web și multimedia", grupaMinora: "251" },
  { code: "2514", name: "Programatori de aplicații", grupaMinora: "251" },
  { code: "2519", name: "Alți specialiști în dezvoltarea de software", grupaMinora: "251" },
  { code: "2521", name: "Designeri și administratori de baze de date", grupaMinora: "252" },
  { code: "2522", name: "Administratori de sisteme", grupaMinora: "252" },
  { code: "2523", name: "Specialiști în rețele de calculatoare", grupaMinora: "252" },
  { code: "2529", name: "Alți specialiști în baze de date și rețele", grupaMinora: "252" },
  { code: "2611", name: "Avocați", grupaMinora: "261" },
  { code: "2612", name: "Judecători", grupaMinora: "261" },
  { code: "2619", name: "Juriști, asimilați", grupaMinora: "261" },
  { code: "2621", name: "Arhiviști și conservatori", grupaMinora: "262" },
  { code: "2622", name: "Bibliotecari și documentariști", grupaMinora: "262" },
  { code: "2631", name: "Economiști", grupaMinora: "263" },
  { code: "2632", name: "Sociologi, antropologi și asimilați", grupaMinora: "263" },
  { code: "2633", name: "Filozofi, istorici și politologi", grupaMinora: "263" },
  { code: "2634", name: "Psihologi", grupaMinora: "263" },
  { code: "2635", name: "Asistenți sociali", grupaMinora: "263" },
  { code: "2636", name: "Specialiști în domeniul religios", grupaMinora: "263" },
  { code: "2641", name: "Scriitori și asimilați", grupaMinora: "264" },
  { code: "2642", name: "Jurnaliști", grupaMinora: "264" },
  { code: "2643", name: "Traducători, interpreți și lingviști", grupaMinora: "264" },
  { code: "2651", name: "Artiști plastici", grupaMinora: "265" },
  { code: "2652", name: "Muzicieni, cântăreți și compozitori", grupaMinora: "265" },
  { code: "2653", name: "Dansatori și coregrafi", grupaMinora: "265" },
  { code: "2654", name: "Regizori, producători, actori", grupaMinora: "265" },
  { code: "2655", name: "Actori", grupaMinora: "265" },
  { code: "2656", name: "Prezentatori radio, TV", grupaMinora: "265" },
  { code: "5120", name: "Bucătari", grupaMinora: "512" },
  { code: "5131", name: "Ospătari", grupaMinora: "513" },
  { code: "5132", name: "Barmani", grupaMinora: "513" },
  { code: "5141", name: "Frizeri", grupaMinora: "514" },
  { code: "5142", name: "Cosmeticieni și asimilați", grupaMinora: "514" },
  { code: "5151", name: "Supraveghetori de curățenie în birouri și hoteluri", grupaMinora: "515" },
  { code: "5163", name: "Personal servicii funerare", grupaMinora: "516" },
  { code: "5164", name: "Îngrijitori de animale", grupaMinora: "516" },
  { code: "5165", name: "Instructori auto", grupaMinora: "516" },
  { code: "5211", name: "Vânzători la tarabe și piețe", grupaMinora: "521" },
  { code: "5221", name: "Vânzători în magazine", grupaMinora: "522" },
  { code: "5223", name: "Vânzători în magazine de telefonie", grupaMinora: "522" },
  { code: "5230", name: "Casieri", grupaMinora: "522" },
  { code: "5311", name: "Bone", grupaMinora: "531" },
  { code: "5321", name: "Îngrijitori de sănătate", grupaMinora: "532" },
  { code: "5411", name: "Pompieri", grupaMinora: "541" },
  { code: "5412", name: "Polițiști", grupaMinora: "541" },
  { code: "5413", name: "Personal de pază și protecție", grupaMinora: "541" },
  { code: "5414", name: "Agent de securitate", grupaMinora: "541" },
  { code: "7111", name: "Constructori de case", grupaMinora: "711" },
  { code: "7112", name: "Zidari", grupaMinora: "711" },
  { code: "7114", name: "Betonisti, fierar-betonisti", grupaMinora: "711" },
  { code: "7115", name: "Dulgheri și tâmplari", grupaMinora: "711" },
  { code: "7121", name: "Acoperitori de imobile", grupaMinora: "712" },
  { code: "7122", name: "Parchetari și montatori de podele", grupaMinora: "712" },
  { code: "7124", name: "Instalatori și montatori de izolații", grupaMinora: "712" },
  { code: "7125", name: "Geamgii", grupaMinora: "712" },
  { code: "7126", name: "Instalatori sanitari", grupaMinora: "712" },
  { code: "7127", name: "Mecanici de instalații de climatizare și frigorifice", grupaMinora: "712" },
  { code: "7131", name: "Zugravi și asimilați", grupaMinora: "713" },
  { code: "7211", name: "Turnători și sudori", grupaMinora: "721" },
  { code: "7212", name: "Sudori și oxitailori", grupaMinora: "721" },
  { code: "7213", name: "Tinichigii", grupaMinora: "721" },
  { code: "7221", name: "Fierari", grupaMinora: "722" },
  { code: "7222", name: "Lăcătuși și asimilați", grupaMinora: "722" },
  { code: "7231", name: "Mecanici auto", grupaMinora: "723" },
  { code: "7232", name: "Mecanici de avioane", grupaMinora: "723" },
  { code: "7233", name: "Mecanici de mașini agricole și industriale", grupaMinora: "723" },
  { code: "8311", name: "Conducători de locomotive", grupaMinora: "831" },
  { code: "8321", name: "Conducători de autoturisme, taxiuri și camionete", grupaMinora: "832" },
  { code: "8322", name: "Conducători auto de autobuze și tramvaie", grupaMinora: "832" },
  { code: "8331", name: "Conducători de autobuze și tramvaie", grupaMinora: "833" },
  { code: "8332", name: "Conducători de autocamioane", grupaMinora: "833" },
  { code: "9111", name: "Menajere", grupaMinora: "911" },
  { code: "9112", name: "Personal de serviciu în birouri și hoteluri", grupaMinora: "911" },
  { code: "9121", name: "Spălători de vehicule", grupaMinora: "912" },
  { code: "9122", name: "Spălători de geamuri", grupaMinora: "912" },
  { code: "9211", name: "Muncitori necalificați la întreținerea culturilor", grupaMinora: "921" },
  { code: "9212", name: "Muncitori necalificați la creșterea animalelor", grupaMinora: "921" },
  { code: "9311", name: "Muncitori necalificați în minerit", grupaMinora: "931" },
  { code: "9312", name: "Muncitori necalificați în construcții civile", grupaMinora: "931" },
  { code: "9313", name: "Muncitori necalificați la întreținerea drumurilor", grupaMinora: "931" },
  { code: "9321", name: "Ambalatori manuali", grupaMinora: "932" },
  { code: "9331", name: "Conducători de vehicule cu tracțiune animală", grupaMinora: "933" },
  { code: "9412", name: "Ajutori de bucătărie", grupaMinora: "941" },
  { code: "9510", name: "Lucrători stradali", grupaMinora: "951" },
  { code: "9520", name: "Vânzători stradali", grupaMinora: "952" },
  { code: "9611", name: "Gunoieri", grupaMinora: "961" },
  { code: "9612", name: "Sortatori de deșeuri", grupaMinora: "961" },
  { code: "9621", name: "Curieri și distribuitori", grupaMinora: "962" },
  { code: "9622", name: "Muncitori necalificați la diverse", grupaMinora: "962" },
  { code: "9623", name: "Cititori de contoare și colectori", grupaMinora: "962" },
  { code: "9624", name: "Transportatori de apă și colectori de lemne", grupaMinora: "962" },
  { code: "9629", name: "Alte ocupații elementare", grupaMinora: "962" },
];

// Use expanded dataset from data file (500+ occupations)
const OCUPATII = OCUPATII_EXPANDED;


// ═══════════════════════════════════════════════════════════════════
async function main() {
  console.log("🇷🇴 Seeding COR 2026 database...\n");

  // 1) Grupe majore
  console.log("  → Grupe majore...");
  for (const g of GRUPE_MAJORE) {
    await prisma.grupaMajora.upsert({
      where: { code: g.code },
      update: { name: g.name },
      create: { code: g.code, name: g.name },
    });
  }

  // 2) Subgrupe majore
  console.log("  → Subgrupe majore...");
  for (const s of SUBGRUPE_MAJORE) {
    await prisma.subgrupaMajora.upsert({
      where: { code: s.code },
      update: { name: s.name, grupaMajora: s.grupaMajora },
      create: { code: s.code, name: s.name, grupaMajora: s.grupaMajora },
    });
  }

  // 3) Grupe minore
  console.log("  → Grupe minore...");
  for (const m of GRUPE_MINORE) {
    await prisma.grupaMinora.upsert({
      where: { code: m.code },
      update: { name: m.name, subgrupaMajora: m.subgrupaMajora },
      create: { code: m.code, name: m.name, subgrupaMajora: m.subgrupaMajora },
    });
  }

  // 4) Grupe de bază
  console.log("  → Grupe de bază...");
  for (const b of GRUPE_DE_BAZA) {
    await prisma.grupaDeBaza.upsert({
      where: { code: b.code },
      update: { name: b.name, grupaMinora: b.grupaMinora },
      create: { code: b.code, name: b.name, grupaMinora: b.grupaMinora },
    });
  }

  // 4b) Extra grupe de bază (for expanded occupation dataset)
  console.log("  → Grupe de bază (extra)...");
  for (const b of GRUPE_DE_BAZA_EXTRA) {
    await prisma.grupaDeBaza.upsert({
      where: { code: b.code },
      update: { name: b.name, grupaMinora: b.grupaMinora },
      create: { code: b.code, name: b.name, grupaMinora: b.grupaMinora },
    });
  }

  // 5) Ocupații
  console.log("  → Ocupații...");
  let count = 0;
  for (const o of OCUPATII) {
    const grupaDeBaza = o.code.substring(0, 4);
    const grupaMinora = o.code.substring(0, 3);
    const subgrupaMajora = o.code.substring(0, 2);
    const grupaMajora = o.code.substring(0, 1);

    // Verify parent exists
    const bazaExists = await prisma.grupaDeBaza.findUnique({ where: { code: grupaDeBaza } });
    if (!bazaExists) continue; // skip if parent group doesn't exist in seed

    await prisma.ocupatie.upsert({
      where: { code: o.code },
      update: { name: o.name, nameNormalized: norm(o.name) },
      create: {
        code: o.code,
        name: o.name,
        nameNormalized: norm(o.name),
        grupaMajora,
        subgrupaMajora,
        grupaMinora,
        grupaDeBaza,
      },
    });
    count++;
  }

  console.log(`\n✅ Seed complete: ${GRUPE_MAJORE.length} grupe majore, ${SUBGRUPE_MAJORE.length} subgrupe, ${GRUPE_MINORE.length} grupe minore, ${GRUPE_DE_BAZA.length} grupe de bază, ${count} ocupații`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
