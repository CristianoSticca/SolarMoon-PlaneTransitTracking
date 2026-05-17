import { fovDeg, angularSizeDeg, pixelSpan } from '../fov'

describe('fovDeg', () => {
  it('computes horizontal FOV for 400mm Full Frame', () => {
    // 2 * atan(36 / (2 * 400)) = 2 * atan(0.045) ≈ 5.157°
    expect(fovDeg(36, 400)).toBeCloseTo(5.157, 2)
  })

  it('computes FOV for 600mm Full Frame', () => {
    // 2 * atan(36 / 1200) ≈ 3.438°
    expect(fovDeg(36, 600)).toBeCloseTo(3.438, 2)
  })

  it('computes FOV for 400mm APS-C Canon (22.3mm sensor)', () => {
    // 2 * atan(22.3 / 800) ≈ 3.19°
    expect(fovDeg(22.3, 400)).toBeCloseTo(3.190, 2)
  })
})

describe('angularSizeDeg', () => {
  it('computes angular size of a 737 wingspan (35.8m) at 10km', () => {
    // 2 * atan(35.8 / (2 * 10000)) = 2 * atan(0.00179) ≈ 0.2051°
    expect(angularSizeDeg(35.8, 10)).toBeCloseTo(0.2051, 3)
  })

  it('returns ~0.5° for the Moon (angular diameter formula check)', () => {
    // Moon diameter ~3474km at ~384400km distance ≈ 0.518°
    expect(angularSizeDeg(3474000, 384400)).toBeCloseTo(0.518, 1)
  })
})

describe('pixelSpan', () => {
  it('computes pixel span of the Moon on a 700px-wide canvas at 5.157° FOV', () => {
    // 700 * (0.5 / 5.157) ≈ 67.8px
    expect(pixelSpan(0.5, 5.157, 700)).toBeCloseTo(67.8, 0)
  })

  it('is proportional: doubling FOV halves pixel span', () => {
    const span1 = pixelSpan(0.5, 5, 700)
    const span2 = pixelSpan(0.5, 10, 700)
    expect(span1).toBeCloseTo(span2 * 2, 1)
  })
})
