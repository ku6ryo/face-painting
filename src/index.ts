import {
  Scene,
  Engine,
  Vector3,
  HemisphericLight,
  Color4,
  MeshBuilder,
  PBRMetallicRoughnessMaterial,
  ArcRotateCamera,
  Texture,
  VertexData,
  Mesh,
  Camera
} from "babylonjs"
import { Canvas } from "./Canvas"
import * as tf from "@tensorflow/tfjs-core"
import "@tensorflow/tfjs-backend-webgl"
import * as detection from "@tensorflow-models/face-landmarks-detection"
import { TRIANGLES } from "./triangle"
import { UVs } from "./uv"

const canvas = document.getElementById("canvas") as HTMLCanvasElement
canvas.style.zIndex = "1"
const engine = new Engine(canvas, true, {preserveDrawingBuffer: true, stencil: true})

const scene = new Scene(engine)
// const camera = new ArcRotateCamera("camera1", 0, Math.PI / 2, 5, Vector3.Zero(), scene)
const camera = new Camera("camera", new Vector3(0, 0, 0), scene)
camera.mode = Camera.ORTHOGRAPHIC_CAMERA
camera.attachControl(canvas, false)
camera.maxZ = 500
camera.minZ = 0
new HemisphericLight("HemiLight", new Vector3(0, 1, 0), scene)
new HemisphericLight("HemiLight", new Vector3(0, -1, 0), scene)

scene.clearColor = new Color4(0, 0, 0, 0)

const face = new Mesh("spring", scene)
face.position.set(0, 0, 40)
const faceMaterial = new PBRMetallicRoughnessMaterial("standard", scene)
faceMaterial.roughness = 1
faceMaterial.metallic = 0
face.material = faceMaterial

/*
const sphere = MeshBuilder.CreateSphere("sphere", {
  diameter: 2
})
sphere.position.set(0, 0, 0)
const sphereMaterial = new PBRMetallicRoughnessMaterial("standard", scene)
sphereMaterial.roughness = 0.6
sphere.material = sphereMaterial
sphere.rotate(new Vector3(0, 0, 1), Math.PI)
*/

window.addEventListener("resize", function() {
  engine.resize()
})

const drawingCanvas = new Canvas()
drawingCanvas.setOnUpdate(() => {
  faceMaterial.baseTexture = new Texture(drawingCanvas.toDataUrl(), scene)
  faceMaterial.baseTexture.hasAlpha = true
})
document.body.appendChild(drawingCanvas.getElement())

window.addEventListener("DOMContentLoaded", async () => {
  await tf.setBackend("webgl")
  let time = 0
  const model = await detection.load(detection.SupportedPackages.mediapipeFacemesh)
  const vertexData = new VertexData()
  const update = async () => {
    time += 0.1
    try {
      const predictions = await model.estimateFaces({
        input: videoElem
      })
      if (predictions.length > 0) {
        const prediction = predictions[0]
        const mesh = (prediction as any).scaledMesh as number[][]
        mesh.forEach((v, i) => {
          positions[3 * i] = v[0] - 320
          positions[3 * i + 1] = - v[1] + 240
          positions[3 * i + 2] = v[2]
        })
        const normals = [] as number[]
        VertexData.ComputeNormals(positions, TRIANGLES, normals)
        vertexData.positions = positions
        vertexData.indices = TRIANGLES
        vertexData.normals = normals
        vertexData.uvs = uvs
        vertexData.applyToMesh(face)
      }
    } catch (e) {
      console.error(e)
    }
  }
  const videoElem = document.createElement("video")
  videoElem.style.position = "absolute"
  videoElem.style.top = "0"
  videoElem.style.left = "0"
  videoElem.style.zIndex = "0"
  videoElem.autoplay = true
  videoElem.addEventListener("playing", () => {
    const vw = videoElem.videoWidth
    const vh = videoElem.videoHeight
    canvas.width = vw
    canvas.height = vh
    engine.runRenderLoop(function() {
      update()
      scene.render()
    })
  })
  document.body.appendChild(videoElem)
  const stream = await navigator.mediaDevices.getUserMedia({ video: true })
  videoElem.srcObject = stream

  const positions = new Float32Array(468 * 3)
  const uvs = new Float32Array(468 * 2);
  for (let j = 0; j < 468; j++) {
    uvs[j * 2] = UVs[j][0]
    uvs[j * 2 + 1] = 1 - UVs[j][1]
  }
})
