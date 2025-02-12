import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '../alert-dialog'

describe('AlertDialog', () => {
  const mockOnDelete = jest.fn()
  const mockOnCancel = jest.fn()

  const TestDialog = () => (
    <AlertDialog>
      <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить историю чатов?</AlertDialogTitle>
          <AlertDialogDescription>
            Это действие нельзя отменить. Это удалит этот чат из вашей истории.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={mockOnCancel}>Отмена</AlertDialogCancel>
          <AlertDialogAction onClick={mockOnDelete}>Удалить</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  beforeEach(() => {
    mockOnDelete.mockClear()
    mockOnCancel.mockClear()
  })

  it('renders the trigger button', () => {
    render(<TestDialog />)
    expect(screen.getByText('Open Dialog')).toBeInTheDocument()
  })

  it('opens dialog when trigger is clicked', () => {
    render(<TestDialog />)
    fireEvent.click(screen.getByText('Open Dialog'))
    expect(screen.getByText('Удалить историю чатов?')).toBeInTheDocument()
  })

  it('calls onDelete when delete button is clicked', () => {
    render(<TestDialog />)
    fireEvent.click(screen.getByText('Open Dialog'))
    fireEvent.click(screen.getByText('Удалить'))
    expect(mockOnDelete).toHaveBeenCalled()
  })

  it('calls onCancel when cancel button is clicked', () => {
    render(<TestDialog />)
    fireEvent.click(screen.getByText('Open Dialog'))
    fireEvent.click(screen.getByText('Отмена'))
    expect(mockOnCancel).toHaveBeenCalled()
  })
}) 