import { expect, onTestFinished, test } from 'vitest';
import { AccessoryType } from '../game/Accessory.ts';
import { alertStore, AlertViewController } from '../game/alerts.ts';
import { Ship, ShipModelType } from '../game/Ship.ts';
import { runReplayLog } from './flows/harness.ts';
import { textOf } from './support/page.ts';

const NEW_COMMANDER = '{"idLog":[],"eventNameLog":[],"gameRandSeed":1733543535142}';
const LANDED =
  '{"idLog":["createCommander"],"eventNameLog":["click"],"gameRandSeed":1733543535142}';

// A button on the page that has the focus, as the one that opened an alert would.
function focusedButton(): HTMLButtonElement {
  const opener = document.body.appendChild(document.createElement('button'));
  onTestFinished(() => opener.remove());
  opener.focus();
  return opener;
}

test('an alert is a modal dialog, named by its text, that takes the focus', () => {
  runReplayLog(LANDED);
  focusedButton();

  AlertViewController.presentAlertWithDismiss('The engines are cold.');

  const dialog = document.querySelector('dialog')!;
  expect(dialog.matches(':modal')).toBe(true);
  const title = document.getElementById(dialog.getAttribute('aria-labelledby')!);
  expect(textOf(title)).toBe('The engines are cold.');
  expect(dialog.contains(document.activeElement)).toBe(true);
});

test('answering an alert gives the focus back to where it was', () => {
  runReplayLog(LANDED);
  const opener = focusedButton();
  AlertViewController.presentAlertWithDismiss('The engines are cold.');

  document.querySelector<HTMLElement>('dialog button')!.click();

  expect(document.querySelector('dialog')).toBeNull();
  expect(document.activeElement).toBe(opener);
});

test('an alert needs an answer: Escape does not close it', () => {
  runReplayLog(LANDED);
  AlertViewController.presentAlertWithDismiss('The engines are cold.');
  const dialog = document.querySelector('dialog')!;

  const cancel = new Event('cancel', { cancelable: true });
  dialog.dispatchEvent(cancel);

  expect(cancel.defaultPrevented).toBe(true);
  expect(alertStore.open).toHaveLength(1);
});

test('the navigation is a list of real buttons, and the open screen is marked', () => {
  const replay = runReplayLog(LANDED);
  const items = [...document.querySelectorAll('#subVCButtonsDiv > li')];

  expect(items.length).toBeGreaterThan(5);
  expect(items.every(item => item.firstElementChild?.tagName === 'BUTTON')).toBe(true);
  expect(document.querySelector('#subVCButtonsDiv a')).toBeNull();

  replay.replayEvent('Bank', 'click');
  expect(document.getElementById('Bank')!.getAttribute('aria-current')).toBe('page');
  expect(document.getElementById('Warp')!.hasAttribute('aria-current')).toBe(false);
});

test('every picture has a text alternative, on the first screens', () => {
  runReplayLog(NEW_COMMANDER);
  expect(document.querySelectorAll('#game img:not([alt])')).toHaveLength(0);

  const replay = runReplayLog(LANDED);
  replay.replayEvent('Ship Yard', 'click');
  expect(document.querySelectorAll('#game img').length).toBeGreaterThan(5);
  expect(document.querySelectorAll('#game img:not([alt])')).toHaveLength(0);
});

test('every input on the new-commander screen has a label', () => {
  runReplayLog(NEW_COMMANDER);
  const inputs = [...document.querySelectorAll<HTMLInputElement>('#game input, #game select')];

  expect(inputs.length).toBeGreaterThan(4);
  expect(inputs.filter(input => input.labels?.length === 0).map(input => input.id)).toEqual([]);
});

test('the bank does not show the same amount on two buttons', () => {
  const replay = runReplayLog(LANDED);
  replay.session.game!.commander.debt = 10;
  replay.replayEvent('Bank', 'click');

  const ids = [...document.querySelectorAll('#game button')].map(button => button.id);
  expect(ids.length).toBe(new Set(ids).size);
});

test('two identical pieces of equipment have sell buttons with different ids', () => {
  const replay = runReplayLog(LANDED);
  const { commander } = replay.session.game!;
  commander.ship = Ship.create(ShipModelType.Hornet); // three weapon slots
  commander.ship.addAccessoryOfType(AccessoryType.WeaponPulseLaser);
  commander.ship.addAccessoryOfType(AccessoryType.WeaponPulseLaser);
  replay.replayEvent('Equipment', 'click');

  const ids = [...document.querySelectorAll('#game [id^="sell_"]')].map(button => button.id);
  // The first keeps the id that recordings press; the second gets a number.
  expect(ids).toEqual(['sell_Pulse_laser', 'sell_Pulse_laser_2']);
});
