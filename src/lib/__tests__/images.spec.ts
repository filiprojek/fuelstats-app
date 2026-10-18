import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { compressImage, MAX_PHOTO_DIMENSION } from '@/lib/images'

/** Image stub that "decodes" to the given size, or fails when size is null */
function stubImage(size: { width: number; height: number } | null) {
  class FakeImage {
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    naturalWidth = size?.width ?? 0
    naturalHeight = size?.height ?? 0
    set src(_value: string) {
      queueMicrotask(() => (size ? this.onload?.() : this.onerror?.()))
    }
  }
  vi.stubGlobal('Image', FakeImage)
}

describe('compressImage', () => {
  let ctx: { fillStyle: string; fillRect: ReturnType<typeof vi.fn>; drawImage: ReturnType<typeof vi.fn> }
  let canvas: HTMLCanvasElement | undefined

  beforeEach(() => {
    ctx = { fillStyle: '', fillRect: vi.fn(), drawImage: vi.fn() }
    canvas = undefined
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:photo'), revokeObjectURL: vi.fn() }))
    const createElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      const el = createElement(tag)
      if (tag === 'canvas') canvas = el as HTMLCanvasElement
      return el
    }) as typeof document.createElement)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,small')
  })

  afterEach(() => vi.unstubAllGlobals())

  const photo = () => new File(['x'.repeat(100)], 'IMG_0001.HEIC', { type: 'image/heic' })

  it('scales large photos down to the maximum dimension as JPEG', async () => {
    stubImage({ width: 4032, height: 3024 })
    await expect(compressImage(photo())).resolves.toBe('data:image/jpeg;base64,small')
    expect(canvas!.width).toBe(MAX_PHOTO_DIMENSION)
    expect(canvas!.height).toBe(1440)
    expect(ctx.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1920, 1440)
    expect(HTMLCanvasElement.prototype.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.8)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:photo')
  })

  it('scales portrait photos by their height', async () => {
    stubImage({ width: 3000, height: 4000 })
    await compressImage(photo())
    expect([canvas!.width, canvas!.height]).toEqual([1440, 1920])
  })

  it('keeps the size of small photos', async () => {
    stubImage({ width: 800, height: 600 })
    await compressImage(photo())
    expect([canvas!.width, canvas!.height]).toEqual([800, 600])
  })

  it('paints a white background so transparent images do not turn black', async () => {
    stubImage({ width: 10, height: 10 })
    await compressImage(photo())
    expect(ctx.fillStyle).toBe('#ffffff')
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 10, 10)
  })

  describe('falls back to the original file', () => {
    async function original(file: File) {
      return compressImage(file)
    }

    it('when the browser cannot decode the image', async () => {
      stubImage(null)
      const result = await original(new File(['abc'], 'a.png', { type: 'image/png' }))
      expect(result).toBe(`data:image/png;base64,${btoa('abc')}`)
      expect(URL.revokeObjectURL).toHaveBeenCalled()
    })

    it('when no canvas is available', async () => {
      stubImage({ width: 10, height: 10 })
      vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null)
      expect(await original(new File(['abc'], 'a.png', { type: 'image/png' }))).toMatch(/^data:image\/png;base64,/)
    })

    it('when JPEG export is not supported', async () => {
      stubImage({ width: 10, height: 10 })
      vi.mocked(HTMLCanvasElement.prototype.toDataURL).mockReturnValue('data:,')
      expect(await original(new File(['abc'], 'a.png', { type: 'image/png' }))).toMatch(/^data:image\/png;base64,/)
    })

    it('when the image has no size', async () => {
      stubImage({ width: 0, height: 0 })
      expect(await original(new File(['abc'], 'a.png', { type: 'image/png' }))).toMatch(/^data:image\/png;base64,/)
    })
  })
})
