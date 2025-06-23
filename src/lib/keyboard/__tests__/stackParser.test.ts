import { parseStackCommand, isPartialStackCommand, describeStackCommand } from '../stackParser'

describe('Stack Parser', () => {
  describe('parseStackCommand', () => {
    it('should parse position commands', () => {
      expect(parseStackCommand('5g')).toEqual({
        operator: 'g',
        operand: { type: 'position', value: 5 },
        raw: '5g'
      })
      
      expect(parseStackCommand('123g')).toEqual({
        operator: 'g',
        operand: { type: 'position', value: 123 },
        raw: '123g'
      })
    })

    it('should parse special navigation commands', () => {
      expect(parseStackCommand('gg')).toEqual({
        operator: 'gg',
        operand: { type: 'special', value: 'bottom' },
        raw: 'gg'
      })
      
      expect(parseStackCommand('G')).toEqual({
        operator: 'G',
        operand: { type: 'special', value: 'top' },
        raw: 'G'
      })
    })

    it('should parse count prefix commands', () => {
      expect(parseStackCommand('3d')).toEqual({
        operator: 'd',
        operand: { type: 'count', value: 3 },
        raw: '3d'
      })
      
      expect(parseStackCommand('5y')).toEqual({
        operator: 'y',
        operand: { type: 'count', value: 5 },
        raw: '5y'
      })
    })

    it('should parse single character commands', () => {
      expect(parseStackCommand('j')).toEqual({
        operator: 'j',
        operand: { type: 'count', value: 1 },
        raw: 'j'
      })
      
      expect(parseStackCommand('k')).toEqual({
        operator: 'k',
        operand: { type: 'count', value: -1 },
        raw: 'k'
      })
    })

    it('should parse named cell references', () => {
      expect(parseStackCommand('@foo')).toEqual({
        operator: '@',
        operand: { type: 'named', value: 'foo' },
        raw: '@foo'
      })
      
      expect(parseStackCommand('@total123')).toEqual({
        operator: '@',
        operand: { type: 'named', value: 'total123' },
        raw: '@total123'
      })
    })

    it('should parse range commands', () => {
      expect(parseStackCommand('3,7d')).toEqual({
        operator: 'd',
        operand: { type: 'range', value: [3, 7] },
        raw: '3,7d'
      })
    })

    it('should parse delete-to commands', () => {
      expect(parseStackCommand('d5g')).toEqual({
        operator: 'dg',
        operand: { type: 'position', value: 5 },
        raw: 'd5g'
      })
    })

    it('should return null for invalid commands', () => {
      expect(parseStackCommand('')).toBeNull()
      expect(parseStackCommand('xyz')).toBeNull()
      expect(parseStackCommand('12')).toBeNull()
    })
  })

  describe('isPartialStackCommand', () => {
    it('should recognize partial commands', () => {
      expect(isPartialStackCommand('g')).toBe(true)
      expect(isPartialStackCommand('3')).toBe(true)
      expect(isPartialStackCommand('12')).toBe(true)
      expect(isPartialStackCommand('@')).toBe(true)
      expect(isPartialStackCommand('@fo')).toBe(true)
      expect(isPartialStackCommand('d3')).toBe(true)
      expect(isPartialStackCommand('3,')).toBe(true)
      expect(isPartialStackCommand('3,7')).toBe(true)
    })

    it('should reject non-partial commands', () => {
      expect(isPartialStackCommand('xyz')).toBe(false)
      expect(isPartialStackCommand('!')).toBe(false)
    })
  })

  describe('describeStackCommand', () => {
    it('should describe movement commands', () => {
      expect(describeStackCommand({
        operator: 'g',
        operand: { type: 'position', value: 5 },
        raw: '5g'
      })).toBe('Go to position 5')
      
      expect(describeStackCommand({
        operator: 'j',
        operand: { type: 'count', value: 3 },
        raw: '3j'
      })).toBe('Move down 3 positions')
    })

    it('should describe deletion commands', () => {
      expect(describeStackCommand({
        operator: 'd',
        operand: { type: 'count', value: 2 },
        raw: '2d'
      })).toBe('Delete 2 items')
      
      expect(describeStackCommand({
        operator: 'dg',
        operand: { type: 'position', value: 7 },
        raw: 'd7g'
      })).toBe('Delete to position 7')
    })

    it('should describe special commands', () => {
      expect(describeStackCommand({
        operator: 'G',
        operand: { type: 'special', value: 'top' },
        raw: 'G'
      })).toBe('Go to top of stack')
    })
  })
})