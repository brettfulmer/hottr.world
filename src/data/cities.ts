export interface CityData {
  country: string
  city: string
  language: string
  lat: number
  lng: number
  slug: string
}

export const cities: CityData[] = [
  // Row 1 — Oceania + Americas
  { country: 'Oceania', city: 'Melbourne', language: 'English', lat: -37.81, lng: 144.96, slug: 'melbourne' },
  { country: 'Americas', city: 'Santiago', language: 'Chilean Spanish', lat: -33.45, lng: -70.67, slug: 'santiago' },
  { country: 'Americas', city: 'Medellín', language: 'Colombian Spanish', lat: 6.25, lng: -75.56, slug: 'medellin' },
  { country: 'Americas', city: 'Mexico City', language: 'Mexican Spanish', lat: 19.43, lng: -99.13, slug: 'mexico-city' },
  { country: 'Americas', city: 'São Paulo', language: 'Brazilian Portuguese', lat: -23.55, lng: -46.63, slug: 'sao-paulo' },
  // Row 2 — Europe West
  { country: 'Europe', city: 'Madrid', language: 'Madrid Spanish', lat: 40.42, lng: -3.70, slug: 'madrid' },
  { country: 'Europe', city: 'Paris', language: 'French', lat: 48.86, lng: 2.35, slug: 'paris' },
  { country: 'Europe', city: 'Milan', language: 'Italian', lat: 45.46, lng: 9.19, slug: 'milan' },
  { country: 'Europe', city: 'Amsterdam', language: 'Dutch', lat: 52.37, lng: 4.90, slug: 'amsterdam' },
  { country: 'Europe', city: 'Berlin', language: 'German', lat: 52.52, lng: 13.41, slug: 'berlin' },
  // Row 3 — Europe North/East
  { country: 'Europe', city: 'Belfast', language: 'Belfast English', lat: 54.60, lng: -5.93, slug: 'belfast' },
  { country: 'Europe', city: 'Stockholm', language: 'Swedish', lat: 59.33, lng: 18.07, slug: 'stockholm' },
  { country: 'Europe', city: 'Warsaw', language: 'Polish', lat: 52.23, lng: 21.01, slug: 'warsaw' },
  { country: 'Europe', city: 'Bucharest', language: 'Romanian', lat: 44.43, lng: 26.10, slug: 'bucharest' },
  { country: 'Europe', city: 'Istanbul', language: 'Turkish', lat: 41.01, lng: 28.98, slug: 'istanbul' },
  // Row 4 — Europe East + Middle East + Africa
  { country: 'Europe', city: 'Moscow', language: 'Russian', lat: 55.76, lng: 37.62, slug: 'moscow' },
  { country: 'Middle East', city: 'Cairo', language: 'Egyptian Arabic', lat: 30.04, lng: 31.24, slug: 'cairo' },
  { country: 'Middle East', city: 'Tel Aviv', language: 'Hebrew', lat: 32.07, lng: 34.77, slug: 'tel-aviv' },
  { country: 'Africa', city: 'Johannesburg', language: 'Afrikaans', lat: -26.20, lng: 28.04, slug: 'johannesburg' },
  { country: 'Africa', city: 'Nairobi', language: 'Swahili', lat: -1.29, lng: 36.82, slug: 'nairobi' },
  // Row 5 — South Asia + Southeast Asia
  { country: 'Asia', city: 'Mumbai', language: 'Hindi', lat: 19.08, lng: 72.88, slug: 'mumbai' },
  { country: 'Asia', city: 'Bangkok', language: 'Thai', lat: 13.76, lng: 100.50, slug: 'bangkok' },
  { country: 'Asia', city: 'Ho Chi Minh City', language: 'Vietnamese', lat: 10.82, lng: 106.63, slug: 'ho-chi-minh-city' },
  { country: 'Asia', city: 'Manila', language: 'Tagalog', lat: 14.60, lng: 120.98, slug: 'manila' },
  { country: 'Asia', city: 'Bali', language: 'Indonesian', lat: -8.34, lng: 115.09, slug: 'bali' },
  // Row 6 — East Asia + West Africa
  { country: 'Asia', city: 'Tokyo', language: 'Japanese', lat: 35.68, lng: 139.69, slug: 'tokyo' },
  { country: 'Asia', city: 'Seoul', language: 'Korean', lat: 37.57, lng: 126.98, slug: 'seoul' },
  { country: 'Asia', city: 'Shanghai', language: 'Mandarin', lat: 31.23, lng: 121.47, slug: 'shanghai' },
  { country: 'Europe', city: 'Mykonos', language: 'Greek', lat: 37.45, lng: 25.33, slug: 'mykonos' },
  { country: 'Africa', city: 'Lagos', language: 'Nigerian Pidgin', lat: 6.52, lng: 3.38, slug: 'lagos' },
]
