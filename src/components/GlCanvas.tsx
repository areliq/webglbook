import { useRef, useEffect } from 'react'
import './GlCanvas.css'

function GlCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('webgl2')

    if (!ctx) {
      console.log('No WebGL2 Context')
      return
    }
  })

  return (
    <canvas
      className="gl-canvas"
      width="480px"
      height="320px"
      ref={ref} />
  )
}

export default GlCanvas
