export interface Language {
  id: number
  name: string
  label: string
  speakers: string
  globalRank: string
  regions: string[]
  culturalHubs: string[]
  dots: { top: string; left: string; primary?: boolean }[]
}

export const languages: Language[] = [
  {
    id: 1, name: 'English', label: 'English (Australian)',
    speakers: '~1.5 Billion', globalRank: '1st Most Spoken',
    regions: ['AUSTRALIA', 'UNITED KINGDOM', 'UNITED STATES', 'CANADA', 'NEW ZEALAND', 'IRELAND', 'SOUTH AFRICA', 'NIGERIA', 'INDIA'],
    culturalHubs: ['SYDNEY', 'LONDON', 'NEW YORK', 'TORONTO', 'MUMBAI'],
    dots: [
      { top: '78%', left: '85%', primary: true },
      { top: '32%', left: '48%' },
      { top: '36%', left: '18%' },
      { top: '50%', left: '70%' },
    ],
  },
  {
    id: 2, name: 'Turkish', label: 'Turkish',
    speakers: '~80 Million', globalRank: '18th Most Spoken',
    regions: ['TURKEY', 'NORTHERN CYPRUS', 'GERMANY', 'NETHERLANDS', 'AUSTRIA', 'BULGARIA', 'GREECE'],
    culturalHubs: ['ISTANBUL', 'ANKARA', 'IZMIR'],
    dots: [
      { top: '34%', left: '57%', primary: true },
      { top: '36%', left: '59%' },
    ],
  },
  {
    id: 3, name: 'Chilean Spanish', label: 'Chilean Spanish',
    speakers: '~550 Million', globalRank: '4th Most Spoken',
    regions: ['CHILE', 'SPAIN', 'MEXICO', 'COLOMBIA', 'ARGENTINA', 'PERU', 'VENEZUELA', 'ECUADOR', 'CUBA'],
    culturalHubs: ['SANTIAGO', 'VALPARAISO', 'CONCEPCION'],
    dots: [
      { top: '82%', left: '22%', primary: true },
      { top: '68%', left: '20%' },
    ],
  },
  {
    id: 4, name: 'Colombian Spanish', label: 'Colombian Spanish',
    speakers: '~550 Million', globalRank: '4th Most Spoken',
    regions: ['COLOMBIA', 'SPAIN', 'MEXICO', 'CHILE', 'ARGENTINA', 'PERU', 'VENEZUELA', 'ECUADOR', 'GUATEMALA'],
    culturalHubs: ['BOGOTA', 'MEDELLIN', 'CALI', 'CARTAGENA'],
    dots: [
      { top: '55%', left: '20%', primary: true },
      { top: '57%', left: '18%' },
    ],
  },
  {
    id: 5, name: 'Mexican Spanish', label: 'Mexican Spanish',
    speakers: '~550 Million', globalRank: '4th Most Spoken',
    regions: ['MEXICO', 'UNITED STATES', 'SPAIN', 'COLOMBIA', 'CHILE', 'ARGENTINA', 'PERU', 'VENEZUELA', 'CUBA'],
    culturalHubs: ['MEXICO CITY', 'GUADALAJARA', 'MONTERREY'],
    dots: [
      { top: '42%', left: '12%', primary: true },
      { top: '38%', left: '15%' },
    ],
  },
  {
    id: 6, name: 'Madrid Spanish', label: 'Madrid Spanish',
    speakers: '~550 Million', globalRank: '4th Most Spoken',
    regions: ['SPAIN', 'MEXICO', 'COLOMBIA', 'CHILE', 'ARGENTINA', 'PERU', 'VENEZUELA', 'ECUADOR', 'CUBA'],
    culturalHubs: ['MADRID', 'BARCELONA', 'SEVILLE', 'VALENCIA'],
    dots: [
      { top: '36%', left: '44%', primary: true },
      { top: '37%', left: '46%' },
    ],
  },
  {
    id: 7, name: 'Brazilian Portuguese', label: 'Brazilian Portuguese',
    speakers: '~260 Million', globalRank: '6th Most Spoken',
    regions: ['BRAZIL', 'PORTUGAL', 'ANGOLA', 'MOZAMBIQUE', 'GUINEA-BISSAU', 'EAST TIMOR', 'CAPE VERDE', 'SAO TOME', 'MACAU'],
    culturalHubs: ['SAO PAULO', 'RIO DE JANEIRO', 'LISBON', 'LUANDA'],
    dots: [
      { top: '65%', left: '28%', primary: true },
      { top: '60%', left: '30%' },
      { top: '37%', left: '44%' },
    ],
  },
  {
    id: 8, name: 'German', label: 'German',
    speakers: '~130 Million', globalRank: '11th Most Spoken',
    regions: ['GERMANY', 'AUSTRIA', 'SWITZERLAND', 'LIECHTENSTEIN', 'LUXEMBOURG', 'BELGIUM', 'SOUTH TYROL'],
    culturalHubs: ['BERLIN', 'MUNICH', 'VIENNA', 'ZURICH'],
    dots: [
      { top: '30%', left: '49%', primary: true },
      { top: '31%', left: '50%' },
      { top: '32%', left: '48%' },
    ],
  },
  {
    id: 9, name: 'Egyptian Arabic', label: 'Egyptian Arabic',
    speakers: '~400 Million', globalRank: '5th Most Spoken',
    regions: ['EGYPT', 'SAUDI ARABIA', 'UAE', 'JORDAN', 'LEBANON', 'IRAQ', 'KUWAIT', 'MOROCCO', 'SUDAN'],
    culturalHubs: ['CAIRO', 'ALEXANDRIA', 'RIYADH', 'DUBAI'],
    dots: [
      { top: '42%', left: '57%', primary: true },
      { top: '40%', left: '60%' },
      { top: '38%', left: '55%' },
    ],
  },
  {
    id: 10, name: 'Irish Gaelic', label: 'Irish Gaelic',
    speakers: '~1.7 Million', globalRank: '133rd Most Spoken',
    regions: ['IRELAND', 'NORTHERN IRELAND', 'UNITED STATES', 'UNITED KINGDOM', 'CANADA', 'AUSTRALIA'],
    culturalHubs: ['DUBLIN', 'GALWAY', 'BELFAST'],
    dots: [
      { top: '28%', left: '44%', primary: true },
      { top: '29%', left: '43%' },
    ],
  },
  {
    id: 11, name: 'Thai', label: 'Thai',
    speakers: '~60 Million', globalRank: '20th Most Spoken',
    regions: ['THAILAND'],
    culturalHubs: ['BANGKOK', 'CHIANG MAI', 'PHUKET'],
    dots: [
      { top: '48%', left: '78%', primary: true },
    ],
  },
  {
    id: 12, name: 'French', label: 'French',
    speakers: '~320 Million', globalRank: '5th Most Spoken',
    regions: ['FRANCE', 'CANADA (QC)', 'SENEGAL', 'BELGIUM', 'SWITZERLAND', 'CONGO', 'MOROCCO', 'VIETNAM', 'MADAGASCAR'],
    culturalHubs: ['PARIS', 'MONTREAL', 'DAKAR', 'BRUSSELS', 'GENEVA', 'CASABLANCA'],
    dots: [
      { top: '33%', left: '48%', primary: true },
      { top: '38%', left: '25%' },
      { top: '50%', left: '42%' },
      { top: '56%', left: '46%' },
      { top: '60%', left: '53%' },
    ],
  },
  {
    id: 13, name: 'Hindi', label: 'Hindi',
    speakers: '~600 Million', globalRank: '3rd Most Spoken',
    regions: ['INDIA', 'FIJI', 'MAURITIUS', 'SURINAME', 'TRINIDAD', 'GUYANA', 'NEPAL'],
    culturalHubs: ['MUMBAI', 'DELHI', 'KOLKATA', 'BANGALORE'],
    dots: [
      { top: '44%', left: '70%', primary: true },
      { top: '40%', left: '71%' },
      { top: '48%', left: '72%' },
    ],
  },
  {
    id: 14, name: 'Afrikaans', label: 'Afrikaans',
    speakers: '~16 Million', globalRank: '75th Most Spoken',
    regions: ['SOUTH AFRICA', 'NAMIBIA', 'BOTSWANA'],
    culturalHubs: ['CAPE TOWN', 'JOHANNESBURG', 'PRETORIA'],
    dots: [
      { top: '78%', left: '53%', primary: true },
      { top: '76%', left: '55%' },
    ],
  },
  {
    id: 15, name: 'Indonesian', label: 'Indonesian',
    speakers: '~200 Million', globalRank: '10th Most Spoken',
    regions: ['INDONESIA', 'EAST TIMOR', 'MALAYSIA', 'BRUNEI', 'SINGAPORE'],
    culturalHubs: ['JAKARTA', 'BALI', 'SURABAYA'],
    dots: [
      { top: '60%', left: '82%', primary: true },
      { top: '58%', left: '80%' },
    ],
  },
  {
    id: 16, name: 'Italian', label: 'Italian',
    speakers: '~85 Million', globalRank: '21st Most Spoken',
    regions: ['ITALY', 'SWITZERLAND', 'SAN MARINO', 'VATICAN CITY'],
    culturalHubs: ['ROME', 'MILAN', 'NAPLES', 'FLORENCE'],
    dots: [
      { top: '35%', left: '50%', primary: true },
      { top: '33%', left: '49%' },
    ],
  },
  {
    id: 17, name: 'Greek', label: 'Greek',
    speakers: '~13 Million', globalRank: '74th Most Spoken',
    regions: ['GREECE', 'CYPRUS', 'AUSTRALIA', 'UNITED STATES'],
    culturalHubs: ['ATHENS', 'THESSALONIKI', 'NICOSIA'],
    dots: [
      { top: '36%', left: '53%', primary: true },
      { top: '37%', left: '57%' },
    ],
  },
  {
    id: 18, name: 'Japanese', label: 'Japanese',
    speakers: '~125 Million', globalRank: '13th Most Spoken',
    regions: ['JAPAN'],
    culturalHubs: ['TOKYO', 'OSAKA', 'KYOTO'],
    dots: [
      { top: '36%', left: '90%', primary: true },
    ],
  },
  {
    id: 19, name: 'Korean', label: 'Korean',
    speakers: '~80 Million', globalRank: '17th Most Spoken',
    regions: ['SOUTH KOREA', 'NORTH KOREA', 'UNITED STATES', 'CHINA', 'JAPAN'],
    culturalHubs: ['SEOUL', 'BUSAN', 'INCHEON'],
    dots: [
      { top: '37%', left: '87%', primary: true },
    ],
  },
  {
    id: 20, name: 'Hebrew', label: 'Hebrew',
    speakers: '~9 Million', globalRank: '64th Most Spoken',
    regions: ['ISRAEL', 'UNITED STATES', 'FRANCE', 'CANADA', 'UNITED KINGDOM', 'ARGENTINA', 'AUSTRALIA'],
    culturalHubs: ['TEL AVIV', 'JERUSALEM', 'HAIFA'],
    dots: [
      { top: '38%', left: '58%', primary: true },
    ],
  },
  {
    id: 21, name: 'Mandarin', label: 'Mandarin',
    speakers: '~1.1 Billion', globalRank: '2nd Most Spoken',
    regions: ['CHINA', 'TAIWAN', 'SINGAPORE', 'MALAYSIA'],
    culturalHubs: ['BEIJING', 'SHANGHAI', 'TAIPEI', 'SHENZHEN'],
    dots: [
      { top: '38%', left: '82%', primary: true },
      { top: '42%', left: '85%' },
      { top: '44%', left: '83%' },
    ],
  },
  {
    id: 22, name: 'Dutch', label: 'Dutch',
    speakers: '~25 Million', globalRank: '56th Most Spoken',
    regions: ['NETHERLANDS', 'BELGIUM', 'SURINAME', 'ARUBA', 'CURACAO', 'SINT MAARTEN'],
    culturalHubs: ['AMSTERDAM', 'ROTTERDAM', 'BRUSSELS'],
    dots: [
      { top: '30%', left: '47%', primary: true },
      { top: '31%', left: '48%' },
    ],
  },
  {
    id: 23, name: 'Polish', label: 'Polish',
    speakers: '~45 Million', globalRank: '25th Most Spoken',
    regions: ['POLAND', 'UNITED KINGDOM', 'GERMANY', 'UNITED STATES', 'IRELAND', 'FRANCE', 'CANADA'],
    culturalHubs: ['WARSAW', 'KRAKOW', 'GDANSK'],
    dots: [
      { top: '30%', left: '52%', primary: true },
    ],
  },
  {
    id: 24, name: 'Swedish', label: 'Swedish',
    speakers: '~10 Million', globalRank: '89th Most Spoken',
    regions: ['SWEDEN', 'FINLAND'],
    culturalHubs: ['STOCKHOLM', 'GOTHENBURG', 'MALMÖ'],
    dots: [
      { top: '24%', left: '50%', primary: true },
    ],
  },
  {
    id: 25, name: 'Tagalog', label: 'Tagalog',
    speakers: '~80 Million', globalRank: '19th Most Spoken',
    regions: ['PHILIPPINES', 'UNITED STATES', 'SAUDI ARABIA', 'UAE', 'CANADA', 'AUSTRALIA'],
    culturalHubs: ['MANILA', 'CEBU', 'DAVAO'],
    dots: [
      { top: '48%', left: '86%', primary: true },
    ],
  },
  {
    id: 26, name: 'Swahili', label: 'Swahili',
    speakers: '~100 Million', globalRank: '15th Most Spoken',
    regions: ['KENYA', 'TANZANIA', 'UGANDA', 'DR CONGO', 'RWANDA', 'BURUNDI', 'MOZAMBIQUE', 'MALAWI', 'SOMALIA'],
    culturalHubs: ['NAIROBI', 'DAR ES SALAAM', 'MOMBASA'],
    dots: [
      { top: '58%', left: '60%', primary: true },
      { top: '62%', left: '58%' },
      { top: '56%', left: '62%' },
    ],
  },
  {
    id: 27, name: 'Russian', label: 'Russian',
    speakers: '~250 Million', globalRank: '7th Most Spoken',
    regions: ['RUSSIA', 'BELARUS', 'KAZAKHSTAN', 'KYRGYZSTAN', 'UKRAINE', 'MOLDOVA', 'LATVIA', 'ESTONIA', 'GEORGIA'],
    culturalHubs: ['MOSCOW', 'ST PETERSBURG', 'NOVOSIBIRSK'],
    dots: [
      { top: '26%', left: '58%', primary: true },
      { top: '24%', left: '55%' },
      { top: '22%', left: '70%' },
    ],
  },
  {
    id: 28, name: 'Nigerian Pidgin', label: 'Nigerian Pidgin',
    speakers: '~75 Million', globalRank: '22nd Most Spoken',
    regions: ['NIGERIA', 'CAMEROON', 'GHANA', 'EQUATORIAL GUINEA'],
    culturalHubs: ['LAGOS', 'PORT HARCOURT', 'ABUJA'],
    dots: [
      { top: '52%', left: '48%', primary: true },
      { top: '50%', left: '50%' },
    ],
  },
  {
    id: 29, name: 'Vietnamese', label: 'Vietnamese',
    speakers: '~85 Million', globalRank: '16th Most Spoken',
    regions: ['VIETNAM', 'UNITED STATES', 'AUSTRALIA', 'FRANCE', 'CANADA', 'GERMANY'],
    culturalHubs: ['HO CHI MINH CITY', 'HANOI', 'DA NANG'],
    dots: [
      { top: '46%', left: '80%', primary: true },
      { top: '42%', left: '79%' },
    ],
  },
  {
    id: 30, name: 'Romanian', label: 'Romanian',
    speakers: '~26 Million', globalRank: '36th Most Spoken',
    regions: ['ROMANIA', 'MOLDOVA', 'ITALY', 'SPAIN', 'GERMANY'],
    culturalHubs: ['BUCHAREST', 'CLUJ-NAPOCA', 'TIMISOARA'],
    dots: [
      { top: '32%', left: '54%', primary: true },
    ],
  },
]
