import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { cities, type CityData } from '../data/cities'

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

interface TooltipInfo {
  city: string
  language: string
  slug: string
  x: number
  y: number
  containerWidth: number
}

export default function Globe() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null)
  const isDragging = useRef(false)
  const previousMouse = useRef({ x: 0, y: 0 })
  const rotationSpeed = useRef({ x: 0, y: 0 })
  const autoRotate = useRef(true)
  const resumeTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)
  const sceneRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    globe: THREE.Group
    dots: THREE.Mesh[]
    cityData: CityData[]
  } | null>(null)

  const handleInteraction = useCallback((clientX: number, clientY: number, isClick: boolean) => {
    if (!sceneRef.current || !containerRef.current) return

    const { camera, dots, cityData } = sceneRef.current
    const rect = containerRef.current.getBoundingClientRect()
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    )

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(dots)

    if (intersects.length > 0) {
      const idx = dots.indexOf(intersects[0].object as THREE.Mesh)
      if (idx !== -1) {
        const city = cityData[idx]
        if (isClick) {
          const listenSection = document.querySelector('[data-section="4"]')
          if (listenSection) listenSection.scrollIntoView({ behavior: 'smooth' })
        } else {
          setTooltip({
            city: city.city,
            language: city.language,
            slug: city.slug,
            x: clientX - rect.left,
            y: clientY - rect.top,
            containerWidth: rect.width,
          })
        }
      }
    } else if (!isClick) {
      setTooltip(null)
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight

    // Scene
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.z = 3.2

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const globe = new THREE.Group()
    scene.add(globe)

    // Globe sphere - dark surface with pink wireframe
    const sphereGeo = new THREE.SphereGeometry(1, 48, 48)
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x0a0a0f,
      transparent: true,
      opacity: 0.9,
    })
    const sphere = new THREE.Mesh(sphereGeo, sphereMat)
    globe.add(sphere)

    // Wireframe overlay for landmass feel
    const wireGeo = new THREE.SphereGeometry(1.002, 32, 32)
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xFF0CB6,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    })
    const wireframe = new THREE.Mesh(wireGeo, wireMat)
    globe.add(wireframe)

    // Outer glow ring
    const ringGeo = new THREE.RingGeometry(1.05, 1.08, 64)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xFF0CB6,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    globe.add(ring)

    // City dots
    const dotGeo = new THREE.SphereGeometry(0.02, 8, 8)
    const dots: THREE.Mesh[] = []
    const dotMaterials: THREE.MeshBasicMaterial[] = []

    cities.forEach((city) => {
      const pos = latLngToVector3(city.lat, city.lng, 1.01)
      const dotMat = new THREE.MeshBasicMaterial({
        color: 0xFF0CB6,
        transparent: true,
        opacity: 0.9,
      })
      const dot = new THREE.Mesh(dotGeo, dotMat)
      dot.position.copy(pos)
      globe.add(dot)
      dots.push(dot)
      dotMaterials.push(dotMat)
    })

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
    scene.add(ambientLight)

    sceneRef.current = { scene, camera, renderer, globe, dots, cityData: cities }

    // Animation
    let animationId: number
    const clock = new THREE.Clock()

    const animate = () => {
      animationId = requestAnimationFrame(animate)
      const elapsed = clock.getElapsedTime()

      if (autoRotate.current) {
        globe.rotation.y += 0.001 // ~60s per rotation
      }

      // Apply drag momentum
      if (!isDragging.current && (Math.abs(rotationSpeed.current.x) > 0.0001 || Math.abs(rotationSpeed.current.y) > 0.0001)) {
        globe.rotation.y += rotationSpeed.current.x
        globe.rotation.x += rotationSpeed.current.y
        rotationSpeed.current.x *= 0.95
        rotationSpeed.current.y *= 0.95
      }

      // Pulse dots
      dots.forEach((dot, i) => {
        const mat = dotMaterials[i]
        mat.opacity = 0.6 + 0.4 * Math.sin(elapsed * 2 + i * 0.5)
        const scale = 1 + 0.3 * Math.sin(elapsed * 2 + i * 0.5)
        dot.scale.setScalar(scale)
      })

      renderer.render(scene, camera)
    }

    animate()

    // Resize
    const handleResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    // Mouse/touch drag
    const onPointerDown = (e: PointerEvent) => {
      isDragging.current = true
      autoRotate.current = false
      previousMouse.current = { x: e.clientX, y: e.clientY }
      if (resumeTimeout.current) clearTimeout(resumeTimeout.current)
    }

    const onPointerMove = (e: PointerEvent) => {
      if (isDragging.current) {
        const dx = e.clientX - previousMouse.current.x
        const dy = e.clientY - previousMouse.current.y
        globe.rotation.y += dx * 0.005
        globe.rotation.x += dy * 0.005
        rotationSpeed.current = { x: dx * 0.005, y: dy * 0.005 }
        previousMouse.current = { x: e.clientX, y: e.clientY }
      } else {
        handleInteraction(e.clientX, e.clientY, false)
      }
    }

    const onPointerUp = () => {
      isDragging.current = false
      resumeTimeout.current = setTimeout(() => {
        autoRotate.current = true
      }, 3000)
    }

    const onClick = (e: MouseEvent) => {
      handleInteraction(e.clientX, e.clientY, true)
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('pointerup', onPointerUp)
    renderer.domElement.addEventListener('pointerleave', onPointerUp)
    renderer.domElement.addEventListener('pointercancel', onPointerUp)
    renderer.domElement.addEventListener('click', onClick)
    renderer.domElement.style.touchAction = 'none'

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      renderer.domElement.removeEventListener('pointerleave', onPointerUp)
      renderer.domElement.removeEventListener('pointercancel', onPointerUp)
      renderer.domElement.removeEventListener('click', onClick)
      // Dispose Three.js GPU resources
      sphereGeo.dispose()
      sphereMat.dispose()
      wireGeo.dispose()
      wireMat.dispose()
      ringGeo.dispose()
      ringMat.dispose()
      dotGeo.dispose()
      dotMaterials.forEach((mat) => mat.dispose())
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      if (resumeTimeout.current) clearTimeout(resumeTimeout.current)
    }
  }, [handleInteraction])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {tooltip && (
        <div
          className="absolute pointer-events-none z-20"
          style={{
            left: Math.max(0, Math.min(tooltip.x + 12, tooltip.containerWidth - 180)),
            top: Math.max(0, tooltip.y - 30),
          }}
        >
          <button
            onClick={() => {
              const listenSection = document.querySelector('[data-section="4"]')
              if (listenSection) listenSection.scrollIntoView({ behavior: 'smooth' })
            }}
            className="pointer-events-auto block rounded-sm bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-3 min-w-[140px] text-left w-full"
          >
            <p className="text-sm font-semibold text-white font-['Poppins']">{tooltip.city}</p>
            <p className="text-xs text-white/60 font-['Poppins'] mt-0.5">{tooltip.language}</p>
            <p className="text-[10px] text-[#FF0CB6] font-['Poppins'] mt-1">Listen &rarr;</p>
          </button>
        </div>
      )}
    </div>
  )
}
