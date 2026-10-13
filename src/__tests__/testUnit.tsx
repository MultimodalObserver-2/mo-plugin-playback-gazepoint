import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'

import GazePointPlayback from '../main'
import { GazePointPreview } from '../components/GazepointPreview'
import { GazePointView } from '../components/GazepointView'
import properties from '../properties'

function makeControls() {
  return {
    onPlay: vi.fn().mockReturnValue(() => {}),
    onPause: vi.fn().mockReturnValue(() => {}),
    onSeek: vi.fn().mockReturnValue(() => {}),
    onSync: vi.fn().mockReturnValue(() => {}),
  }
}

function makeContext(filePath = '/test/gaze.txt') {
  return { filePath, captureStartTimestamp: 0, fileCaptureStartTimestamp: 0, pauseIntervals: [] as [number, number][] }
}

const SAMPLE_GAZE_DATA = [
  'REC CNT:0 t:1000 lps:3.50 d:1',
  'REC CNT:1 t:1100 lps:3.60 d:1',
  'REC CNT:2 t:1200 lps:3.45 d:1',
  'REC CNT:3 t:1300 lps:3.55 d:1',
  'REC CNT:4 t:1400 lps:3.65 d:1',
].join('\n')

describe('GazePointPlayback', () => {
  let plugin: GazePointPlayback

  beforeEach(() => {
    plugin = new GazePointPlayback()
  })

  it('instance', () => {
    expect(plugin).toBeDefined()
  })

  it('extensions txt raw', () => {
    const exts = plugin.validExtensions()
    expect(exts).toContain('txt')
    expect(exts).toContain('raw')
  })

  it('descriptor null false', () => {
    expect(plugin.validateCaptureDescriptor(null)).toBe(false)
  })

  it('descriptor gaze_data', () => {
    expect(plugin.validateCaptureDescriptor({ format: 'gaze_data' })).toBe(true)
  })

  it('descriptor timestamp', () => {
    expect(plugin.validateCaptureDescriptor({ properties: { timestamp: true } })).toBe(true)
  })

  it('descriptor empty false', () => {
    expect(plugin.validateCaptureDescriptor({})).toBe(false)
  })

  it('descriptor unrelated false', () => {
    expect(plugin.validateCaptureDescriptor({ type: 'audio', creators: ['mic'] })).toBe(false)
  })

  it('descriptor no timestamp false', () => {
    expect(plugin.validateCaptureDescriptor({ properties: { value: 1 } })).toBe(false)
  })

  it('getView', () => {
    const el = plugin.getView({ controls: makeControls(), context: makeContext(), settings: {} })
    expect(el).not.toBeNull()
  })

  it('getPreview', () => {
    const el = plugin.getPreview()
    expect(el).not.toBeNull()
  })
})

describe('properties', () => {
  it('defined', () => {
    expect(properties).toBeDefined()
    expect(typeof properties).toBe('object')
  })
})

describe('GazePointPreview', () => {
  it('renders', () => {
    render(<GazePointPreview />)
  })

  it('container', () => {
    const { container } = render(<GazePointPreview />)
    expect(container.firstChild).not.toBeNull()
  })

  it('div', () => {
    const { container } = render(<GazePointPreview />)
    expect(container.querySelector('div')).not.toBeNull()
  })
})

describe('GazePointView', () => {
  function renderView(filePath = '/test/gaze.txt') {
    const controls = makeControls()
    const context = makeContext(filePath)
    return {
      ...render(<GazePointView controls={controls} context={context} settings={{}} />),
      controls,
    }
  }

  it('renders', () => {
    renderView()
  })

  it('canvas', () => {
    const { container } = renderView()
    expect(container.querySelector('canvas')).not.toBeNull()
  })

  it('label GazePoint 3 HD', () => {
    const { container } = renderView()
    expect(container.textContent).toContain('GazePoint 3 HD')
  })

  it('time display', () => {
    const { container } = renderView()
    expect(container.textContent).toContain('Time:')
  })

  it('points count', () => {
    const { container } = renderView()
    expect(container.textContent).toContain('Points:')
  })

  it('zero points empty file', () => {
    const { container } = renderView()
    expect(container.textContent).toContain('Points: 0')
  })

  it('play handler', () => {
    const { controls } = renderView()
    expect(controls.onPlay).toHaveBeenCalled()
  })

  it('pause handler', () => {
    const { controls } = renderView()
    expect(controls.onPause).toHaveBeenCalled()
  })

  it('seek handler', () => {
    const { controls } = renderView()
    expect(controls.onSeek).toHaveBeenCalled()
  })

  it('sync handler', () => {
    const { controls } = renderView()
    expect(controls.onSync).toHaveBeenCalled()
  })

  it('cleanup unmount', () => {
    const unsubPlay = vi.fn()
    const unsubPause = vi.fn()
    const unsubSeek = vi.fn()
    const unsubSync = vi.fn()
    const controls = {
      onPlay: vi.fn().mockReturnValue(unsubPlay),
      onPause: vi.fn().mockReturnValue(unsubPause),
      onSeek: vi.fn().mockReturnValue(unsubSeek),
      onSync: vi.fn().mockReturnValue(unsubSync),
    }
    const { unmount } = render(
      <GazePointView controls={controls} context={makeContext()} settings={{}} />
    )
    unmount()
    expect(unsubPlay).toHaveBeenCalled()
    expect(unsubPause).toHaveBeenCalled()
    expect(unsubSeek).toHaveBeenCalled()
    expect(unsubSync).toHaveBeenCalled()
  })

  it('amplitude length buttons', () => {
    const { container } = renderView()
    const buttons = container.querySelectorAll('button')
    expect(buttons.length).toBe(4)
    buttons.forEach(btn => { fireEvent.click(btn) })
  })

  it('gaze data file', async () => {
    ;(window.core.fs.readFileSync as ReturnType<typeof vi.fn>).mockResolvedValueOnce(SAMPLE_GAZE_DATA)
    const controls = makeControls()
    const { container } = render(
      <GazePointView controls={controls} context={makeContext()} settings={{}} />
    )
    await act(async () => { await Promise.resolve() })
    expect(container.textContent).toContain('Points: 5')
  })

  it('corrupt file', async () => {
    ;(window.core.fs.readFileSync as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      'bad data\nnot parseable'
    )
    const controls = makeControls()
    render(<GazePointView controls={controls} context={makeContext()} settings={{}} />)
    await act(async () => { await Promise.resolve() })
  })

  it('play callback time', async () => {
    const controls = makeControls()
    let playCallback: (from: number) => void = () => {}
    controls.onPlay.mockImplementation((cb: (from: number) => void) => {
      playCallback = cb
      return () => {}
    })
    const { container } = render(
      <GazePointView controls={controls} context={makeContext()} settings={{}} />
    )
    act(() => { playCallback(4000) })
    expect(container.textContent).toContain('4')
  })

  it('seek callback time', () => {
    const controls = makeControls()
    let seekCallback: (to: number) => void = () => {}
    controls.onSeek.mockImplementation((cb: (to: number) => void) => {
      seekCallback = cb
      return () => {}
    })
    const { container } = render(
      <GazePointView controls={controls} context={makeContext()} settings={{}} />
    )
    act(() => { seekCallback(2000) })
    expect(container.textContent).toContain('2')
  })

  it('amp plus', () => {
    const { container } = renderView()
    const buttons = container.querySelectorAll('button')
    const ampPlus = Array.from(buttons).find(btn => btn.textContent === 'Amp +')
    expect(ampPlus).toBeDefined()
    fireEvent.click(ampPlus!)
  })

  it('amp minus', () => {
    const { container } = renderView()
    const buttons = container.querySelectorAll('button')
    const ampMinus = Array.from(buttons).find(btn => btn.textContent === 'Amp -')
    expect(ampMinus).toBeDefined()
    fireEvent.click(ampMinus!)
  })

  it('len plus', () => {
    const { container } = renderView()
    const buttons = container.querySelectorAll('button')
    const lenPlus = Array.from(buttons).find(btn => btn.textContent === 'Len +')
    expect(lenPlus).toBeDefined()
    fireEvent.click(lenPlus!)
  })

  it('len minus', () => {
    const { container } = renderView()
    const buttons = container.querySelectorAll('button')
    const lenMinus = Array.from(buttons).find(btn => btn.textContent === 'Len -')
    expect(lenMinus).toBeDefined()
    fireEvent.click(lenMinus!)
  })
})
