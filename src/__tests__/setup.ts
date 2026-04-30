import { vi } from 'vitest'
import i18n from 'i18next'

i18n.init({ lng: 'en', resources: {} })

Object.defineProperty(window, 'core', {
  value: {
    fs: { readFileSync: vi.fn().mockResolvedValue('') },
  },
  writable: true,
})

global.requestAnimationFrame = vi.fn().mockReturnValue(1)
global.cancelAnimationFrame = vi.fn()

Object.defineProperty(global, 'performance', {
  value: { now: vi.fn().mockReturnValue(0) },
  writable: true,
})

HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  fillRect: vi.fn(), clearRect: vi.fn(), strokeRect: vi.fn(),
  beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), arc: vi.fn(),
  stroke: vi.fn(), fill: vi.fn(), fillText: vi.fn(), closePath: vi.fn(),
  drawImage: vi.fn(), measureText: vi.fn().mockReturnValue({ width: 0 }),
  fillStyle: '', strokeStyle: '', lineWidth: 1, font: '',
}) as any

Object.defineProperty(URL, 'createObjectURL', {
  value: vi.fn().mockReturnValue('blob:mock'),
  writable: true,
})
