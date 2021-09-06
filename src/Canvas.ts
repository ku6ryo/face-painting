import { conv2dTranspose } from "@tensorflow/tfjs-core"

const RESOLUTION = 1024
const CANVS_UI_SIZE = 400

export class Canvas {
  canvas: HTMLCanvasElement
  dragged = false
  context: CanvasRenderingContext2D
  lastX: number | null = null
  lastY: number | null = null

  onUpdate: (() => void) | null = null

  constructor() {
    const canvas = document.createElement("canvas")
    const ctx =canvas.getContext("2d")
    if (!ctx) throw new Error("Failed to get context")
    this.context = ctx

    canvas.style.position = "absolute"
    canvas.style.bottom = "0"
    canvas.style.left = "0"
    canvas.style.height = `${CANVS_UI_SIZE}px`
    canvas.style.width = `${CANVS_UI_SIZE}px`
    canvas.width = 1024
    canvas.height = 1024
    canvas.style.backgroundColor = "white"
    canvas.style.zIndex = "3"
    this.canvas = canvas
    this.context.lineCap = "round"
    this.context.lineJoin = "round"
    this.context.lineWidth = 5
    this.context.strokeStyle = "black"
    canvas.addEventListener("mousedown", this.dragStart.bind(this))
    canvas.addEventListener("mouseup", this.dragEnd.bind(this))
    canvas.addEventListener("mouseout", this.dragEnd.bind(this))
    canvas.addEventListener("mousemove", (e) => {
      this.draw(
        (e.x - this.canvas.offsetLeft) * RESOLUTION / CANVS_UI_SIZE,
        (e.y - this.canvas.offsetTop) * RESOLUTION / CANVS_UI_SIZE
      )
    })
    canvas.addEventListener("dragover", (e) => {
      e.stopPropagation()
      e.preventDefault()
    })
    canvas.addEventListener("drop", (e) => {
      e.preventDefault()
      const files= e.dataTransfer?.files
      if (!files || files.length === 0) throw new Error("no file")
      const file = files[0]
      const reader = new FileReader()
      reader.addEventListener("load", () => {
        const img = new Image()
        img.addEventListener("load", () => {
          const aspect = img.height / img.width
          const w = RESOLUTION
          const h = aspect * w
          this.context.drawImage(img, 0, 0, w, h)
        })
        img.src = reader.result as string
      })
      reader.readAsDataURL(file)
    })
    // this.drawRect(0, 0, this.canvas.width, this.canvas.height, "white")
  }

  draw(x: number, y: number) {
    if(!this.dragged) {
      return
    }
    if (this.lastX === null || this.lastY === null) {
      this.context.moveTo(x, y)
    } else {
      this.context.moveTo(this.lastX, this.lastY)
      this.context.lineTo(x, y)
      this.context.stroke()
    }
    this.lastX = x
    this.lastY = y
  }

  drawRect(x: number, y: number, w: number, h: number, color: string) {
    this.context.beginPath()
    this.context.rect(x, y, w, h)
    this.context.fillStyle = color
    this.context.fill()
  }
 
  clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }
 
  dragStart() {
    this.context.beginPath()
    this.dragged = true
  }

  dragEnd() {
    this.context.closePath()
    this.dragged = false
    this.lastX = null
    this.lastY = null
    this.onUpdate?.()
  }

  setOnUpdate(callback: () => void) {
    this.onUpdate = callback
  }

  toDataUrl() {
    return this.canvas.toDataURL()
  }

  getElement() {
    return this.canvas
  }
}