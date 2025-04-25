const apollo12 = require("./landmark_images/Apollo-12.png");

export const landmarks = [
    // LANDING SITES (8 points)
    {
        "coordinates": { "latitude": 0.6875, "longitude": 23.4333 },
        "name": "Apollo 11",
        "type": "sites",
        "data": {
            "description": "The first human landing site on the Moon, located on the smooth plains of the Sea of Tranquility."
        }
    },
    {
        "coordinates": { "latitude": -69.37, "longitude": 32.32 },
        "name": "Chandrayaan-3",
        "type": "sites",
        "data": {
            "description": "Chandrayaan-3 successfully landed on August 23, 2023, in the lunar south polar region, making India the first nation to achieve a soft landing near the Moon's south pole."
        }
    },
    {
        "coordinates": { "latitude": -3.1975, "longitude": -23.3856 },
        "name": "Apollo 12",
        "image": "/img/landmark_images/Apollo-12.png",
        "type": "sites",
        "data": {
            "description": "The second human landing site, located near the Surveyor 3 probe and the Copernicus crater."
        }
    },
    {
        "coordinates": { "latitude": -3.6733, "longitude": -17.4653 },
        "name": "Apollo 14",
        "type": "sites",
        "data": {
            "description": "The third human landing site, located near the Fra Mauro crater, a highland region."
        }
    },
    {
        "coordinates": { "latitude": 26.1008, "longitude": 3.6527 },
        "name": "Apollo 15",
        "type": "sites",
        "data": {
            "description": "The fourth human landing site, located near the Hadley Rille, a deep valley."
        }
    },
    {
        "coordinates": { "latitude": -8.9913, "longitude": 15.5144 },
        "name": "Apollo 16",
        "type": "sites",
        "data": {
            "description": "The fifth human landing site, located in the Descartes Highlands, a rugged mountainous region."
        }
    },
    {
        "coordinates": { "latitude": 20.1653, "longitude": 30.7658 },
        "name": "Apollo 17",
        "type": "sites",
        "data": {
            "description": "The last human landing site, located in the Taurus-Littrow Valley, a region with diverse geological features."
        }
    },
    {
        "coordinates": { "latitude": 7.08, "longitude": -64.37 },
        "name": "Luna 9",
        "type": "sites",
        "data": {
            "description": "The first spacecraft to make a soft landing on the Moon, located in Oceanus Procellarum."
        }
    },
    {
        "coordinates": { "latitude": 44.1214, "longitude": -19.5116 },
        "name": "Chang'e 3",
        "type": "sites",
        "data": {
            "description": "The first Chinese lunar rover mission, located in Mare Imbrium."
        }
    },

    // LUNAR SEAS (9 points)
    {
        "coordinates": { "latitude": 28, "longitude": 17.5 },
        "name": "Mare Serenitatis",
        "type": "seas",
        "data": {
            "description": "The Sea of Serenity, a large, dark plain formed by ancient volcanic activity."
        }
    },
    {
        "coordinates": { "latitude": 32.8, "longitude": -15.6 },
        "name": "Mare Imbrium",
        "type": "seas",
        "data": {
            "description": "The Sea of Rains, the largest of the lunar maria, formed by a massive impact basin."
        }
    },
    {
        "coordinates": { "latitude": -21.3, "longitude": -16.6 },
        "name": "Mare Nubium",
        "type": "seas",
        "data": {
            "description": "The Sea of Clouds, a dark plain with numerous wrinkle ridges and craters."
        }
    },
    {
        "coordinates": { "latitude": 8.5, "longitude": 31.4 },
        "name": "Mare Tranquillitatis",
        "type": "seas",
        "data": {
            "description": "The Sea of Tranquility, site of the Apollo 11 landing, a smooth plain with few impact craters."
        }
    },
    {
        "coordinates": { "latitude": -10.5, "longitude": -22.3 },
        "name": "Mare Cognitum",
        "type": "seas",
        "data": {
            "description": "The Sea That Has Been Known, a dark plain with a complex geological history."
        }
    },
    {
        "coordinates": { "latitude": 13.3, "longitude": 3.6 },
        "name": "Mare Vaporum",
        "type": "seas",
        "data": {
            "description": "The Sea of Vapors, a smaller mare with a distinctive shape and numerous wrinkle ridges."
        }
    },
    {
        "coordinates": { "latitude": 7.5, "longitude": -30.9 },
        "name": "Mare Insularum",
        "type": "seas",
        "data": {
            "description": "The Sea of Islands, a mare with numerous isolated mountains and crater remnants."
        }
    },
    {
        "coordinates": { "latitude": 56, "longitude": 1.4 },
        "name": "Mare Frigoris",
        "type": "seas",
        "data": {
            "description": "The Sea of Cold, a narrow mare near the Moon's north pole, with a unique elongated shape."
        }
    },
    {
        "coordinates": { "latitude": -24.4, "longitude": -38.6 },
        "name": "Mare Humorum",
        "type": "seas",
        "data": {
            "description": "The Sea of Moisture, a circular mare with a distinct central peak ring."
        }
    },

    // SPECIAL FEATURES (8 points)
    {
        "coordinates": { "latitude": 45.01, "longitude": -31.67 },
        "name": "Sinus Iridum",
        "type": "treats",
        "data": {
            "description": "The Bay of Rainbows, a magnificent semicircular plain bordered by the Jura Mountains, creating dramatic shadows during lunar sunrise."
        }
    },
    {
        "coordinates": { "latitude": 45.13, "longitude": 27.32 },
        "name": "Lacus Mortis",
        "type": "treats",
        "data": {
            "description": "The Lake of Death, a small mare with unusual geological features."
        }
    },
    {
        "coordinates": { "latitude": 9.62, "longitude": -20.08 },
        "name": "Copernicus Crater",
        "type": "craters",
        "data": {
            "description": "A prominent impact crater with a bright ray system, visible from Earth."
        }
    },
    {
        "coordinates": { "latitude": -43.31, "longitude": -11.36 },
        "name": "Tycho Crater",
        "type": "craters",
        "data": {
            "description": "A young impact crater with a prominent ray system, visible from Earth."
        }
    },
    {
        "coordinates": { "latitude": -58.4, "longitude": -14.4 },
        "name": "Clavius Crater",
        "type": "craters",
        "data": {
            "description": "One of the largest craters on the Moon, with a complex geological history."
        }
    },
    {
        "coordinates": { "latitude": 18.9, "longitude": -3.7 },
        "name": "Montes Apenninus",
        "type": "treats",
        "data": {
            "description": "A prominent mountain range, part of the rim of the Mare Imbrium basin."
        }
    },
    {
        "coordinates": { "latitude": -22.1, "longitude": -7.8 },
        "name": "Rupes Recta",
        "type": "treats",
        "data": {
            "description": "Known as the 'Straight Wall,' this fault line runs nearly 110 km in a straight line, appearing as a steep cliff."
        }
    },
    {
        "coordinates": { "latitude": 19.52, "longitude": -2.90 },
        "name": "Mons Huygens",
        "type": "treats",
        "data": {
            "description": "The tallest mountain on the Moon, reaching about 5,500 meters in height, part of the Apennine range."
        }
    },
    {
        "coordinates": { "latitude": -44.45, "longitude": 176.2 },
        "name": "Von Kármán Crater",
        "type": "craters",
        "data": {
            "description": "Landing site of the Chinese Chang'e 4 mission, which was the first mission to explore the far side of the Moon in 2019."
        }
    },
    {
        "coordinates": { "latitude": -53, "longitude": -169 },
        "name": "South Pole-Aitken Basin",
        "type": "treats",
        "data": {
            "description": "The largest and oldest known impact basin on the Moon, providing critical insights into the lunar mantle."
        }
    },
    {
        "coordinates": { "latitude": -19.4, "longitude": -92.8 },
        "name": "Mare Orientale",
        "type": "seas",
        "data": {
            "description": "One of the most striking multi-ringed impact basins, with concentric rings visible in high-resolution imagery."
        }
    },
    {
        "coordinates": { "latitude": -20.38, "longitude": 128.97 },
        "name": "Tsiolkovsky Crater",
        "type": "craters",
        "data": {
            "description": "A prominent crater with a central peak and smooth lava floor, offering a stark contrast to the rugged highlands surrounding it."
        }
    },
    {
        "coordinates": { "latitude": 1.37, "longitude": -128.66 },
        "name": "Hertzsprung Crater",
        "type": "craters",
        "data": {
            "description": "A large and heavily eroded impact crater, surrounded by smaller craters and features from ancient impacts."
        }
    },
    {
        "coordinates": { "latitude": -75.0, "longitude": 132.4 },
        "name": "Schrödinger Basin",
        "type": "treats",
        "data": {
            "description": "A well-preserved peak-ring basin with a diverse geological history, featuring volcanic and tectonic features."
        }
    },
    {
        "coordinates": { "latitude": -4.14, "longitude": -157.22 },
        "name": "Korolev Crater",
        "type": "craters",
        "data": {
            "description": "An impressive far-side impact crater with a distinct central peak and numerous smaller impacts in the surrounding area."
        }
    },
    {
        "coordinates": { "latitude": 5.7, "longitude": 140.9 },
        "name": "Mendeleev Crater",
        "type": "craters",
        "data": {
            "description": "A large crater with a flat floor, hosting several small craters and wrinkle ridges indicative of past volcanic activity."
        }
    },
    {
        "coordinates": { "latitude": -38.3, "longitude": 179.2 },
        "name": "Leibnitz Crater",
        "type": "craters",
        "data": {
            "description": "An eroded crater with a complex history of impacts and surface changes, contributing to our understanding of the far side."
        }
    },
    {
        "coordinates": { "latitude": -1.6, "longitude": 102.7 },
        "name": "Saha Crater",
        "type": "craters",
        "data": {
            "description": "A deep impact crater on the lunar far side, featuring a sharp rim and steep walls, offering a glimpse into the Moon's history."
        }
    }
];
