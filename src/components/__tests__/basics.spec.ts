import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AppDialog from '@/components/AppDialog.vue'
import IconLabelButton from '@/components/IconLabelButton.vue'
import StatCard from '@/components/StatCard.vue'
import TextInput from '@/components/TextInput.vue'
import SegmentSwitch from '@/components/SegmentSwitch.vue'
import LineChart from '@/components/LineChart.vue'

vi.mock('vue-chartjs', () => ({
  Line: { name: 'Line', props: ['data', 'options'], template: '<canvas />' },
}))

describe('AppDialog', () => {
  it('renders title, description and variant class', () => {
    const w = mount(AppDialog, { props: { title: 'Saved', description: 'All good', variant: 'success' } })
    expect(w.find('.title').text()).toBe('Saved')
    expect(w.find('.description').text()).toBe('All good')
    expect(w.classes()).toContain('success')
  })

  it('omits the description and defaults to info', () => {
    const w = mount(AppDialog, { props: { title: 'Hi' } })
    expect(w.find('.description').exists()).toBe(false)
    expect(w.classes()).toContain('info')
  })
})

describe('IconLabelButton', () => {
  it('renders icon and label and forwards attributes and clicks', async () => {
    const onClick = vi.fn()
    const w = mount(IconLabelButton, { props: { icon: 'add', label: 'Add', inline: true, elevated: true }, attrs: { id: 'x', onClick } })
    const btn = w.find('button')
    expect(btn.attributes('id')).toBe('x')
    expect(btn.classes()).toEqual(expect.arrayContaining(['inline', 'elevated']))
    expect(w.find('.material-symbols-outlined').text()).toBe('add')
    expect(w.find('.material-symbols-outlined').classes()).toContain('material-fill')
    expect(w.find('.label').text()).toBe('Add')
    await btn.trigger('click')
    expect(onClick).toHaveBeenCalled()
  })

  it('uses slots when no icon or label is given and supports outlined icons', () => {
    const w = mount(IconLabelButton, { slots: { icon: '<i class="slot-icon" />', label: '<b class="slot-label" />' } })
    expect(w.find('.slot-icon').exists()).toBe(true)
    expect(w.find('.slot-label').exists()).toBe(true)
    const outlined = mount(IconLabelButton, { props: { icon: 'x', outlined: true } })
    expect(outlined.find('.material-symbols-outlined').classes()).not.toContain('material-fill')
  })
})

describe('StatCard', () => {
  it('shows value and label', () => {
    const w = mount(StatCard, { props: { label: 'Avg', value: '5.2 l' } })
    expect(w.find('.title').text()).toBe('5.2 l')
    expect(w.find('.label').text()).toBe('Avg')
  })
})

describe('TextInput', () => {
  it('binds id, type, placeholder and label', () => {
    const w = mount(TextInput, { props: { modelValue: 'a', id: 'email', type: 'email', placeholder: 'Email' } })
    const input = w.find('input')
    expect(input.attributes()).toMatchObject({ id: 'email', type: 'email', placeholder: 'Email' })
    expect((input.element as HTMLInputElement).value).toBe('a')
    expect(w.find('label').attributes('for')).toBe('email')
    expect(w.find('label').text()).toBe('Email')
  })

  it('emits update:modelValue on input', async () => {
    const w = mount(TextInput, { props: { modelValue: '' } })
    await w.find('input').setValue('hello')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['hello'])
  })
})

describe('SegmentSwitch', () => {
  const options = [
    { value: 'a', label: 'Alpha', icon: 'star', accent: 'success' as const },
    { value: 'b', label: 'Beta' },
  ]

  it('marks the active option and positions the indicator', () => {
    const w = mount(SegmentSwitch, { props: { modelValue: 'b', options } })
    const buttons = w.findAll('button')
    expect(buttons[1]!.classes()).toContain('active')
    expect(buttons[1]!.attributes('aria-selected')).toBe('true')
    expect(buttons[0]!.classes()).toContain('accent-success')
    expect(w.find('.indicator').attributes('style')).toContain('50%')
    expect(w.find('.segmented').attributes('aria-label')).toBe('Select option')
  })

  it('emits the selected value', async () => {
    const w = mount(SegmentSwitch, { props: { modelValue: 'a', options, ariaLabel: 'Kind' } })
    await w.findAll('button')[1]!.trigger('click')
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['b'])
    expect(w.find('.segmented').attributes('aria-label')).toBe('Kind')
  })

  it('falls back to the first option for unknown values', () => {
    const w = mount(SegmentSwitch, { props: { modelValue: 'zzz', options } })
    expect(w.find('.indicator').attributes('style')).toContain('calc(0% + var(--space-xs))')
  })
})

describe('LineChart', () => {
  it('passes a single dataset with defaults to the chart', () => {
    const w = mount(LineChart, { props: { labels: ['Jan', 'Feb'], data: [1, 2], label: 'Price' } })
    const line = w.findComponent({ name: 'Line' })
    expect(line.props('data')).toEqual({
      labels: ['Jan', 'Feb'],
      datasets: [expect.objectContaining({ label: 'Price', data: [1, 2], borderColor: '#4a4458', backgroundColor: '#4a445833' })],
    })
    expect(line.props('options')).toMatchObject({ responsive: true, maintainAspectRatio: false })
  })
})
