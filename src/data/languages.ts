export interface Language {
  id: number
  name: string
  label: string
  speakers: string
  officialIn: string
  countries: string[]
  culturalHubs: string[]
  dots: { top: string; left: string; primary?: boolean }[]
}

export const languages: Language[] = [
  {
    id: 1, name: 'English', label: 'English (Australian)',
    speakers: '~1.5 billion', officialIn: '60+ nations',
    countries: ['Australia', 'United Kingdom', 'United States', 'Canada', 'New Zealand', 'Ireland', 'South Africa', 'Nigeria', 'India', 'Philippines', 'Singapore', 'Jamaica', 'Ghana', 'Kenya', 'Uganda', 'Tanzania', 'Zimbabwe'],
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
    speakers: '~80 million', officialIn: '5 nations',
    countries: ['Turkey', 'Northern Cyprus', 'Germany', 'Netherlands', 'Austria', 'Bulgaria', 'Greece'],
    culturalHubs: ['ISTANBUL', 'ANKARA', 'IZMIR'],
    dots: [
      { top: '34%', left: '57%', primary: true },
      { top: '36%', left: '59%' },
    ],
  },
  {
    id: 3, name: 'Chilean Spanish', label: 'Chilean Spanish',
    speakers: '~550 million', officialIn: '20+ nations',
    countries: ['Chile', 'Spain', 'Mexico', 'Colombia', 'Argentina', 'Peru', 'Venezuela', 'Ecuador', 'Guatemala', 'Cuba', 'Bolivia', 'Dominican Republic', 'Honduras', 'Paraguay', 'El Salvador', 'Nicaragua', 'Costa Rica', 'Panama', 'Uruguay', 'Puerto Rico'],
    culturalHubs: ['SANTIAGO', 'VALPARAISO', 'CONCEPCION'],
    dots: [
      { top: '82%', left: '22%', primary: true },
      { top: '68%', left: '20%' },
    ],
  },
  {
    id: 4, name: 'Colombian Spanish', label: 'Colombian Spanish',
    speakers: '~550 million', officialIn: '20+ nations',
    countries: ['Colombia', 'Spain', 'Mexico', 'Chile', 'Argentina', 'Peru', 'Venezuela', 'Ecuador', 'Guatemala', 'Cuba', 'Bolivia'],
    culturalHubs: ['BOGOTA', 'MEDELLIN', 'CALI', 'CARTAGENA'],
    dots: [
      { top: '55%', left: '20%', primary: true },
      { top: '57%', left: '18%' },
    ],
  },
  {
    id: 5, name: 'Mexican Spanish', label: 'Mexican Spanish',
    speakers: '~550 million', officialIn: '20+ nations',
    countries: ['Mexico', 'United States', 'Spain', 'Colombia', 'Chile', 'Argentina', 'Peru', 'Venezuela'],
    culturalHubs: ['MEXICO CITY', 'GUADALAJARA', 'MONTERREY'],
    dots: [
      { top: '42%', left: '12%', primary: true },
      { top: '38%', left: '15%' },
    ],
  },
  {
    id: 6, name: 'Madrid Spanish', label: 'Madrid Spanish',
    speakers: '~550 million', officialIn: '20+ nations',
    countries: ['Spain', 'Mexico', 'Colombia', 'Chile', 'Argentina', 'Peru', 'Venezuela'],
    culturalHubs: ['MADRID', 'BARCELONA', 'SEVILLE', 'VALENCIA'],
    dots: [
      { top: '36%', left: '44%', primary: true },
      { top: '37%', left: '46%' },
    ],
  },
  {
    id: 7, name: 'Brazilian Portuguese', label: 'Brazilian Portuguese',
    speakers: '~260 million', officialIn: '11 nations',
    countries: ['Brazil', 'Portugal', 'Angola', 'Mozambique', 'Guinea-Bissau', 'East Timor', 'Cape Verde', 'Sao Tome and Principe'],
    culturalHubs: ['SAO PAULO', 'RIO DE JANEIRO', 'LISBON', 'LUANDA'],
    dots: [
      { top: '65%', left: '28%', primary: true },
      { top: '60%', left: '30%' },
      { top: '37%', left: '44%' },
    ],
  },
  {
    id: 8, name: 'German', label: 'German',
    speakers: '~130 million', officialIn: '8 nations',
    countries: ['Germany', 'Austria', 'Switzerland', 'Liechtenstein', 'Luxembourg', 'Belgium', 'South Tyrol'],
    culturalHubs: ['BERLIN', 'MUNICH', 'VIENNA', 'ZURICH'],
    dots: [
      { top: '30%', left: '49%', primary: true },
      { top: '31%', left: '50%' },
      { top: '32%', left: '48%' },
    ],
  },
  {
    id: 9, name: 'Egyptian Arabic', label: 'Egyptian Arabic',
    speakers: '~400 million', officialIn: '18+ nations',
    countries: ['Egypt', 'Saudi Arabia', 'UAE', 'Jordan', 'Lebanon', 'Syria', 'Iraq', 'Kuwait', 'Qatar', 'Bahrain', 'Oman', 'Yemen', 'Libya', 'Tunisia', 'Algeria', 'Morocco', 'Sudan', 'Palestine'],
    culturalHubs: ['CAIRO', 'ALEXANDRIA', 'RIYADH', 'DUBAI'],
    dots: [
      { top: '42%', left: '57%', primary: true },
      { top: '40%', left: '60%' },
      { top: '38%', left: '55%' },
    ],
  },
  {
    id: 10, name: 'Belfast English', label: 'Belfast English',
    speakers: '~1.5 billion', officialIn: '60+ nations',
    countries: ['Northern Ireland', 'Republic of Ireland', 'United Kingdom', 'United States', 'Canada', 'Australia'],
    culturalHubs: ['BELFAST', 'DUBLIN', 'LONDON'],
    dots: [
      { top: '28%', left: '44%', primary: true },
      { top: '29%', left: '43%' },
    ],
  },
  {
    id: 11, name: 'Thai', label: 'Thai',
    speakers: '~60 million', officialIn: '1 nation',
    countries: ['Thailand'],
    culturalHubs: ['BANGKOK', 'CHIANG MAI', 'PHUKET'],
    dots: [
      { top: '48%', left: '78%', primary: true },
    ],
  },
  {
    id: 12, name: 'French', label: 'French',
    speakers: '~320 million', officialIn: '29 nations',
    countries: ['France', 'Canada', 'Belgium', 'Switzerland', 'DR Congo', 'Ivory Coast', 'Madagascar', 'Cameroon', 'Burkina Faso', 'Niger', 'Senegal', 'Mali', 'Rwanda', 'Haiti', 'Burundi', 'Benin', 'Togo', 'Central African Republic', 'Republic of Congo', 'Gabon', 'Djibouti', 'Comoros', 'Seychelles', 'Vanuatu', 'Lebanon', 'Morocco', 'Tunisia', 'Algeria'],
    culturalHubs: ['PARIS', 'MONTREAL', 'DAKAR', 'BRUSSELS', 'GENEVA'],
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
    speakers: '~600 million', officialIn: '7 nations',
    countries: ['India', 'Fiji', 'Mauritius', 'Suriname', 'Trinidad and Tobago', 'Guyana', 'Nepal'],
    culturalHubs: ['MUMBAI', 'DELHI', 'KOLKATA', 'BANGALORE'],
    dots: [
      { top: '44%', left: '70%', primary: true },
      { top: '40%', left: '71%' },
      { top: '48%', left: '72%' },
    ],
  },
  {
    id: 14, name: 'Afrikaans', label: 'Afrikaans',
    speakers: '~16 million', officialIn: '3 nations',
    countries: ['South Africa', 'Namibia', 'Botswana'],
    culturalHubs: ['CAPE TOWN', 'JOHANNESBURG', 'PRETORIA'],
    dots: [
      { top: '78%', left: '53%', primary: true },
      { top: '76%', left: '55%' },
    ],
  },
  {
    id: 15, name: 'Indonesian', label: 'Indonesian',
    speakers: '~200 million', officialIn: '5+ nations',
    countries: ['Indonesia', 'East Timor', 'Malaysia', 'Brunei', 'Singapore'],
    culturalHubs: ['JAKARTA', 'BALI', 'SURABAYA'],
    dots: [
      { top: '60%', left: '82%', primary: true },
      { top: '58%', left: '80%' },
    ],
  },
  {
    id: 16, name: 'Italian', label: 'Italian',
    speakers: '~85 million', officialIn: '6 nations',
    countries: ['Italy', 'Switzerland', 'San Marino', 'Vatican City'],
    culturalHubs: ['ROME', 'MILAN', 'NAPLES', 'FLORENCE'],
    dots: [
      { top: '35%', left: '50%', primary: true },
      { top: '33%', left: '49%' },
    ],
  },
  {
    id: 17, name: 'Greek', label: 'Greek',
    speakers: '~13 million', officialIn: '3 nations',
    countries: ['Greece', 'Cyprus', 'Australia', 'United States'],
    culturalHubs: ['ATHENS', 'THESSALONIKI', 'NICOSIA'],
    dots: [
      { top: '36%', left: '53%', primary: true },
      { top: '37%', left: '57%' },
    ],
  },
  {
    id: 18, name: 'Japanese', label: 'Japanese',
    speakers: '~125 million', officialIn: '1 nation',
    countries: ['Japan'],
    culturalHubs: ['TOKYO', 'OSAKA', 'KYOTO'],
    dots: [
      { top: '36%', left: '90%', primary: true },
    ],
  },
  {
    id: 19, name: 'Korean', label: 'Korean',
    speakers: '~80 million', officialIn: '2 nations',
    countries: ['South Korea', 'North Korea', 'United States', 'China', 'Japan'],
    culturalHubs: ['SEOUL', 'BUSAN', 'INCHEON'],
    dots: [
      { top: '37%', left: '87%', primary: true },
    ],
  },
  {
    id: 20, name: 'Hebrew', label: 'Hebrew',
    speakers: '~9 million', officialIn: '1 nation',
    countries: ['Israel', 'United States', 'France', 'Canada', 'United Kingdom', 'Argentina', 'Australia'],
    culturalHubs: ['TEL AVIV', 'JERUSALEM', 'HAIFA'],
    dots: [
      { top: '38%', left: '58%', primary: true },
    ],
  },
  {
    id: 21, name: 'Mandarin', label: 'Mandarin',
    speakers: '~1.1 billion', officialIn: '4+ nations',
    countries: ['China', 'Taiwan', 'Singapore', 'Malaysia'],
    culturalHubs: ['BEIJING', 'SHANGHAI', 'TAIPEI', 'SHENZHEN'],
    dots: [
      { top: '38%', left: '82%', primary: true },
      { top: '42%', left: '85%' },
      { top: '44%', left: '83%' },
    ],
  },
  {
    id: 22, name: 'Dutch', label: 'Dutch',
    speakers: '~25 million', officialIn: '6 nations',
    countries: ['Netherlands', 'Belgium', 'Suriname', 'Aruba', 'Curacao', 'Sint Maarten'],
    culturalHubs: ['AMSTERDAM', 'ROTTERDAM', 'BRUSSELS'],
    dots: [
      { top: '30%', left: '47%', primary: true },
      { top: '31%', left: '48%' },
    ],
  },
  {
    id: 23, name: 'Polish', label: 'Polish',
    speakers: '~45 million', officialIn: '1 nation',
    countries: ['Poland', 'United Kingdom', 'Germany', 'United States', 'Ireland', 'France', 'Canada'],
    culturalHubs: ['WARSAW', 'KRAKOW', 'GDANSK'],
    dots: [
      { top: '30%', left: '52%', primary: true },
    ],
  },
  {
    id: 24, name: 'Swedish', label: 'Swedish',
    speakers: '~10 million', officialIn: '2 nations',
    countries: ['Sweden', 'Finland'],
    culturalHubs: ['STOCKHOLM', 'GOTHENBURG', 'MALMÖ'],
    dots: [
      { top: '24%', left: '50%', primary: true },
    ],
  },
  {
    id: 25, name: 'Tagalog', label: 'Tagalog',
    speakers: '~80 million', officialIn: '1 nation',
    countries: ['Philippines', 'United States', 'Saudi Arabia', 'UAE', 'Canada', 'Australia'],
    culturalHubs: ['MANILA', 'CEBU', 'DAVAO'],
    dots: [
      { top: '48%', left: '86%', primary: true },
    ],
  },
  {
    id: 26, name: 'Swahili', label: 'Swahili',
    speakers: '~100 million', officialIn: '10 nations',
    countries: ['Kenya', 'Tanzania', 'Uganda', 'DR Congo', 'Rwanda', 'Burundi', 'Mozambique', 'Malawi', 'Comoros', 'Somalia'],
    culturalHubs: ['NAIROBI', 'DAR ES SALAAM', 'MOMBASA'],
    dots: [
      { top: '58%', left: '60%', primary: true },
      { top: '62%', left: '58%' },
      { top: '56%', left: '62%' },
    ],
  },
  {
    id: 27, name: 'Russian', label: 'Russian',
    speakers: '~250 million', officialIn: '15+ nations',
    countries: ['Russia', 'Belarus', 'Kazakhstan', 'Kyrgyzstan', 'Ukraine', 'Moldova', 'Latvia', 'Estonia', 'Lithuania', 'Georgia'],
    culturalHubs: ['MOSCOW', 'ST PETERSBURG', 'NOVOSIBIRSK'],
    dots: [
      { top: '26%', left: '58%', primary: true },
      { top: '24%', left: '55%' },
      { top: '22%', left: '70%' },
    ],
  },
  {
    id: 28, name: 'Nigerian Pidgin', label: 'Nigerian Pidgin',
    speakers: '~75 million', officialIn: '4 nations',
    countries: ['Nigeria', 'Cameroon', 'Ghana', 'Equatorial Guinea'],
    culturalHubs: ['LAGOS', 'PORT HARCOURT', 'ABUJA'],
    dots: [
      { top: '52%', left: '48%', primary: true },
      { top: '50%', left: '50%' },
    ],
  },
  {
    id: 29, name: 'Vietnamese', label: 'Vietnamese',
    speakers: '~85 million', officialIn: '1 nation',
    countries: ['Vietnam', 'United States', 'Australia', 'France', 'Canada', 'Germany'],
    culturalHubs: ['HO CHI MINH CITY', 'HANOI', 'DA NANG'],
    dots: [
      { top: '46%', left: '80%', primary: true },
      { top: '42%', left: '79%' },
    ],
  },
  {
    id: 30, name: 'Romanian', label: 'Romanian',
    speakers: '~26 million', officialIn: '3 nations',
    countries: ['Romania', 'Moldova', 'Italy', 'Spain', 'Germany'],
    culturalHubs: ['BUCHAREST', 'CLUJ-NAPOCA', 'TIMISOARA'],
    dots: [
      { top: '32%', left: '54%', primary: true },
    ],
  },
]

// Group languages for bottom nav display
export const languageGroups = [
  'French', 'English', 'Chilean Spanish', 'Colombian Spanish', 'Mexican Spanish', 'Madrid Spanish',
  'Brazilian Portuguese', 'German', 'Egyptian Arabic', 'Belfast English', 'Turkish', 'Thai',
  'Hindi', 'Afrikaans', 'Indonesian', 'Italian', 'Greek', 'Japanese', 'Korean', 'Hebrew',
  'Mandarin', 'Dutch', 'Polish', 'Swedish', 'Tagalog', 'Swahili', 'Russian',
  'Nigerian Pidgin', 'Vietnamese', 'Romanian',
]
