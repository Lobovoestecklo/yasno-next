import {
  getAllChatHistories,
  getChatHistoryById,
  addChatToHistory,
  updateChatHistory,
  updateChatTitle,
  deleteChatHistory,
  clearAllChatHistories,
} from '../chat-history'
import { getLSValue, setLSValue } from '../local-storage'
import { IMessage } from '@/types'

jest.mock('../local-storage', () => ({
  getLSValue: jest.fn(),
  setLSValue: jest.fn(),
}))

describe('Chat History Utils', () => {
  const mockChat = {
    id: 'test-id',
    title: 'Test Chat',
    messages: [{ role: 'user' as const, content: 'Hello' }],
    createdAt: '2024-01-01T00:00:00.000Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAllChatHistories', () => {
    it('returns empty array when no chats exist', () => {
      ;(getLSValue as jest.Mock).mockReturnValueOnce(null)
      expect(getAllChatHistories()).toEqual([])
    })

    it('returns array of chats when they exist', () => {
      ;(getLSValue as jest.Mock).mockReturnValueOnce([mockChat])
      expect(getAllChatHistories()).toEqual([mockChat])
    })
  })

  describe('getChatHistoryById', () => {
    it('returns null when chat does not exist', () => {
      ;(getLSValue as jest.Mock).mockReturnValueOnce([mockChat])
      expect(getChatHistoryById('nonexistent')).toBeNull()
    })

    it('returns chat when it exists', () => {
      ;(getLSValue as jest.Mock).mockReturnValueOnce([mockChat])
      expect(getChatHistoryById('test-id')).toEqual(mockChat)
    })
  })

  describe('addChatToHistory', () => {
    it('adds new chat to history', () => {
      ;(getLSValue as jest.Mock).mockReturnValueOnce([])
      const chatId = addChatToHistory(mockChat.messages, mockChat.title)
      
      expect(setLSValue).toHaveBeenCalledWith(
        'chat-history',
        expect.arrayContaining([
          expect.objectContaining({
            id: chatId,
            title: mockChat.title,
            messages: mockChat.messages,
          }),
        ])
      )
    })
  })

  describe('updateChatHistory', () => {
    it('updates existing chat messages', () => {
      ;(getLSValue as jest.Mock).mockReturnValueOnce([mockChat])
      const newMessages: IMessage[] = [{ role: 'assistant', content: 'Updated' }]
      
      updateChatHistory('test-id', newMessages)
      
      expect(setLSValue).toHaveBeenCalledWith(
        'chat-history',
        expect.arrayContaining([
          expect.objectContaining({
            id: 'test-id',
            messages: newMessages,
          }),
        ])
      )
    })
  })

  describe('updateChatTitle', () => {
    it('updates existing chat title', () => {
      ;(getLSValue as jest.Mock).mockReturnValueOnce([mockChat])
      const newTitle = 'Updated Title'
      
      updateChatTitle('test-id', newTitle)
      
      expect(setLSValue).toHaveBeenCalledWith(
        'chat-history',
        expect.arrayContaining([
          expect.objectContaining({
            id: 'test-id',
            title: newTitle,
          }),
        ])
      )
    })
  })

  describe('deleteChatHistory', () => {
    it('removes chat from history', () => {
      ;(getLSValue as jest.Mock).mockReturnValueOnce([mockChat])
      
      deleteChatHistory('test-id')
      
      expect(setLSValue).toHaveBeenCalledWith('chat-history', [])
    })
  })

  describe('clearAllChatHistories', () => {
    it('clears all chat histories', () => {
      clearAllChatHistories()
      expect(setLSValue).toHaveBeenCalledWith('chat-history', [])
    })
  })
}) 