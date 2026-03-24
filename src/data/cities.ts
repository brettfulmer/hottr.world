export interface City {
  city: string
  country: string
  language: string
  lat: number
  lng: number
  regions: { lat: number; lng: number; radius: number }[]
}

export const cities: City[] = [
  { city: 'Melbourne', country: 'AUSTRALIA', language: 'English', lat: -37.8, lng: 144.9, regions: [{ lat: -25, lng: 135, radius: 15 }] },
  { city: 'Istanbul', country: 'TURKEY', language: 'Turkish', lat: 41.0, lng: 29.0, regions: [{ lat: 39, lng: 35, radius: 8 }] },
  { city: 'Tokyo', country: 'JAPAN', language: 'Japanese', lat: 35.7, lng: 139.7, regions: [{ lat: 36, lng: 138, radius: 6 }] },
  { city: 'Berlin', country: 'GERMANY', language: 'German', lat: 52.5, lng: 13.4, regions: [{ lat: 51, lng: 10, radius: 5 }, { lat: 47, lng: 14, radius: 4 }] },
  { city: 'Santiago', country: 'CHILE', language: 'Chilean Spanish', lat: -33.4, lng: -70.6, regions: [{ lat: -30, lng: -71, radius: 8 }] },
  { city: 'Medellín', country: 'COLOMBIA', language: 'Colombian Spanish', lat: 6.2, lng: -75.6, regions: [{ lat: 4, lng: -74, radius: 7 }] },
  { city: 'Mexico City', country: 'MEXICO', language: 'Mexican Spanish', lat: 19.4, lng: -99.1, regions: [{ lat: 24, lng: -102, radius: 10 }] },
  { city: 'São Paulo', country: 'BRAZIL', language: 'Brazilian Portuguese', lat: -23.5, lng: -46.6, regions: [{ lat: -10, lng: -52, radius: 18 }] },
  { city: 'Madrid', country: 'SPAIN', language: 'Madrid Spanish', lat: 40.4, lng: -3.7, regions: [{ lat: 40, lng: -4, radius: 5 }] },
  { city: 'Paris', country: 'FRANCE', language: 'French', lat: 48.9, lng: 2.3, regions: [{ lat: 47, lng: 2, radius: 5 }] },
  { city: 'Milan', country: 'ITALY', language: 'Italian', lat: 45.5, lng: 9.2, regions: [{ lat: 42, lng: 12, radius: 5 }] },
  { city: 'Amsterdam', country: 'NETHERLANDS', language: 'Dutch', lat: 52.4, lng: 4.9, regions: [{ lat: 52, lng: 5, radius: 3 }] },
  { city: 'Belfast', country: 'N. IRELAND', language: 'Belfast English', lat: 54.6, lng: -5.9, regions: [{ lat: 54, lng: -4, radius: 4 }] },
  { city: 'Stockholm', country: 'SWEDEN', language: 'Swedish', lat: 59.3, lng: 18.1, regions: [{ lat: 62, lng: 16, radius: 6 }] },
  { city: 'Warsaw', country: 'POLAND', language: 'Polish', lat: 52.2, lng: 21.0, regions: [{ lat: 52, lng: 20, radius: 5 }] },
  { city: 'Mykonos', country: 'GREECE', language: 'Greek', lat: 37.4, lng: 25.3, regions: [{ lat: 39, lng: 22, radius: 4 }] },
  { city: 'Cairo', country: 'EGYPT', language: 'Egyptian Arabic', lat: 30.0, lng: 31.2, regions: [{ lat: 27, lng: 30, radius: 8 }] },
  { city: 'Tel Aviv', country: 'ISRAEL', language: 'Hebrew', lat: 32.1, lng: 34.8, regions: [{ lat: 31, lng: 35, radius: 3 }] },
  { city: 'Johannesburg', country: 'S. AFRICA', language: 'Afrikaans', lat: -26.2, lng: 28.0, regions: [{ lat: -30, lng: 25, radius: 8 }] },
  { city: 'Mumbai', country: 'INDIA', language: 'Hindi', lat: 19.1, lng: 72.9, regions: [{ lat: 22, lng: 80, radius: 14 }] },
  { city: 'Bangkok', country: 'THAILAND', language: 'Thai', lat: 13.8, lng: 100.5, regions: [{ lat: 15, lng: 101, radius: 6 }] },
  { city: 'Seoul', country: 'S. KOREA', language: 'Korean', lat: 37.6, lng: 127.0, regions: [{ lat: 36, lng: 128, radius: 4 }] },
  { city: 'Shanghai', country: 'CHINA', language: 'Mandarin', lat: 31.2, lng: 121.5, regions: [{ lat: 35, lng: 105, radius: 20 }] },
  { city: 'Manila', country: 'PHILIPPINES', language: 'Tagalog', lat: 14.6, lng: 121.0, regions: [{ lat: 12, lng: 122, radius: 6 }] },
  { city: 'Bali', country: 'INDONESIA', language: 'Indonesian', lat: -8.3, lng: 115.1, regions: [{ lat: -2, lng: 118, radius: 14 }] },
]

// Simplified continent outlines for globe rendering [lng, lat][]
export const continents: [number, number][][] = [
  // Africa
  [[-17,15],[-12,24],[-5,35],[10,37],[12,33],[25,32],[32,32],[43,12],[51,11],[50,2],[42,-4],[40,-12],[35,-25],[28,-34],[18,-35],[15,-28],[12,-17],[9,-4],[8,5],[5,6],[-5,5],[-8,8],[-17,15]],
  // Europe
  [[-10,36],[-9,39],[0,43],[-2,47],[3,50],[-5,48],[-10,52],[-6,58],[5,62],[10,59],[12,55],[20,55],[25,60],[30,60],[40,62],[30,50],[28,45],[25,38],[20,36],[10,36],[5,43],[0,43]],
  // Asia
  [[30,32],[35,35],[40,40],[45,42],[50,40],[55,50],[60,55],[70,55],[75,65],[90,65],[105,60],[120,55],[130,48],[140,45],[140,35],[130,33],[122,25],[120,20],[110,15],[105,10],[100,2],[100,15],[95,10],[82,7],[77,8],[72,20],[60,25],[50,28],[44,12],[35,30],[30,32]],
  // North America
  [[-170,65],[-165,60],[-140,60],[-130,55],[-125,50],[-124,40],[-117,32],[-105,25],[-97,19],[-90,16],[-87,14],[-83,10],[-80,8],[-77,9],[-75,10],[-80,25],[-82,30],[-76,35],[-70,42],[-67,45],[-60,47],[-55,48],[-53,52],[-57,52],[-60,55],[-65,60],[-75,62],[-80,65],[-95,70],[-110,70],[-130,70],[-140,68],[-155,72],[-168,66],[-170,65]],
  // South America
  [[-80,10],[-77,8],[-75,10],[-70,6],[-60,5],[-52,3],[-50,0],[-35,-5],[-35,-10],[-38,-15],[-40,-22],[-48,-28],[-53,-33],[-57,-38],[-65,-55],[-68,-53],[-72,-45],[-75,-40],[-73,-25],[-70,-18],[-75,-15],[-80,-5],[-80,2],[-80,10]],
  // Australia
  [[115,-35],[118,-35],[125,-33],[130,-32],[136,-34],[140,-38],[148,-38],[151,-34],[153,-28],[150,-22],[146,-19],[145,-15],[142,-11],[136,-12],[130,-15],[125,-15],[117,-20],[114,-22],[113,-25],[115,-30],[115,-35]],
]
