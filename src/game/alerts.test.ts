import { beforeEach, expect, test } from 'vitest'
import { AlertActionType, alertStore, AlertViewController } from './alerts.ts'

beforeEach(() => AlertViewController.clearAlerts())

function present(title: string, handler: (() => void) | null = null) {
  const alert = new AlertViewController(title)
  alert.addAction('Dismiss', AlertActionType.Default, handler)
  alert.presentView()
  return alert
}

test('pressing a button runs its handler, removes the alert, then runs the completion step', () => {
  const order: string[] = []
  const alert = present('First', () => order.push(`handler, open: ${alertStore.open.length}`))
  alert.completionHandler = () => order.push(`completion, open: ${alertStore.open.length}`)

  alert.press(alert.actions[0])

  expect(order).toEqual(['handler, open: 1', 'completion, open: 0'])
})

test('an alert opened by a handler is open before the pressed one goes, and stays', () => {
  let openDuringHandler = 0
  const first = present('First', () => {
    present('Second')
    openDuringHandler = alertStore.open.length
  })

  first.press(first.actions[0])

  expect(openDuringHandler).toBe(2)
  expect(alertStore.open.map((alert) => alert.title)).toEqual(['Second'])
})

test('currentAlertTitle is the oldest open alert, or undefined', () => {
  expect(AlertViewController.currentAlertTitle()).toBeUndefined()
  present('Oldest')
  present('Newest')
  expect(AlertViewController.currentAlertTitle()).toBe('Oldest')
})

test('clearAlerts closes every open alert', () => {
  present('One')
  present('Two')
  present('Three')

  AlertViewController.clearAlerts()

  expect(alertStore.open).toEqual([])
})

test('presentAlertWithDismiss opens one alert with a Dismiss button that does nothing', () => {
  AlertViewController.presentAlertWithDismiss('Hello')

  const [alert] = alertStore.open
  expect(alert.title).toBe('Hello')
  expect(alert.actions.map((action) => [action.title, action.handler])).toEqual([['Dismiss', null]])
})

test('button ids are built from the alert id and the title', () => {
  const plain = new AlertViewController('Plain')
  const named = new AlertViewController('Named', 'Plunder_plunder')

  expect(plain.elementId('alertvc-title')).toBe('alertvc-title')
  expect(plain.buttonId('Yes, drink it')).toBe('alertButton_Yes__drink_it')
  expect(named.elementId('alertvc-customView')).toBe('alertvc-customView-Plunder_plunder')
  expect(named.buttonId('Done')).toBe('alertButton__Plunder_plunderDone')
})
