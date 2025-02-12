import { getLSValue, setLSValue } from '../local-storage'

describe('Local Storage Utils', () => {
  const mockGetItem = jest.fn()
  const mockSetItem = jest.fn()
  const mockClear = jest.fn()

  beforeEach(() => {
    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: mockGetItem,
        setItem: mockSetItem,
        clear: mockClear,
      },
      writable: true
    })

    // Clear all mocks before each test
    jest.clearAllMocks()
  })

  describe('getLSValue', () => {
    it('returns null when key does not exist', () => {
      mockGetItem.mockReturnValueOnce(null)
      expect(getLSValue('nonexistent')).toBeNull()
      expect(mockGetItem).toHaveBeenCalledWith('nonexistent')
    })

    it('returns parsed value when key exists', () => {
      const mockData = { test: 'data' }
      mockGetItem.mockReturnValueOnce(JSON.stringify(mockData))
      
      expect(getLSValue('existing')).toEqual(mockData)
      expect(mockGetItem).toHaveBeenCalledWith('existing')
    })

    it('returns null on JSON parse error', () => {
      mockGetItem.mockReturnValueOnce('invalid json')
      
      expect(getLSValue('invalid')).toBeNull()
      expect(mockGetItem).toHaveBeenCalledWith('invalid')
    })
  })

  describe('setLSValue', () => {
    it('sets stringified value in localStorage', () => {
      const mockData = { test: 'data' }
      setLSValue('key', mockData)
      
      expect(mockSetItem).toHaveBeenCalledWith(
        'key',
        JSON.stringify(mockData)
      )
    })

    it('handles errors gracefully', () => {
      const mockError = new Error('Storage error')
      mockSetItem.mockImplementationOnce(() => {
        throw mockError
      })

      // Should not throw
      setLSValue('key', { test: 'data' })
      
      expect(mockSetItem).toHaveBeenCalled()
    })
  })
}) 