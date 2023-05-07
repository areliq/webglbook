import { useRef, useEffect } from 'react'
import './GlCanvas.css'

const vertexShader = `#version 300 es
precision mediump float;

// Supplied vertex position attribute
in vec3 aVertexPosition;

void main(void) {
  // Set the position in clipspace coordinates
  gl_Position = vec4(aVertexPosition, 1.0);
}
`

const fragmentShader = `#version 300 es
precision mediump float;

// Color that is the result of this shader
out vec4 fragColor;

void main(void) {
  // Set the result as red
  fragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
`

class WebGL2Square {
  private ctx: WebGL2RenderingContext
  private program: WebGLProgram
  private buffers: {
    vertex: WebGLBuffer | null
    index: WebGLBuffer | null
  } = {
    vertex: null,
    index: null,
  }
  private locations: {
    [key: string]: number
  }
  private indices = [0, 1, 2, 0, 2, 3]  // counter-clockwise
  private vao: WebGLVertexArrayObject

  constructor(canvas: HTMLCanvasElement | null) {
    const context = canvas?.getContext('webgl2')

    if (!context) {
      throw new Error('WebGL2RenderingContext does not exist')
    }

    const program = context.createProgram()

    if (!program) {
      throw new Error('Failed to create WebGL2 program')
    }

    const vao = context.createVertexArray()

    if (!vao) {
      throw new Error('Failed to create Vertex Array Object')
    }

    this.ctx = context
    this.program = program
    this.vao = vao
    this.locations = this.getLocations()
    this.buffers = this.initBuffersForTrapezoid()
  }

  private assignShader(source: string, type: 'vertex' | 'fragment') {
    const shaderType = type === 'vertex' ? this.ctx.VERTEX_SHADER : this.ctx.FRAGMENT_SHADER

    const shader = this.ctx.createShader(shaderType)

    if (!shader) {
      throw new Error('Failed to create shader')
    }

    this.ctx.shaderSource(shader, source)
    this.ctx.compileShader(shader)

    if (!this.ctx.getShaderParameter(shader, this.ctx.COMPILE_STATUS)) {
      const fallbackMessage = 'Failed to compile shader and failed to get shader info log too'
      const msg = this.ctx.getShaderInfoLog(shader) ?? fallbackMessage
      throw new Error(msg)
    }

    this.ctx.attachShader(this.program, shader)
  }

  setup(vertexShaderSource: string, fragmentShaderSource: string) {
    this.assignShader(vertexShaderSource, 'vertex')
    this.assignShader(fragmentShaderSource, 'fragment')
    this.ctx.linkProgram(this.program)

    if (!this.ctx.getProgramParameter(this.program, this.ctx.LINK_STATUS)) {
      const fallbackMessage = 'Failed to link shader program and failed to get program info log too'
      const msg = this.ctx.getProgramInfoLog(this.program) ?? fallbackMessage
      throw new Error(msg)
    }

    this.ctx.useProgram(this.program)

    this.ctx.clearColor(0, 0, 0, 1)  // black
  }

  private initBuffersForTrapezoid() {
    const vertices = [
      -0.5, -0.5, 0,
      -0.25, 0.5, 0,
      0.0, -0.5, 0,
      0.25, 0.5, 0,
      0.5, -0.5, 0,
    ]

    const indices = [
      0, 1, 2,
      0, 2, 3,
      2, 3, 4,
    ]

    this.ctx.bindVertexArray(this.vao)

    // Setup Vertex Buffer Object
    const vbo = this.ctx.createBuffer()
    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, vbo)
    this.ctx.bufferData(this.ctx.ARRAY_BUFFER, new Float32Array(vertices), this.ctx.STATIC_DRAW)

    this.ctx.enableVertexAttribArray(this.locations['aVertexPosition'])
    this.ctx.vertexAttribPointer(this.locations['aVertexPosition'], 3, this.ctx.FLOAT, false, 0, 0)
    
    // Setup Index Buffer Object
    const ibo = this.ctx.createBuffer()
    this.ctx.bindBuffer(this.ctx.ELEMENT_ARRAY_BUFFER, ibo)
    this.ctx.bufferData(this.ctx.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.ctx.STATIC_DRAW)

    // Clear used buffer
    this.ctx.bindVertexArray(null)
    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, null)
    this.ctx.bindBuffer(this.ctx.ELEMENT_ARRAY_BUFFER, null)

    // TODO: refactor
    this.indices = indices

    return {
      vertex: vbo,
      index: ibo,
    }
  }

  private initBuffersForSquare() {
    const topLeft = [-0.5, 0.5, 0]
    const bottomLeft = [-0.5, -0.5, 0]
    const bottomRight = [0.5, -0.5, 0]
    const topRight = [0.5, 0.5, 0]

    const vertices = [
      ...topLeft, ...bottomLeft, ...bottomRight, ...topRight
    ]

    const indices = [0, 1, 2, 0, 2, 3]

    this.ctx.bindVertexArray(this.vao)

    // Setup Vertex Buffer Object
    const vbo = this.ctx.createBuffer()
    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, vbo)
    this.ctx.bufferData(this.ctx.ARRAY_BUFFER, new Float32Array(vertices), this.ctx.STATIC_DRAW)

    this.ctx.enableVertexAttribArray(this.locations['aVertexPosition'])
    this.ctx.vertexAttribPointer(this.locations['aVertexPosition'], 3, this.ctx.FLOAT, false, 0, 0)
    
    // Setup Index Buffer Object
    const ibo = this.ctx.createBuffer()
    this.ctx.bindBuffer(this.ctx.ELEMENT_ARRAY_BUFFER, ibo)
    this.ctx.bufferData(this.ctx.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.ctx.STATIC_DRAW)

    // Clear used buffer
    this.ctx.bindVertexArray(null)
    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, null)
    this.ctx.bindBuffer(this.ctx.ELEMENT_ARRAY_BUFFER, null)

    // TODO: refactor
    this.indices = indices

    return {
      vertex: vbo,
      index: ibo,
    }
  }

  private getLocations() {
    return {
      'aVertexPosition': this.ctx.getAttribLocation(this.program, 'aVertexPosition')
    }
  }

  draw() {
    this.ctx.clear(this.ctx.COLOR_BUFFER_BIT | this.ctx.DEPTH_BUFFER_BIT)
    this.ctx.viewport(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)

    this.ctx.bindVertexArray(this.vao)

    this.ctx.bindBuffer(this.ctx.ELEMENT_ARRAY_BUFFER, this.buffers.index)

    this.ctx.drawElements(this.ctx.TRIANGLES, this.indices.length, this.ctx.UNSIGNED_SHORT, 0)
    
    // Clear used buffer
    this.ctx.bindVertexArray(null)
    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, null)
    this.ctx.bindBuffer(this.ctx.ELEMENT_ARRAY_BUFFER, null)
  }
}


function GlCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    
    if (!canvas) {
      console.log('no canvas')
      return
    }

    const square = new WebGL2Square(canvas)
    square.setup(vertexShader, fragmentShader)
    square.draw()
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
