import * as assert from 'assert';
import * as fc from 'fast-check';

import { congruential32 } from '../../../src/generator/LinearCongruential';
import * as p from './RandomGenerator.properties';

describe('congruential32', () => {
  it('Should produce the right sequence for seed=42', () => {
    let g = congruential32(42);
    const data = [];
    for (let idx = 0; idx !== 1000; ++idx) {
      const [v, nextG] = g.next();
      data.push(v);
      g = nextG;
    }
    assert.deepEqual(
      data,
      [
        3234350541, 527020623, 250494401, 2135749886, 3453847840, 1768043920, 3865977547, 3120260103, 2378176704,
        3334114947, 2265379032, 1332836779, 2062426087, 4121359587, 3757575956, 3358259829, 3704101252, 3758918454,
        4194525353, 2542924373, 217440218, 3519482194, 1726011385, 1653505356, 1852543577, 1929301549, 2169742874,
        3308492120, 3155389883, 78406889, 3018048146, 1703776674, 1963946594, 1026705694, 1546700628, 26198758,
        3433100529, 1126200938, 15228153, 3324074273, 2746283304, 1678446390, 1885156162, 1565458049, 2985449221,
        93300426, 1035813326, 26530696, 3836336663, 778959507, 1927728407, 3293427842, 1494543140, 2781390515,
        3973999538, 2504233002, 2020420606, 3330449866, 2028210119, 2036000663, 462441890, 3300658178, 3895335118,
        4267618156, 2085001362, 57843040, 1882689931, 2582966847, 1512488819, 2017247049, 230440523, 2175087689,
        1495128042, 2066324818, 2152402783, 2853038158, 3214120370, 2159950156, 3565128665, 4213908943, 1513268225,
        2618609295, 2463426693, 1741327470, 726415645, 1192726662, 3374055210, 1981087905, 1809858617, 3470987387,
        2224202242, 658550170, 1145091476, 574674596, 849053558, 1280997493, 39522516, 1615264365, 2114931230,
        1983369379, 4087044511, 1695860230, 2671130871, 243468693, 678576763, 4071797039, 1952281574, 1206528429,
        2273207783, 3020898115, 1493897325, 3010157153, 1984823738, 941395074, 3520676523, 2831410608, 1036537019,
        3809416867, 1122322073, 268365001, 2956018304, 3015412889, 1189807491, 2049065977, 1993376138, 1528115621,
        2633511876, 3606880213, 221812641, 2211028892, 1120133829, 4128604073, 2418661485, 3355669625, 4053975863,
        1622573343, 639277654, 859977509, 1411257231, 3139406131, 660501916, 241074053, 1781298882, 4207898198,
        3421004217, 2476879300, 4060098370, 3757346784, 1152699638, 151796962, 3414653495, 2147190459, 2261518923,
        2661907581, 1819838210, 3476740941, 770453884, 253083102, 1527793390, 4156714149, 3167407473, 3759718470,
        90214712, 1799976169, 3774805204, 1097164921, 3947681602, 1044141823, 3229821168, 3883143052, 4045137170,
        971645306, 3068106441, 2693231851, 1353574928, 869593798, 3354236535, 29433773, 4283844096, 404368023,
        3996976327, 1785314074, 3192739389, 1963463822, 3407696659, 3142007421, 2882027319, 902232109, 2654923105,
        1986598, 179269166, 3659938300, 2331915963, 693044163, 3606236975, 2576316924, 289803213, 3549819872,
        1552020303, 4279196491, 3222772676, 2078609083, 2799706919, 1820778777, 2276376420, 2640727628, 2136807823,
        1391889610, 2974406251, 3616949140, 2414273182, 233843051, 2727273253, 1518664997, 1619237601, 807465050,
        4069506128, 4147221745, 1164249818, 2936140593, 4134891826, 2450190679, 866212539, 2074441459, 1270758391,
        2508785003, 1384438371, 916696185, 3324780111, 3807485060, 2139888024, 221016605, 3343090760, 523271435,
        3673738374, 3979315880, 2776041832, 3654774402, 2466592888, 514946425, 2833857550, 2889641682, 1136534740,
        1882346487, 2211740426, 246981337, 2708835420, 1145112632, 210815353, 3255094835, 2212235939, 2921887985,
        3745166566, 1253531207, 129155533, 3954878112, 1828137374, 484627605, 3710104714, 1782775288, 3738980691,
        4124351550, 2025410644, 613323661, 2457098228, 2180126420, 3169887207, 3357717695, 367309515, 2360765539,
        309526017, 796981739, 1773618647, 1490053823, 82309211, 1604077008, 3996779371, 3730931727, 1517318886,
        2523225663, 1116430855, 1297882265, 1001923402, 410388998, 3141256310, 1375700944, 1655626907, 2346934301,
        915746856, 4185388187, 635151198, 3458708498, 4102254033, 3030048998, 2522096059, 3543354289, 3088347201,
        3603303534, 2253664258, 2073741815, 2560892293, 1323242184, 2926650723, 803306297, 1218467391, 2020439219,
        2272292073, 1860923024, 3085752130, 1121688735, 3468630712, 1569261703, 2548814193, 2362714749, 193363335,
        86473479, 656659417, 2982154952, 2321737823, 1335512705, 176448524, 2808372435, 1706537109, 772728925,
        1514954944, 1772063828, 3500776453, 957725347, 2828012199, 1380516401, 4205820816, 2010351848, 3881881488,
        2603507849, 1103949271, 1548643962, 881832894, 1747992069, 157517368, 1658458574, 1897362823, 2541892705,
        732812296, 3802706216, 3927852848, 906532405, 2614232595, 3178755212, 3114253064, 1440012296, 781788752,
        3160158437, 3836755395, 1690597526, 2680465897, 129239156, 493075224, 3242194016, 2315604330, 1211208826,
        2924726429, 2870382708, 2811155783, 2668233768, 4123456225, 1316948094, 290560659, 3276037318, 1987217611,
        1194650639, 1389194238, 1915045666, 1676017969, 2578593580, 3364418320, 12588603, 4035892924, 2157310490,
        522710436, 2091086638, 2203776506, 1276732519, 3911146406, 3919927904, 453286340, 833890108, 2702090512,
        1255429612, 83177938, 165061345, 3467827234, 75735375, 2915807132, 1506427792, 3833450464, 1165599313,
        2978076019, 1739518334, 197915345, 2235491126, 4046742494, 3063289895, 3048837621, 92863013, 3565568313,
        2831665369, 1721520135, 617286103, 1017706380, 1712833667, 1376954611, 2951104388, 1325474985, 2221570239,
        3183497626, 1089516042, 2641246344, 273628188, 1084287940, 1495950943, 1378721254, 868275632, 3573434981,
        2215066937, 2774739227, 3640695773, 1393017364, 4049542650, 37677371, 2274866787, 168214984, 1421488865,
        566278001, 2574372774, 3459559380, 4156582510, 1092755607, 1176355136, 1899185956, 2378592789, 3118007576,
        3794372554, 4213141689, 1987843622, 557779722, 1352829414, 2588431714, 1035645692, 4124622471, 78773904,
        1602724796, 2255659876, 3224927307, 291110565, 3174319723, 4005091408, 2911306387, 3847589299, 1589216921,
        2599749052, 1235797044, 823567875, 1322210991, 3056734431, 3741604345, 350393316, 3259679059, 3582471061,
        1642507842, 353414201, 1033549985, 3433908492, 3985325786, 4066912837, 3940139436, 2711738285, 2025885975,
        1688191157, 2525214775, 763391053, 2284860472, 351807982, 3905889967, 2557037204, 2218913274, 3606954904,
        3516952172, 4271109804, 3097685371, 2103771498, 4246715433, 2893593645, 1668063316, 151536439, 3337618624,
        3223541320, 434800113, 1342528057, 2181498409, 2644288819, 1761549618, 1526516124, 1260259509, 75209940,
        925583431, 1450151501, 1003347078, 1955780784, 2385625800, 3594287620, 4097724241, 1874559253, 3529541139,
        1228795279, 2441320023, 2261413253, 2373269482, 1527348832, 3331254433, 2140450918, 2468478796, 2714456921,
        1841612155, 1109784552, 624286611, 1447511255, 1228350258, 1527345205, 3714046415, 4092922876, 1198916112,
        12128991, 3264791649, 3208514880, 1124736920, 3928887173, 1344579802, 2413496890, 3532080638, 1686813127,
        2487078932, 1565869739, 524579817, 3052054636, 2891285649, 2879352011, 414242923, 2068967890, 3305063188,
        3587652823, 2051727168, 3484922261, 3815846270, 354669530, 3124087110, 1782072194, 2662332394, 3249575354,
        3597569341, 23060413, 240146443, 1808696966, 379878591, 3784967217, 2497584836, 3408928511, 950692225, 79714104,
        2347027464, 1648879716, 3717351115, 415625099, 2005994740, 1405479809, 2908783413, 59256171, 3355173930,
        3359096570, 1197610659, 1371214096, 2383092848, 566509779, 3038838915, 3740809809, 3925664136, 2617952067,
        905851460, 3840671125, 428317521, 3592443066, 3647185433, 4288887289, 3953616670, 615357231, 3181117934,
        1425759426, 3220982614, 2855230127, 1766479530, 1831747076, 399901004, 2471552802, 1434151847, 713048723,
        2664984928, 3043680607, 509664879, 3994054441, 2973678934, 1831104371, 2963553975, 398645465, 1170633973,
        2066513965, 1767800480, 2941394611, 3241136355, 2099013101, 1051373356, 3833354424, 426282943, 3228685485,
        2799813886, 877602816, 240210304, 2376994639, 342614357, 563663912, 2652802316, 1771556905, 2083937099,
        242459137, 2070281244, 2861676750, 1020134729, 2767605623, 3938359631, 1612698910, 470837965, 3707723967,
        235572363, 3934289295, 4051894879, 3441732292, 1130045851, 7054525, 4081881041, 3569501906, 494314758,
        3237239856, 2076619446, 1294359427, 3690971949, 2407570540, 4256521508, 1340106474, 3912877480, 1475124286,
        2099064493, 2150561278, 57789153, 952419141, 3267030938, 2777511240, 3623834608, 4054287294, 1612064873,
        1164150479, 4126196921, 1405134740, 4198109577, 164694339, 3729502788, 1382505638, 4044019540, 2744990825,
        3623263068, 4057861211, 3644452428, 893660870, 1295902570, 4063185507, 517895066, 1965416591, 2566375314,
        1948935887, 111760835, 3570517967, 1229837838, 1988390740, 2747122092, 3682116057, 4263546827, 1762864090,
        941821904, 3245784560, 688817217, 875455051, 367013311, 4211322164, 2501498775, 2989092249, 4138450905,
        1073841104, 1005449975, 955675664, 2689038156, 2129106785, 1321533229, 1910491358, 3413203019, 3369330344,
        2029028742, 1567114464, 595455120, 2763396723, 3254604519, 2169086638, 1418403347, 2543857608, 360216876,
        1586571752, 4267226635, 1345489747, 3596094146, 2917053889, 3250338853, 3274413585, 2214620295, 3217121997,
        1052226051, 2803096381, 384227809, 2134306823, 959473399, 3708649339, 450656028, 4098400037, 3125010432,
        4106262851, 1827737097, 3301679135, 608047109, 2574062223, 2734379219, 2436649981, 2402311248, 2517925831,
        45858596, 733704928, 3827673421, 2127009772, 1319504248, 1194352979, 3438963586, 3977853443, 1313115839,
        3699589331, 1859221713, 2645044164, 406802489, 3824977819, 1160287725, 3704552835, 1141045134, 549694388,
        1402240026, 3496951646, 1224985388, 2625285437, 67982121, 2363782055, 2980556005, 285150198, 669899698,
        3272403603, 2815033033, 1581675539, 1904395666, 4118508324, 14682688, 173715006, 2621828775, 2193853779,
        1338164586, 1769742061, 2578351562, 854067585, 3792736954, 2891735270, 2024689165, 3588833568, 1865963216,
        2994521871, 1572863541, 2708559005, 2669281431, 1588384122, 3248715898, 2611223184, 1850761119, 1269326255,
        3434075773, 17673254, 3591726268, 517323323, 3301639561, 4088249037, 4257786079, 2535658874, 2751557390,
        2703727393, 2618676787, 1443127201, 1303832922, 3994038550, 3451539323, 2157076494, 2021780633, 1415260518,
        2280239530, 1992744402, 1117734927, 48835645, 3965160387, 1054673791, 2265469844, 3963024675, 1691937011,
        583910959, 2838059343, 3525835817, 2360183020, 1575842772, 1832268726, 3170442326, 2372199044, 413863110,
        1394826180, 1800168276, 895667341, 2423135369, 1245143932, 2840950358, 772335862, 3918808542, 1933875359,
        1563015244, 2541235746, 3381499405, 125782953, 3056508233, 2952473224, 4145951601, 2582705937, 3450197812,
        1292394123, 3736744772, 160350912, 2790999981, 3421194395, 956474027, 1509072849, 1500930882, 2148007820,
        1902513924, 2293102730, 509833682, 2227369781, 2329647471, 356593818, 4226078784, 2030390093, 549740954,
        1370550677, 1346393947, 1248144513, 2179322832, 1908178860, 1049390093, 367643608, 59385412, 2931004080,
        2937994435, 74506315, 1254003098, 3052302153, 823771163, 3904316064, 2846855350, 937311346, 2870708436,
        1157421959, 1328001992, 231395640, 3909870321, 4266352630, 2788053655, 3424810675, 1963437615, 3814397897,
        1673734669, 4151401028, 3379765673, 2367416980, 549499139, 4059671567, 1243931849, 2128031435, 4258607182,
        2548606395, 313731442, 200931093, 1873078793, 539686248, 3353752426, 2843138540, 1896111140, 2011416817,
        2051111181, 1892683641, 3109677612, 1854141795, 129157423, 2058977710, 4112087644, 679409340, 2321785425,
        3613600419, 2657210853, 782156775, 3265406727, 1247403317, 3015556217, 268382968, 2314427304, 3490829277,
        3942632221, 2896095652, 4248705335, 319431117, 1581168175, 3734377986, 739991954, 1452597840, 3505958581,
        2549115784, 4215439576, 3174646371, 2336959208, 2870812735, 1209575455, 4039032974, 1767176704, 336291401,
        996011350, 1372471048, 3702664001, 2010717589, 2566544503, 1966883851, 4263285829, 825244128, 988743153,
        350946420, 3978756747, 3744962799, 90256980, 978556061, 3692880960, 3442165002, 3251192638, 2292931454,
        100594764, 1754357691, 2940213637, 1822860290, 1822569888, 3692081352, 4126111909, 2548328615, 1559153086,
        2229736813, 3416000363, 1307522393, 2537287304, 1493158878, 3075976674, 3907402638, 433041229, 3014088443,
        3259785341, 1539470501, 1803261200, 518157909, 1135233158, 406515323, 3831259675, 2405854817, 1438184902,
      ]
    );
  });
  it('Should return the same sequence given same seeds', () => fc.assert(p.sameSeedSameSequences(congruential32)));
  it('Should return the same sequence if called twice', () => fc.assert(p.sameSequencesIfCallTwice(congruential32)));
  it('Should generate values between 0 and 2**32 -1', () => fc.assert(p.valuesInRange(congruential32)));
  it('Should impact itself with unsafeNext', () => fc.assert(p.changeSelfWithUnsafeNext(congruential32)));
  it('Should not impact itself with next', () => fc.assert(p.noChangeSelfWithNext(congruential32)));
  it('Should not impact clones when impacting itself on unsafeNext', () =>
    fc.assert(p.noChangeOnClonedWithUnsafeNext(congruential32)));
});
