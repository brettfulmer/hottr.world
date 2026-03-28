/**
 * DANCEFLOOR — 50 Language Master Data
 * Sorted by total speaker count (descending)
 * Source: docs/dancefloor-language-master.md
 */

export interface Language {
  id: string
  name: string
  city: string
  speakers: string
  speakerCount: number // for sorting
  countries: string[]
  lat: number
  lng: number
}

export const languages: Language[] = [
  { id:'en', name:'English', city:'Melbourne, Australia', speakers:'~1.5 billion', speakerCount:1500, countries:['United States of America','United Kingdom','Australia','Canada','New Zealand','Ireland','South Africa','Nigeria','India','Philippines','Singapore'], lat:-37.81, lng:144.96 },
  { id:'zh', name:'Mandarin', city:'Shanghai, China', speakers:'~920 million', speakerCount:920, countries:['China','Taiwan','Singapore','Malaysia'], lat:31.23, lng:121.47 },
  { id:'hi', name:'Hindi', city:'Mumbai, India', speakers:'~600 million', speakerCount:600, countries:['India','Nepal','Fiji','Trinidad and Tobago','Mauritius','Suriname'], lat:19.08, lng:72.88 },
  { id:'ar-eg', name:'Egyptian Arabic', city:'Cairo, Egypt', speakers:'~370 million', speakerCount:370, countries:['Egypt','Saudi Arabia','Iraq','Jordan','Lebanon','UAE','Kuwait'], lat:30.04, lng:31.24 },
  { id:'fr', name:'French', city:'Paris, France', speakers:'~280 million', speakerCount:280, countries:['France','Belgium','Switzerland','Canada','Senegal','Dem. Rep. Congo','Cameroon','Madagascar','Haiti'], lat:48.86, lng:2.35 },
  { id:'bn', name:'Bengali', city:'Dhaka, Bangladesh', speakers:'~270 million', speakerCount:270, countries:['Bangladesh','India'], lat:23.81, lng:90.41 },
  { id:'ru', name:'Russian', city:'Moscow, Russia', speakers:'~258 million', speakerCount:258, countries:['Russia','Belarus','Kazakhstan','Kyrgyzstan'], lat:55.76, lng:37.62 },
  { id:'ur', name:'Urdu', city:'Karachi, Pakistan', speakers:'~230 million', speakerCount:230, countries:['Pakistan','India'], lat:24.86, lng:67.01 },
  { id:'pt-br', name:'Brazilian Portuguese', city:'São Paulo, Brazil', speakers:'~215 million', speakerCount:215, countries:['Brazil'], lat:-23.55, lng:-46.63 },
  { id:'id', name:'Indonesian', city:'Bali, Indonesia', speakers:'~200 million', speakerCount:200, countries:['Indonesia'], lat:-8.34, lng:115.09 },
  { id:'de', name:'German', city:'Berlin, Germany', speakers:'~130 million', speakerCount:130, countries:['Germany','Austria','Switzerland','Liechtenstein','Luxembourg'], lat:52.52, lng:13.41 },
  { id:'es-mx', name:'Mexican Spanish', city:'Mexico City, Mexico', speakers:'~130 million', speakerCount:130, countries:['Mexico','United States of America'], lat:19.43, lng:-99.13 },
  { id:'ja', name:'Japanese', city:'Tokyo, Japan', speakers:'~125 million', speakerCount:125, countries:['Japan'], lat:35.68, lng:139.69 },
  { id:'pn', name:'Punjabi', city:'Chandigarh, India', speakers:'~125 million', speakerCount:125, countries:['India','Pakistan'], lat:30.73, lng:76.78 },
  { id:'fa', name:'Farsi', city:'Tehran, Iran', speakers:'~110 million', speakerCount:110, countries:['Iran','Afghanistan','Tajikistan'], lat:35.69, lng:51.39 },
  { id:'sw', name:'Swahili', city:'Nairobi, Kenya', speakers:'~100 million', speakerCount:100, countries:['Kenya','Tanzania','Uganda','Dem. Rep. Congo','Rwanda','Burundi'], lat:-1.29, lng:36.82 },
  { id:'ar-ma', name:'Maghrebi Arabic', city:'Casablanca, Morocco', speakers:'~80 million', speakerCount:80, countries:['Morocco','Algeria','Tunisia','Libya','Mauritania'], lat:33.57, lng:-7.59 },
  { id:'vi', name:'Vietnamese', city:'Ho Chi Minh City, Vietnam', speakers:'~85 million', speakerCount:85, countries:['Vietnam'], lat:10.82, lng:106.63 },
  { id:'yue', name:'Cantonese', city:'Hong Kong', speakers:'~85 million', speakerCount:85, countries:['China','Hong Kong','Macau','Malaysia'], lat:22.32, lng:114.17 },
  { id:'tr', name:'Turkish', city:'Istanbul, Turkey', speakers:'~83 million', speakerCount:83, countries:['Turkey'], lat:41.01, lng:28.98 },
  { id:'tl', name:'Tagalog', city:'Manila, Philippines', speakers:'~82 million', speakerCount:82, countries:['Philippines'], lat:14.60, lng:120.98 },
  { id:'ta', name:'Tamil', city:'Chennai, India', speakers:'~80 million', speakerCount:80, countries:['India','Sri Lanka','Singapore','Malaysia'], lat:13.08, lng:80.27 },
  { id:'ko', name:'Korean', city:'Seoul, South Korea', speakers:'~77 million', speakerCount:77, countries:['South Korea','North Korea'], lat:37.57, lng:126.98 },
  { id:'ha', name:'Hausa', city:'Kano, Nigeria', speakers:'~77 million', speakerCount:77, countries:['Nigeria','Niger','Ghana','Cameroon','Chad'], lat:12.00, lng:8.52 },
  { id:'pcm', name:'Nigerian Pidgin', city:'Lagos, Nigeria', speakers:'~75 million', speakerCount:75, countries:['Nigeria','Cameroon','Ghana'], lat:6.52, lng:3.38 },
  { id:'it', name:'Italian', city:'Milan, Italy', speakers:'~68 million', speakerCount:68, countries:['Italy','Switzerland','San Marino'], lat:45.46, lng:9.19 },
  { id:'th', name:'Thai', city:'Bangkok, Thailand', speakers:'~60 million', speakerCount:60, countries:['Thailand'], lat:13.76, lng:100.50 },
  { id:'am', name:'Amharic', city:'Addis Ababa, Ethiopia', speakers:'~57 million', speakerCount:57, countries:['Ethiopia'], lat:9.02, lng:38.75 },
  { id:'es-co', name:'Colombian Spanish', city:'Medellín, Colombia', speakers:'~50 million', speakerCount:50, countries:['Colombia'], lat:6.25, lng:-75.56 },
  { id:'yo', name:'Yoruba', city:'Lagos, Nigeria', speakers:'~50 million', speakerCount:50, countries:['Nigeria','Benin','Togo'], lat:6.52, lng:3.38 },
  { id:'es-es', name:'Madrid Spanish', city:'Madrid, Spain', speakers:'~47 million', speakerCount:47, countries:['Spain'], lat:40.42, lng:-3.70 },
  { id:'pl', name:'Polish', city:'Warsaw, Poland', speakers:'~45 million', speakerCount:45, countries:['Poland'], lat:52.23, lng:21.01 },
  { id:'es-ar', name:'Argentine Spanish', city:'Buenos Aires, Argentina', speakers:'~45 million', speakerCount:45, countries:['Argentina','Uruguay'], lat:-34.60, lng:-58.38 },
  { id:'my', name:'Burmese', city:'Yangon, Myanmar', speakers:'~43 million', speakerCount:43, countries:['Myanmar'], lat:16.87, lng:96.20 },
  { id:'uk', name:'Ukrainian', city:'Kyiv, Ukraine', speakers:'~40 million', speakerCount:40, countries:['Ukraine'], lat:50.45, lng:30.52 },
  { id:'ar-lv', name:'Levantine Arabic', city:'Beirut, Lebanon', speakers:'~35 million', speakerCount:35, countries:['Lebanon','Syria','Jordan','Palestine'], lat:33.89, lng:35.50 },
  { id:'ms', name:'Malay', city:'Kuala Lumpur, Malaysia', speakers:'~33 million', speakerCount:33, countries:['Malaysia','Brunei','Singapore'], lat:3.14, lng:101.69 },
  { id:'zu', name:'Zulu', city:'Durban, South Africa', speakers:'~27 million', speakerCount:27, countries:['South Africa','Eswatini','Lesotho'], lat:-29.86, lng:31.02 },
  { id:'ro', name:'Romanian', city:'Bucharest, Romania', speakers:'~26 million', speakerCount:26, countries:['Romania','Moldova'], lat:44.43, lng:26.10 },
  { id:'nl', name:'Dutch', city:'Amsterdam, Netherlands', speakers:'~25 million', speakerCount:25, countries:['Netherlands','Belgium','Suriname'], lat:52.37, lng:4.90 },
  { id:'es-cl', name:'Chilean Spanish', city:'Santiago, Chile', speakers:'~18 million', speakerCount:18, countries:['Chile'], lat:-33.45, lng:-70.67 },
  { id:'he', name:'Hebrew', city:'Tel Aviv, Israel', speakers:'~15 million', speakerCount:15, countries:['Israel'], lat:32.07, lng:34.77 },
  { id:'el', name:'Greek', city:'Athens, Greece', speakers:'~13 million', speakerCount:13, countries:['Greece','Cyprus'], lat:37.98, lng:23.73 },
  { id:'sv', name:'Swedish', city:'Stockholm, Sweden', speakers:'~13 million', speakerCount:13, countries:['Sweden','Finland'], lat:59.33, lng:18.07 },
  { id:'sr', name:'Serbian', city:'Belgrade, Serbia', speakers:'~12 million', speakerCount:12, countries:['Serbia','Bosnia and Herzegovina','Montenegro'], lat:44.79, lng:20.47 },
  { id:'ca', name:'Catalan', city:'Barcelona, Spain', speakers:'~10 million', speakerCount:10, countries:['Spain','Andorra'], lat:41.39, lng:2.17 },
  { id:'pt-eu', name:'European Portuguese', city:'Lisbon, Portugal', speakers:'~10 million', speakerCount:10, countries:['Portugal','Angola','Mozambique','Cape Verde','East Timor'], lat:38.72, lng:-9.14 },
  { id:'af', name:'Afrikaans', city:'Johannesburg, South Africa', speakers:'~7.2 million', speakerCount:7.2, countries:['South Africa','Namibia','Botswana'], lat:-26.20, lng:28.04 },
  { id:'ga', name:'Irish Gaelic', city:'Dublin, Ireland', speakers:'~1.7 million', speakerCount:1.7, countries:['Ireland'], lat:53.35, lng:-6.26 },
  { id:'kriol', name:'Kriol', city:'Northern Australia', speakers:'~20,000', speakerCount:0.02, countries:['Australia'], lat:-16.0, lng:145.0 },
]
