export interface Language {
  id: string
  name: string
  speakers: string
  globalRank: string
  countries: string[]
  moreCountries: number
  note?: string
  lat: number
  lng: number
  isIndigenous?: boolean
}

export const languages: Language[] = [
  { id: 'af', name: 'Afrikaans', speakers: '~16 million', globalRank: '\u2014', countries: ['South Africa','Namibia'], note: 'Mutually intelligible with Dutch/Flemish', moreCountries: 0, lat: -26.20, lng: 28.04 },
  { id: 'bn', name: 'Bengali', speakers: '~270 million', globalRank: '7th most spoken', countries: ['Bangladesh','India (West Bengal)'], moreCountries: 3, lat: 23.81, lng: 90.41 },
  { id: 'pt-br', name: 'Brazilian Portuguese', speakers: '~260 million', globalRank: '6th most spoken', countries: ['Brazil','Portugal','Angola','Mozambique','Cape Verde','East Timor'], moreCountries: 5, lat: -23.55, lng: -46.63 },
  { id: 'es-cl', name: 'Chilean Spanish', speakers: '~550 million Spanish speakers', globalRank: '4th most spoken', countries: ['Chile'], moreCountries: 0, note: 'Understood across 20+ Spanish-speaking nations', lat: -33.45, lng: -70.67 },
  { id: 'es-co', name: 'Colombian Spanish', speakers: '~550 million Spanish speakers', globalRank: '4th most spoken', countries: ['Colombia'], moreCountries: 0, note: 'Understood across 20+ Spanish-speaking nations', lat: 6.25, lng: -75.56 },
  { id: 'nl', name: 'Dutch', speakers: '~25 million', globalRank: '\u2014', countries: ['Netherlands','Belgium','Suriname','Aruba','Cura\u00e7ao'], moreCountries: 0, lat: 52.37, lng: 4.90 },
  { id: 'ar-eg', name: 'Egyptian Arabic', speakers: '~400 million Arabic speakers', globalRank: '5th most spoken', countries: ['Egypt','Saudi Arabia','UAE','Jordan','Lebanon','Iraq','Kuwait'], moreCountries: 12, lat: 30.04, lng: 31.24 },
  { id: 'en-au', name: 'English', speakers: '~1.5 billion', globalRank: '1st most spoken', countries: ['Australia','United Kingdom','United States','Canada','New Zealand','Ireland','South Africa','Nigeria','India','Philippines','Singapore'], moreCountries: 50, lat: -37.81, lng: 144.96 },
  { id: 'fa', name: 'Farsi', speakers: '~110 million', globalRank: '\u2014', countries: ['Iran','Afghanistan','Tajikistan'], note: 'Major diaspora in USA, UK, Canada, Germany, UAE', moreCountries: 3, lat: 35.69, lng: 51.39 },
  { id: 'fr', name: 'French', speakers: '~320 million', globalRank: '5th most spoken', countries: ['France','Belgium','Switzerland','Canada','Haiti','Senegal','DR Congo','Cameroon','Madagascar'], moreCountries: 23, lat: 48.86, lng: 2.35 },
  { id: 'de', name: 'German', speakers: '~130 million', globalRank: '12th most spoken', countries: ['Germany','Austria','Switzerland','Liechtenstein','Luxembourg','Belgium'], moreCountries: 0, lat: 52.52, lng: 13.41 },
  { id: 'el', name: 'Greek', speakers: '~13 million', globalRank: '\u2014', countries: ['Greece','Cyprus'], moreCountries: 4, lat: 37.45, lng: 25.33 },
  { id: 'he', name: 'Hebrew', speakers: '~9 million', globalRank: '\u2014', countries: ['Israel'], moreCountries: 7, lat: 32.07, lng: 34.77 },
  { id: 'hi', name: 'Hindi', speakers: '~600 million', globalRank: '3rd most spoken', countries: ['India','Fiji','Mauritius','Suriname','Trinidad and Tobago'], moreCountries: 2, lat: 19.08, lng: 72.88 },
  { id: 'id', name: 'Indonesian', speakers: '~200 million', globalRank: '9th most spoken', countries: ['Indonesia'], note: 'Closely related to Malay in Malaysia, Brunei, Singapore', moreCountries: 3, lat: -8.34, lng: 115.09 },
  { id: 'ga', name: 'Irish Gaelic', speakers: '~1.7 million', globalRank: '\u2014', countries: ['Ireland','Northern Ireland','Irish diaspora in USA, UK, Canada, Australia'], moreCountries: 0, lat: 54.60, lng: -5.93 },
  { id: 'it', name: 'Italian', speakers: '~85 million', globalRank: '\u2014', countries: ['Italy','Switzerland','San Marino','Vatican City'], moreCountries: 8, lat: 45.46, lng: 9.19 },
  { id: 'ja', name: 'Japanese', speakers: '~125 million', globalRank: '13th most spoken', countries: ['Japan'], moreCountries: 0, lat: 35.68, lng: 139.69 },
  { id: 'ko', name: 'Korean', speakers: '~80 million', globalRank: '\u2014', countries: ['South Korea','North Korea'], moreCountries: 5, lat: 37.57, lng: 126.98 },
  { id: 'es-es', name: 'Madrid Spanish', speakers: '~550 million Spanish speakers', globalRank: '4th most spoken', countries: ['Spain'], moreCountries: 0, note: 'Understood across 20+ Spanish-speaking nations', lat: 40.42, lng: -3.70 },
  { id: 'zh', name: 'Mandarin', speakers: '~1.1 billion', globalRank: '2nd most spoken', countries: ['China','Taiwan','Singapore'], moreCountries: 3, lat: 31.23, lng: 121.47 },
  { id: 'es-mx', name: 'Mexican Spanish', speakers: '~550 million Spanish speakers', globalRank: '4th most spoken', countries: ['Mexico','United States (60M+ Spanish speakers)'], moreCountries: 0, note: 'Understood across 20+ Spanish-speaking nations', lat: 19.43, lng: -99.13 },
  { id: 'pcm', name: 'Nigerian Pidgin', speakers: '~75 million', globalRank: '\u2014', countries: ['Nigeria','Cameroon','Ghana'], moreCountries: 2, lat: 6.52, lng: 3.38 },
  { id: 'pl', name: 'Polish', speakers: '~45 million', globalRank: '25th most spoken', countries: ['Poland','United Kingdom','Germany','USA','Ireland','France','Canada'], moreCountries: 0, lat: 52.23, lng: 21.01 },
  { id: 'ro', name: 'Romanian', speakers: '~26 million', globalRank: '\u2014', countries: ['Romania','Moldova'], moreCountries: 6, lat: 44.43, lng: 26.10 },
  { id: 'ru', name: 'Russian', speakers: '~250 million', globalRank: '7th most spoken', countries: ['Russia','Belarus','Kazakhstan','Kyrgyzstan'], moreCountries: 11, lat: 55.76, lng: 37.62 },
  { id: 'sw', name: 'Swahili', speakers: '~100 million', globalRank: '\u2014', countries: ['Kenya','Tanzania','Uganda','DR Congo','Rwanda','Burundi'], moreCountries: 4, lat: -1.29, lng: 36.82 },
  { id: 'sv', name: 'Swedish', speakers: '~10 million', globalRank: '\u2014', countries: ['Sweden','Finland'], note: 'Mutually intelligible with Norwegian and Danish (~15M more)', moreCountries: 0, lat: 59.33, lng: 18.07 },
  { id: 'tl', name: 'Tagalog', speakers: '~80 million', globalRank: '\u2014', countries: ['Philippines','USA','Saudi Arabia','UAE','Canada','Australia'], moreCountries: 6, lat: 14.60, lng: 120.98 },
  { id: 'th', name: 'Thai', speakers: '~60 million', globalRank: '20th most spoken', countries: ['Thailand'], moreCountries: 0, lat: 13.76, lng: 100.50 },
  { id: 'tr', name: 'Turkish', speakers: '~80 million', globalRank: '17th most spoken', countries: ['Turkey','Northern Cyprus','Germany (diaspora)','Netherlands (diaspora)'], moreCountries: 0, lat: 41.01, lng: 28.98 },
  { id: 'ur', name: 'Urdu', speakers: '~230 million', globalRank: '10th most spoken', countries: ['Pakistan','India'], moreCountries: 4, lat: 24.86, lng: 67.01 },
  { id: 'vi', name: 'Vietnamese', speakers: '~85 million', globalRank: '\u2014', countries: ['Vietnam'], moreCountries: 8, lat: 10.82, lng: 106.63 },
  // Kriol: bonus — always last
  { id: 'kriol', name: 'Kriol', speakers: '~20,000', globalRank: '\u2014', countries: ['Australia (Northern Territory, Kimberley, Far North QLD)'], note: 'First Nations Australian creole language', moreCountries: 0, lat: -12.46, lng: 130.84, isIndigenous: true },
]
