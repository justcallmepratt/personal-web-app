import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const kafkaProduce = vi.hoisted(() => vi.fn())
const kafkaMessages = vi.hoisted(() => vi.fn())
vi.mock('@/lib/api', () => ({ api: { kafkaProduce, kafkaMessages } }))

import KafkaDemo from '@/components/sections/KafkaDemo'

const SID_KEY = 'kafka-demo-sid'
const record = (id: string, content: string, key = '') => ({
  id,
  key,
  content,
  timestamp: '2026-01-01T12:00:00',
  topic: 'demo-topic',
})
const ok = (records: unknown[] = []) => ({ success: true, message: 'ok', records })

const lit = () =>
  ['producer', 'topic', 'consumer', 'store'].filter(
    (s) => screen.getByTestId(`stage-${s}`).dataset.lit === 'true',
  )

function send(message = 'hello', key = '') {
  if (key) fireEvent.change(screen.getByPlaceholderText('order-42'), { target: { value: key } })
  fireEvent.change(screen.getByPlaceholderText('Hello, Kafka'), { target: { value: message } })
  fireEvent.click(screen.getByRole('button', { name: /produce/i }))
}

/** Lets pending promises settle, then runs the poll timers. */
const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms))

beforeEach(() => {
  vi.useFakeTimers()
  window.sessionStorage.clear()
  kafkaProduce.mockReset().mockResolvedValue({ success: true, message: 'sent' })
  kafkaMessages.mockReset().mockResolvedValue(ok())
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('KafkaDemo', () => {
  it('shows an offline notice and makes no calls when not configured', async () => {
    window.sessionStorage.setItem(SID_KEY, 'a1b2c3d4e5f60718')
    render(<KafkaDemo configured={false} />)
    await advance(0)

    expect(screen.getByText(/broker offline/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /produce/i })).toBeDisabled()
    fireEvent.submit(screen.getByRole('button', { name: /produce/i }).closest('form')!)
    await advance(0)
    expect(kafkaProduce).not.toHaveBeenCalled()
    expect(kafkaMessages).not.toHaveBeenCalled()
  })

  it('makes no calls on a first visit until something is produced', async () => {
    render(<KafkaDemo configured />)
    await advance(5000)
    expect(kafkaMessages).not.toHaveBeenCalled()
    expect(screen.getByText(/nothing consumed yet/i)).toBeInTheDocument()
    expect(lit()).toEqual([])
  })

  it('produces a record, then polls until the consumer has it', async () => {
    kafkaMessages.mockResolvedValueOnce(ok()).mockResolvedValue(ok([record('1', 'hello', 'order-1')]))
    render(<KafkaDemo configured />)
    send('hello', 'order-1')
    await advance(0)

    const sid = window.sessionStorage.getItem(SID_KEY)
    expect(sid).toMatch(/^[a-f0-9]{16}$/)
    expect(kafkaProduce).toHaveBeenCalledWith({ sid, key: 'order-1', message: 'hello' })
    expect(lit()).toEqual(['producer', 'topic'])
    expect(screen.getByPlaceholderText('Hello, Kafka')).toHaveValue('')

    await advance(1200) // first poll: not there yet
    expect(lit()).toEqual(['producer', 'topic'])
    await advance(1200) // second poll: consumed

    expect(screen.getByText('hello')).toBeInTheDocument()
    expect(screen.getByText('[order-1]')).toBeInTheDocument()
    expect(screen.getByText(/1 record ·/)).toBeInTheDocument()
    expect(lit()).toEqual(['producer', 'topic', 'consumer', 'store'])
    expect(screen.getByText(/consumed and stored/i)).toBeInTheDocument()

    await advance(20_000)
    expect(kafkaMessages).toHaveBeenCalledTimes(2) // polling stopped
  })

  it('gives up after a bounded number of polls when the record never arrives', async () => {
    render(<KafkaDemo configured />)
    send()
    await advance(60_000)

    expect(kafkaMessages).toHaveBeenCalledTimes(8)
    expect(screen.getByText(/has not picked it up yet/i)).toBeInTheDocument()
    expect(lit()).toEqual([])
  })

  it('shows the relay error when a send is rejected and does not poll', async () => {
    kafkaProduce.mockResolvedValue({ success: false, message: 'The Kafka demo service is not responding.' })
    render(<KafkaDemo configured />)
    send()
    await advance(5000)

    expect(screen.getByText(/not responding/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Hello, Kafka')).toHaveValue('hello')
    expect(kafkaMessages).not.toHaveBeenCalled()
  })

  it('falls back to a generic error when the relay gives no message', async () => {
    kafkaProduce.mockResolvedValue({ success: false, message: '' })
    render(<KafkaDemo configured />)
    send()
    await advance(0)
    expect(screen.getByText(/send failed/i)).toBeInTheDocument()
  })

  it('reports a network failure on send', async () => {
    kafkaProduce.mockRejectedValue(new Error('offline'))
    render(<KafkaDemo configured />)
    send()
    await advance(0)
    expect(screen.getByText(/connection terminated/i)).toBeInTheDocument()
  })

  it('stops polling when a read fails', async () => {
    kafkaMessages.mockResolvedValue({ success: false, message: 'Slow down.', records: [] })
    render(<KafkaDemo configured />)
    send()
    await advance(20_000)

    expect(kafkaMessages).toHaveBeenCalledTimes(1)
    expect(screen.getByText(/slow down/i)).toBeInTheDocument()
  })

  it('reports a network failure on read', async () => {
    kafkaMessages.mockRejectedValue(new Error('offline'))
    render(<KafkaDemo configured />)
    send()
    await advance(1200)
    expect(screen.getByText(/connection terminated/i)).toBeInTheDocument()
  })

  it('loads the session records once after a reload', async () => {
    window.sessionStorage.setItem(SID_KEY, 'a1b2c3d4e5f60718')
    kafkaMessages.mockResolvedValue(ok([record('1', 'earlier'), record('2', 'another')]))
    render(<KafkaDemo configured />)
    await advance(10_000)

    expect(kafkaMessages).toHaveBeenCalledTimes(1)
    expect(kafkaMessages).toHaveBeenCalledWith('a1b2c3d4e5f60718')
    expect(screen.getByText('earlier')).toBeInTheDocument()
    expect(screen.getByText(/2 records ·/)).toBeInTheDocument()
  })

  it('renders a placeholder for an unreadable timestamp', async () => {
    window.sessionStorage.setItem(SID_KEY, 'a1b2c3d4e5f60718')
    kafkaMessages.mockResolvedValue(ok([{ ...record('1', 'x'), timestamp: 'garbage' }]))
    render(<KafkaDemo configured />)
    await advance(0)
    expect(screen.getByText('--:--:--')).toBeInTheDocument()
  })

  it('refreshes on demand, and does nothing before a session exists', async () => {
    render(<KafkaDemo configured />)
    fireEvent.click(screen.getByRole('button', { name: /refresh/i }))
    await advance(0)
    expect(kafkaMessages).not.toHaveBeenCalled()

    send()
    await advance(60_000) // never arrives
    kafkaMessages.mockResolvedValue(ok([record('1', 'late arrival')]))
    fireEvent.click(screen.getByRole('button', { name: /refresh/i }))
    await advance(0)
    expect(screen.getByText('late arrival')).toBeInTheDocument()
  })

  it('still works when session storage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    kafkaMessages.mockResolvedValue(ok([record('1', 'hello')]))
    render(<KafkaDemo configured />)
    send()
    await advance(1200)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('stops quietly when unmounted mid-poll', async () => {
    const { unmount } = render(<KafkaDemo configured />)
    send()
    await advance(0)
    unmount()
    await advance(20_000)
    expect(kafkaMessages).toHaveBeenCalledTimes(1)
  })
})
