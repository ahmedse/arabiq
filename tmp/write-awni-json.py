import json

data = {
  "demo": {
    "title": "Awni Electronics",
    "title_ar": "مؤسسة عوني للأجهزة الكهربائية",
    "slug": "awni-electronics",
    "summary": "Browse our home appliances showroom in immersive 3D. Refrigerators, washing machines, ovens, TVs and more from trusted brands.",
    "summary_ar": "تصفح معرض الأجهزة المنزلية في بيئة ثلاثية الأبعاد. ثلاجات، غسالات، أفران، تلفزيونات والمزيد من العلامات التجارية الموثوقة.",
    "matterportModelId": "6WxfcPSW7KM",
    "demoType": "ecommerce",
    "isActive": True,
    "businessName": "Awni Electronics",
    "businessName_ar": "مؤسسة عوني للأجهزة الكهربائية",
    "businessPhone": "+201001234567",
    "businessEmail": "info@awni-electronics.com",
    "businessWhatsapp": "201001234567",
    "enableVoiceOver": False,
    "enableLiveChat": True,
    "enableAiChat": True
  },
  "products": [
    {
      "name": "Tornado Refrigerator 450L No Frost",
      "name_ar": "ثلاجة تورنيدو 450 لتر نوفروست",
      "description": "Tornado 450 liter No Frost refrigerator with digital display. Energy efficient inverter compressor, multi-airflow cooling system, and antibacterial door seal. Silver finish.",
      "description_ar": "ثلاجة تورنيدو 450 لتر نوفروست مع شاشة ديجيتال. ضاغط انفرتر موفر للطاقة، نظام تبريد متعدد التدفق، وعازل باب مضاد للبكتيريا. لون فضي.",
      "price": 28500, "currency": "EGP",
      "category": "Refrigerators", "category_ar": "ثلاجات",
      "brand": "Tornado", "sku": "TRN-REF-450NF", "inStock": True,
      "hotspotPosition": {"x": -14.801, "y": 3.252, "z": -4.811, "stemVector": {"x": 0.2975, "y": 0.1115, "z": -0.0369}, "nearestSweepId": "sbf3p26gpqzy68z1w3d905tzd", "floorIndex": 1}
    },
    {
      "name": "Sharp Microwave 25L with Grill",
      "name_ar": "ميكروويف شارب 25 لتر مع شواية",
      "description": "Sharp 25 liter microwave oven with grill function. 900W power, 6 auto-cook menus, defrost by weight, child safety lock. Stainless steel interior.",
      "description_ar": "ميكروويف شارب 25 لتر مع وظيفة الشواية. قدرة 900 واط، 6 قوائم طهي تلقائية، إذابة حسب الوزن، قفل أمان للأطفال. داخلية ستانلس ستيل.",
      "price": 4200, "currency": "EGP",
      "category": "Microwaves", "category_ar": "ميكروويف",
      "brand": "Sharp", "sku": "SHP-MW-25G", "inStock": True,
      "hotspotPosition": {"x": -17.128, "y": 0.156, "z": 0.352, "stemVector": {"x": -0.1418, "y": 0.2201, "z": 0.2355}, "nearestSweepId": "cnbqqcuas2045e4274gseut5d", "floorIndex": 0}
    },
    {
      "name": "LG Automatic Washing Machine 8KG",
      "name_ar": "غسالة إل جي أوتوماتيك 8 كيلو",
      "description": "LG 8KG front load washing machine with Steam technology. AI DD motor detects fabric type, TurboWash 360 for faster cleaning, SmartThinQ app control.",
      "description_ar": "غسالة إل جي 8 كيلو تحميل أمامي مع تقنية البخار. محرك AI DD يكتشف نوع القماش، TurboWash 360 لتنظيف أسرع، تحكم عبر تطبيق SmartThinQ.",
      "price": 22000, "currency": "EGP",
      "category": "Washing Machines", "category_ar": "غسالات",
      "brand": "LG", "sku": "LG-WM-8KG-ST", "inStock": True,
      "hotspotPosition": {"x": -22.693, "y": 0.879, "z": -6.238, "stemVector": {"x": -0.0093, "y": 0.3968, "z": 0.0425}, "nearestSweepId": "bs59m91uyb3gn67x24nqe2fqa", "floorIndex": 0}
    },
    {
      "name": "Toshiba Gas Oven 60cm with Fan",
      "name_ar": "فرن غاز توشيبا 60 سم مع مروحة",
      "description": "Toshiba 60cm gas oven with electric fan for even heat distribution. 4 burner cooktop with safety valves, double glass door, rotisserie function.",
      "description_ar": "فرن غاز توشيبا 60 سم مع مروحة كهربائية لتوزيع الحرارة بالتساوي. 4 شعلات مع صمامات أمان، باب زجاج مزدوج، وظيفة الشواء الدوار.",
      "price": 12500, "currency": "EGP",
      "category": "Ovens", "category_ar": "أفران",
      "brand": "Toshiba", "sku": "TSB-OVEN-60F", "inStock": True,
      "hotspotPosition": {"x": -10.867, "y": 3.123, "z": 2.084, "stemVector": {"x": 0.0141, "y": 0.1, "z": -0.2997}, "nearestSweepId": "6q5mwsz07dnhcq97xg8bssryd", "floorIndex": 1}
    },
    {
      "name": "Fresh Electric Water Heater 50L",
      "name_ar": "سخان مياه فريش كهربائي 50 لتر",
      "description": "Fresh 50 liter electric water heater with digital thermostat. Enamel coated tank, magnesium anode protection, thermal cut-off safety. 5 year warranty.",
      "description_ar": "سخان مياه فريش 50 لتر كهربائي مع ترموستات ديجيتال. خزان مطلي بالمينا، حماية أنود ماغنسيوم، قاطع حراري للأمان. ضمان 5 سنوات.",
      "price": 5800, "currency": "EGP",
      "category": "Water Heaters", "category_ar": "سخانات",
      "brand": "Fresh", "sku": "FRS-WH-50L", "inStock": True,
      "hotspotPosition": {"x": -14.384, "y": 0.607, "z": 0.863, "stemVector": {"x": -0.2208, "y": 0.1, "z": 0.2027}, "nearestSweepId": "gcdwxbgaydqz8fe8g2rwk6bua", "floorIndex": 0}
    },
    {
      "name": "Samsung 55\" 4K Smart TV Crystal UHD",
      "name_ar": "تلفزيون سامسونج 55 بوصة 4K سمارت كريستال UHD",
      "description": "Samsung 55 inch Crystal UHD 4K Smart TV with Crystal Processor 4K, HDR10+, PurColor technology. Built-in WiFi, multiple HDMI ports, and Tizen OS with streaming apps pre-installed.",
      "description_ar": "تلفزيون سامسونج 55 بوصة كريستال UHD 4K سمارت مع معالج كريستال 4K، HDR10+، تقنية PurColor. واي فاي مدمج، منافذ HDMI متعددة، ونظام Tizen مع تطبيقات البث المثبتة مسبقاً.",
      "price": 18500, "currency": "EGP",
      "category": "TVs", "category_ar": "تلفزيونات",
      "brand": "Samsung", "sku": "SAM-TV-55CU", "inStock": True,
      "hotspotPosition": {"x": -8.472, "y": 2.955, "z": 0.008, "stemVector": {"x": 0.0142, "y": 0.1184, "z": 0.2991}, "nearestSweepId": "p9cuqxqszfkyss62t97xi3y3c", "floorIndex": 1}
    },
    {
      "name": "Midea Split Air Conditioner 1.5HP Cool/Heat",
      "name_ar": "تكييف ميديا سبليت 1.5 حصان بارد/ساخن",
      "description": "Midea 1.5 HP inverter split air conditioner with cooling and heating. Energy class A++, R32 eco-friendly refrigerant, turbo mode, self-cleaning function, WiFi control via app.",
      "description_ar": "تكييف ميديا 1.5 حصان انفرتر سبليت بارد وساخن. فئة طاقة A++، غاز R32 صديق للبيئة، وضع تيربو، خاصية التنظيف الذاتي، تحكم واي فاي عبر التطبيق.",
      "price": 26000, "currency": "EGP",
      "category": "Air Conditioners", "category_ar": "تكييفات",
      "brand": "Midea", "sku": "MDA-AC-15INV", "inStock": True,
      "hotspotPosition": {"x": -23.572, "y": 0.674, "z": 5.327, "stemVector": {"x": 0.0006, "y": 0.1, "z": -0.2982}, "nearestSweepId": "knnb69r5cnrn6dr2taesuya9c", "floorIndex": 0}
    },
    {
      "name": "Bosch Dishwasher 14 Place Settings",
      "name_ar": "غسالة أطباق بوش 14 فرد",
      "description": "Bosch freestanding dishwasher with 14 place settings. 6 wash programs including eco mode, AquaStop leak protection, VarioSpeed for faster cycles, stainless steel finish.",
      "description_ar": "غسالة أطباق بوش قائمة بذاتها 14 فرد. 6 برامج غسيل بما في ذلك الوضع الاقتصادي، حماية AquaStop من التسريب، VarioSpeed لدورات أسرع، لون ستانلس ستيل.",
      "price": 19500, "currency": "EGP",
      "category": "Dishwashers", "category_ar": "غسالات أطباق",
      "brand": "Bosch", "sku": "BSH-DW-14PS", "inStock": True,
      "hotspotPosition": {"x": -19.386, "y": 0.373, "z": -5.98, "stemVector": {"x": -0.2995, "y": 0.1, "z": 0.0055}, "nearestSweepId": "k7u100qhcsr5wzra0ragzd3zb", "floorIndex": 0}
    },
    {
      "name": "Zanussi Chest Freezer 300L",
      "name_ar": "فريزر زانوسي أفقي 300 لتر",
      "description": "Zanussi 300 liter chest freezer with fast freeze function. Low noise operation, adjustable thermostat, interior light, lock and key security. White finish with basket included.",
      "description_ar": "فريزر زانوسي أفقي 300 لتر مع وظيفة التجميد السريع. تشغيل منخفض الضوضاء، ترموستات قابل للتعديل، إضاءة داخلية، قفل ومفتاح للأمان. لون أبيض مع سلة مرفقة.",
      "price": 14200, "currency": "EGP",
      "category": "Freezers", "category_ar": "فريزرات",
      "brand": "Zanussi", "sku": "ZNS-FZ-300CH", "inStock": True,
      "hotspotPosition": {"x": -9.305, "y": 2.535, "z": -7.517, "stemVector": {"x": 0.0072, "y": 0.3147, "z": 0.2094}, "nearestSweepId": "144uyyhgqba5wfnic2r50rw8d", "floorIndex": 1}
    },
    {
      "name": "Philips Blender 2L 700W with Grinder",
      "name_ar": "خلاط فيليبس 2 لتر 700 واط مع مطحنة",
      "description": "Philips 2 liter countertop blender with 700W motor. 5 speed settings with pulse, ProBlend crushing technology, includes dry mill for spices and coffee. Dishwasher safe jar.",
      "description_ar": "خلاط فيليبس 2 لتر بمحرك 700 واط. 5 سرعات مع نبض، تقنية ProBlend للطحن، يشمل مطحنة جافة للتوابل والقهوة. إبريق آمن للغسيل في غسالة الأطباق.",
      "price": 2800, "currency": "EGP",
      "category": "Small Appliances", "category_ar": "أجهزة صغيرة",
      "brand": "Philips", "sku": "PHL-BL-2L700", "inStock": False,
      "hotspotPosition": {"x": -11.642, "y": 2.447, "z": -3.353, "stemVector": {"x": 0.0011, "y": 0.4, "z": 0.003}, "nearestSweepId": "af09in3u06hza8zmg8dnid3ud", "floorIndex": 1}
    }
  ]
}

with open("/home/ahmed/arabiq/seed/awni-electronics.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write("\n")

print("Done - wrote awni-electronics.json")
